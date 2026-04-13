import type { Attributes, Context, Link, SpanKind } from '@opentelemetry/api';
import { SpanKind as SpanKindEnum } from '@opentelemetry/api';
import {
  AlwaysOffSampler,
  AlwaysOnSampler,
  type Sampler,
  type SamplingResult,
  TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-base';
import { getLogger } from '../server/logger.js';

/**
 * Custom head-based sampler that picks a sampling ratio per rule, where each
 * rule matches on either the MCP tool name, an outgoing HTTP client method,
 * or an inbound HTTP server route.
 *
 * Rules are read at startup from the `OTEL_TRACES_SAMPLER_RULES` env var as
 * a comma-separated DSL:
 *
 *   tool=freee_api_get:0.1   — match `mcp.tool ${name}` spans by name attr
 *   method=POST:1.0          — match HTTP CLIENT spans for that method
 *   http=GET /mcp:0.2        — match HTTP SERVER spans for that method+path
 *   default=0.5              — fallback for spans that match no rule
 *
 * Rules are evaluated in declared order; first match wins. The fallback is
 * used when no rule matches. If parsing fails for an individual rule we log
 * a warning and skip it (never throw — the process must keep starting).
 */

interface CompiledRule {
  source: string;
  match: (spanName: string, kind: SpanKind, attrs: Attributes) => boolean;
  inner: Sampler;
}

interface CompiledRuleSet {
  rules: CompiledRule[];
  fallback: Sampler;
}

function ratioToSampler(ratio: number): Sampler {
  if (Number.isNaN(ratio)) return new AlwaysOnSampler();
  if (ratio <= 0) return new AlwaysOffSampler();
  if (ratio >= 1) return new AlwaysOnSampler();
  return new TraceIdRatioBasedSampler(ratio);
}

function compileRule(raw: string): CompiledRule | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Split on the LAST `:` so values containing `:` (e.g. `http=GET /api/:id:0.5`,
  // `method=POST:1.0`) parse correctly: the suffix after the last colon is the
  // ratio, the prefix is the matcher. This relies on the matcher value not
  // ending in a colon-prefixed digit run, which the supported `tool`/`method`/`http`
  // forms never do.
  const lastColon = trimmed.lastIndexOf(':');
  if (lastColon === -1) {
    getLogger().warn({ rule: trimmed }, 'sampler rule: missing ratio, skipped');
    return null;
  }
  const lhs = trimmed.slice(0, lastColon);
  const rhs = trimmed.slice(lastColon + 1);
  const ratio = Number.parseFloat(rhs);
  if (Number.isNaN(ratio)) {
    getLogger().warn({ rule: trimmed }, 'sampler rule: ratio is not a number, skipped');
    return null;
  }

  const eq = lhs.indexOf('=');
  if (eq === -1) {
    getLogger().warn({ rule: trimmed }, 'sampler rule: missing matcher, skipped');
    return null;
  }
  const key = lhs.slice(0, eq).trim();
  const value = lhs.slice(eq + 1).trim();
  if (!value) {
    getLogger().warn({ rule: trimmed }, 'sampler rule: empty matcher value, skipped');
    return null;
  }

  const inner = ratioToSampler(ratio);

  switch (key) {
    case 'tool':
      return {
        source: trimmed,
        match: (_spanName, _kind, attrs) => attrs['mcp.tool.name'] === value,
        inner,
      };
    case 'method': {
      const expected = `HTTP ${value.toUpperCase()}`;
      return {
        source: trimmed,
        match: (spanName, spanKind) =>
          spanKind === SpanKindEnum.CLIENT && spanName === expected,
        inner,
      };
    }
    case 'http': {
      const expected = `HTTP ${value}`;
      return {
        source: trimmed,
        match: (spanName, spanKind) =>
          spanKind === SpanKindEnum.SERVER && spanName === expected,
        inner,
      };
    }
    default:
      getLogger().warn({ rule: trimmed, key }, 'sampler rule: unknown matcher key, skipped');
      return null;
  }
}

/**
 * Parse the rules DSL into a compiled rule set. Returns `null` when the env
 * var is unset/blank or every segment fails to parse — callers should treat
 * that as "no rules configured" and fall back to a legacy ratio.
 *
 * Production code should normally go through `resolveRootSampler`; this is
 * exported separately so unit tests can assert on the parsed shape.
 */
export function parseRulesFromEnv(rulesEnv: string | undefined): CompiledRuleSet | null {
  if (!rulesEnv?.trim()) return null;

  const rules: CompiledRule[] = [];
  let fallback: Sampler | null = null;

  for (const segment of rulesEnv.split(',')) {
    const trimmed = segment.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('default=')) {
      const ratio = Number.parseFloat(trimmed.slice('default='.length));
      if (Number.isNaN(ratio)) {
        getLogger().warn({ rule: trimmed }, 'sampler rule: default ratio invalid, skipped');
        continue;
      }
      fallback = ratioToSampler(ratio);
      continue;
    }

    try {
      const rule = compileRule(trimmed);
      if (rule) rules.push(rule);
    } catch (error) {
      getLogger().warn(
        { rule: trimmed, err: error instanceof Error ? error.message : String(error) },
        'sampler rule: parse error, skipped',
      );
    }
  }

  if (rules.length === 0 && !fallback) return null;

  return {
    rules,
    fallback: fallback ?? new AlwaysOnSampler(),
  };
}

/**
 * Sampler that delegates to the first matching rule. Falls back to the
 * configured default sampler when no rule matches.
 *
 * Wrapped in a `ParentBasedSampler` at install time so that downstream context
 * propagation (incoming W3C traceparent) overrides the head-based decision
 * when a parent span exists.
 */
export class RuleBasedSampler implements Sampler {
  constructor(private readonly set: CompiledRuleSet) {}

  shouldSample(
    context: Context,
    traceId: string,
    spanName: string,
    spanKind: SpanKind,
    attributes: Attributes,
    links: Link[],
  ): SamplingResult {
    for (const rule of this.set.rules) {
      if (rule.match(spanName, spanKind, attributes)) {
        return rule.inner.shouldSample(context, traceId, spanName, spanKind, attributes, links);
      }
    }
    return this.set.fallback.shouldSample(
      context,
      traceId,
      spanName,
      spanKind,
      attributes,
      links,
    );
  }

  toString(): string {
    const ruleSummary = this.set.rules.map((r) => r.source).join(',');
    return `RuleBasedSampler(${ruleSummary || '<no rules>'})`;
  }
}

/**
 * Single decision point for the OTel root sampler. Prefers the rich rules DSL
 * when `OTEL_TRACES_SAMPLER_RULES` is set; otherwise falls back to the legacy
 * single-ratio knob `OTEL_TRACES_SAMPLER_ARG` so existing deployments keep
 * working unchanged. Always returns a usable Sampler — never null.
 *
 * Exported for use by `initTelemetry` and for unit tests that want to exercise
 * both branches without re-wiring the full OTel SDK.
 */
export function resolveRootSampler(
  rulesEnv: string | undefined,
  legacyRatioArg: string | undefined,
): Sampler {
  const compiledRules = parseRulesFromEnv(rulesEnv);
  if (compiledRules) {
    return new RuleBasedSampler(compiledRules);
  }
  return ratioToSampler(Number.parseFloat(legacyRatioArg ?? '1.0'));
}

