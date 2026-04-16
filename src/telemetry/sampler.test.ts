import { ROOT_CONTEXT, SpanKind, type Attributes } from '@opentelemetry/api';
import { SamplingDecision } from '@opentelemetry/sdk-trace-base';
import { describe, expect, it } from 'vitest';
import { RuleBasedSampler, parseRulesFromEnv, resolveRootSampler } from './sampler.js';

const TRACE_ID = '0123456789abcdef0123456789abcdef';

/**
 * Compile a rules DSL string into a RuleBasedSampler, asserting that parsing
 * succeeded. The tests below all pass valid input, so a `null` here is a real
 * test bug — fail loudly instead of silently substituting a fallback.
 */
function compile(dsl: string): RuleBasedSampler {
  const set = parseRulesFromEnv(dsl);
  if (!set) throw new Error(`compile() expected non-null for DSL: ${dsl}`);
  return new RuleBasedSampler(set);
}

function decide(
  sampler: RuleBasedSampler,
  spanName: string,
  spanKind: SpanKind,
  attributes: Attributes = {},
) {
  return sampler.shouldSample(ROOT_CONTEXT, TRACE_ID, spanName, spanKind, attributes, []);
}

describe('parseRulesFromEnv', () => {
  it('returns null for undefined or empty input', () => {
    expect(parseRulesFromEnv(undefined)).toBeNull();
    expect(parseRulesFromEnv('')).toBeNull();
    expect(parseRulesFromEnv('   ')).toBeNull();
  });

  it('parses a single tool rule', () => {
    const set = parseRulesFromEnv('tool=freee_api_get:0.5');
    expect(set).not.toBeNull();
    expect(set?.rules).toHaveLength(1);
    expect(set?.rules[0]?.source).toBe('tool=freee_api_get:0.5');
  });

  it('parses multiple rules separated by commas, including a default', () => {
    const set = parseRulesFromEnv(
      'tool=freee_api_get:1.0,method=POST:0.5,http=GET /mcp:0.1,default=0.0',
    );
    expect(set).not.toBeNull();
    expect(set?.rules).toHaveLength(3);
    expect(set?.rules.map((r) => r.source)).toEqual([
      'tool=freee_api_get:1.0',
      'method=POST:0.5',
      'http=GET /mcp:0.1',
    ]);
  });

  it('skips invalid rules instead of throwing', () => {
    const set = parseRulesFromEnv(
      'tool=freee_api_get:1.0,bogus_rule_no_colon,default=not_a_number,unknown=x:0.5',
    );
    expect(set).not.toBeNull();
    // Only the first rule survives.
    expect(set?.rules).toHaveLength(1);
    expect(set?.rules[0]?.source).toBe('tool=freee_api_get:1.0');
  });

  it('rejects whitespace-only matcher values', () => {
    // Regression guard for `tool=   :0.5` — the trim() must fall through to
    // the empty-value warning rather than installing a rule that matches
    // tools named " ".
    expect(parseRulesFromEnv('tool=   :0.5')).toBeNull();
    expect(parseRulesFromEnv('tool=\t:0.5')).toBeNull();
  });

  it('returns null when no rules and no default parse successfully', () => {
    expect(parseRulesFromEnv('definitely_invalid')).toBeNull();
    expect(parseRulesFromEnv('default=oops,also_bad')).toBeNull();
  });
});

describe('RuleBasedSampler', () => {
  it('matches a tool rule via the mcp.tool.name attribute and samples it', () => {
    const sampler = compile('tool=freee_api_get:1.0,default=0.0');

    const sampled = decide(sampler, 'mcp.tool freee_api_get', SpanKind.INTERNAL, {
      'mcp.tool.name': 'freee_api_get',
    });
    expect(sampled.decision).toBe(SamplingDecision.RECORD_AND_SAMPLED);

    const dropped = decide(sampler, 'mcp.tool freee_api_post', SpanKind.INTERNAL, {
      'mcp.tool.name': 'freee_api_post',
    });
    expect(dropped.decision).toBe(SamplingDecision.NOT_RECORD);
  });

  it('matches a method rule on HTTP CLIENT spans only', () => {
    const sampler = compile('method=POST:1.0,default=0.0');

    const clientPost = decide(sampler, 'HTTP POST', SpanKind.CLIENT);
    expect(clientPost.decision).toBe(SamplingDecision.RECORD_AND_SAMPLED);

    // Same span name on a SERVER span must NOT match the method= rule.
    const serverPost = decide(sampler, 'HTTP POST', SpanKind.SERVER);
    expect(serverPost.decision).toBe(SamplingDecision.NOT_RECORD);
  });

  it('matches an http rule on HTTP SERVER spans by full method+path', () => {
    const sampler = compile('http=GET /mcp:1.0,default=0.0');

    const matching = decide(sampler, 'HTTP GET /mcp', SpanKind.SERVER);
    expect(matching.decision).toBe(SamplingDecision.RECORD_AND_SAMPLED);

    const wrongPath = decide(sampler, 'HTTP GET /healthz', SpanKind.SERVER);
    expect(wrongPath.decision).toBe(SamplingDecision.NOT_RECORD);
  });

  it('falls back to the default sampler when no rule matches', () => {
    const sampler = compile('tool=freee_api_get:1.0,default=1.0');

    // Tool name doesn't match the rule, but default=1.0 (AlwaysOn) wins.
    const result = decide(sampler, 'mcp.tool freee_api_post', SpanKind.INTERNAL, {
      'mcp.tool.name': 'freee_api_post',
    });
    expect(result.decision).toBe(SamplingDecision.RECORD_AND_SAMPLED);
  });

  it('honors first-match-wins ordering between multiple rules', () => {
    // tool rule fires first and drops the span; later method=POST:1.0 must
    // not be reached for the matching tool span.
    const sampler = compile('tool=freee_api_post:0.0,method=POST:1.0,default=1.0');

    const result = decide(sampler, 'mcp.tool freee_api_post', SpanKind.INTERNAL, {
      'mcp.tool.name': 'freee_api_post',
    });
    expect(result.decision).toBe(SamplingDecision.NOT_RECORD);
  });
});

describe('resolveRootSampler', () => {
  it('uses the rules DSL when set', () => {
    // Easiest behavioural check: install a rule that drops everything via
    // default=0.0, then verify a non-matching span gets NOT_RECORD.
    const sampler = resolveRootSampler('default=0.0', undefined);
    const result = sampler.shouldSample(
      ROOT_CONTEXT,
      TRACE_ID,
      'arbitrary',
      SpanKind.INTERNAL,
      {},
      [],
    );
    expect(result.decision).toBe(SamplingDecision.NOT_RECORD);
  });

  it('falls back to the legacy single-ratio arg when rules env is unset', () => {
    // legacy "drop everything" for a non-matching root span.
    const dropAll = resolveRootSampler(undefined, '0');
    const dropResult = dropAll.shouldSample(
      ROOT_CONTEXT,
      TRACE_ID,
      'arbitrary',
      SpanKind.INTERNAL,
      {},
      [],
    );
    expect(dropResult.decision).toBe(SamplingDecision.NOT_RECORD);

    // legacy "always on" path — unset and "1" both must produce sampled.
    const allOn = resolveRootSampler(undefined, '1');
    const allOnResult = allOn.shouldSample(
      ROOT_CONTEXT,
      TRACE_ID,
      'arbitrary',
      SpanKind.INTERNAL,
      {},
      [],
    );
    expect(allOnResult.decision).toBe(SamplingDecision.RECORD_AND_SAMPLED);
  });

  it('treats an empty/blank rules env as "no rules" and uses legacy arg', () => {
    const sampler = resolveRootSampler('   ', '0');
    const result = sampler.shouldSample(
      ROOT_CONTEXT,
      TRACE_ID,
      'arbitrary',
      SpanKind.INTERNAL,
      {},
      [],
    );
    expect(result.decision).toBe(SamplingDecision.NOT_RECORD);
  });

  it('falls back to AlwaysOn when the legacy ratio env is non-numeric (loud warn, no crash)', () => {
    // Misconfigured `OTEL_TRACES_SAMPLER_ARG=garbage` must not crash the
    // process. The legacy path defaults to AlwaysOn (worst-case for cost) but
    // still serves traffic — the operator gets a warn log to investigate.
    const sampler = resolveRootSampler(undefined, 'garbage');
    const result = sampler.shouldSample(
      ROOT_CONTEXT,
      TRACE_ID,
      'arbitrary',
      SpanKind.INTERNAL,
      {},
      [],
    );
    expect(result.decision).toBe(SamplingDecision.RECORD_AND_SAMPLED);
  });
});

describe('parseRulesFromEnv duplicate default', () => {
  it('lets the later default win when default= is repeated', () => {
    // Regression guard: tolerate duplicate default= but warn (warn observed
    // via getLogger, not asserted here). Last value must win behaviourally,
    // so a non-matching span follows the second default=1.0 and gets sampled.
    const sampler = compile('default=0.0,default=1.0');
    const result = decide(sampler, 'arbitrary', SpanKind.INTERNAL);
    expect(result.decision).toBe(SamplingDecision.RECORD_AND_SAMPLED);
  });
});
