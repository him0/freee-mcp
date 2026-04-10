import { describe, expect, it } from 'vitest';
import { scrubErrorMessage, serializeErrorChain } from './error-serializer.js';

describe('scrubErrorMessage', () => {
  it('masks 6+ digit numeric IDs', () => {
    expect(scrubErrorMessage('company_id=12345678 failed')).toBe(
      'company_id=[REDACTED_ID] failed',
    );
  });

  it('leaves short integers (status codes, line numbers) alone', () => {
    // 3-digit status codes and single/double-digit line numbers must stay readable
    // so stack traces and error summaries remain useful.
    expect(scrubErrorMessage('HTTP 500 at line 42')).toBe('HTTP 500 at line 42');
  });

  it('masks email addresses', () => {
    expect(scrubErrorMessage('User user@example.com failed')).toBe(
      'User [REDACTED_EMAIL] failed',
    );
  });

  it('masks both emails and numeric IDs in one pass', () => {
    expect(scrubErrorMessage('user@x.io id=99999999')).toBe(
      '[REDACTED_EMAIL] id=[REDACTED_ID]',
    );
  });

  it('returns empty string unchanged', () => {
    expect(scrubErrorMessage('')).toBe('');
  });

  it('returns plain messages unchanged', () => {
    expect(scrubErrorMessage('timeout waiting for upstream')).toBe(
      'timeout waiting for upstream',
    );
  });
});

describe('serializeErrorChain', () => {
  it('serializes a plain Error', () => {
    const chain = serializeErrorChain(new Error('boom'));
    expect(chain).toHaveLength(1);
    expect(chain[0].name).toBe('Error');
    expect(chain[0].message).toBe('boom');
    expect(typeof chain[0].stack).toBe('string');
  });

  it('walks a 2-level Error.cause chain', () => {
    const root = new Error('root cause');
    const wrapped = new Error('wrapper', { cause: root });

    const chain = serializeErrorChain(wrapped);

    expect(chain).toHaveLength(2);
    expect(chain[0].message).toBe('wrapper');
    expect(chain[1].message).toBe('root cause');
  });

  it('walks a 3-level Error.cause chain', () => {
    const leaf = new Error('leaf');
    const mid = new Error('mid', { cause: leaf });
    const top = new Error('top', { cause: mid });

    const chain = serializeErrorChain(top);

    expect(chain).toHaveLength(3);
    expect(chain.map((e) => e.message)).toEqual(['top', 'mid', 'leaf']);
  });

  it('respects maxDepth', () => {
    // Construct a 5-deep chain but cap at 2.
    const e1 = new Error('e1');
    const e2 = new Error('e2', { cause: e1 });
    const e3 = new Error('e3', { cause: e2 });
    const e4 = new Error('e4', { cause: e3 });
    const e5 = new Error('e5', { cause: e4 });

    const chain = serializeErrorChain(e5, 2);
    expect(chain).toHaveLength(2);
    expect(chain[0].message).toBe('e5');
    expect(chain[1].message).toBe('e4');
  });

  it('breaks on circular Error.cause references', () => {
    const a = new Error('a') as Error & { cause?: unknown };
    const b = new Error('b') as Error & { cause?: unknown };
    a.cause = b;
    b.cause = a;

    const chain = serializeErrorChain(a);
    // Must terminate instead of looping forever. Both errors visited exactly once.
    expect(chain.length).toBeLessThanOrEqual(2);
    expect(chain[0].message).toBe('a');
  });

  it('scrubs numeric IDs from error messages', () => {
    const err = new Error('company_id 87654321 not found');
    const chain = serializeErrorChain(err);
    expect(chain[0].message).toBe('company_id [REDACTED_ID] not found');
  });

  it('scrubs numeric IDs from stack traces', () => {
    const err = new Error('context: user=98765432');
    const chain = serializeErrorChain(err);
    // Stack traces contain the message string too, so the redaction propagates.
    expect(chain[0].stack).toContain('[REDACTED_ID]');
    expect(chain[0].stack).not.toContain('98765432');
  });

  it('normalizes non-Error throws', () => {
    const chain = serializeErrorChain('plain string throw');
    expect(chain).toHaveLength(1);
    // serialize-error wraps strings into Error-shaped objects.
    expect(typeof chain[0].name).toBe('string');
  });

  it('handles null and undefined gracefully', () => {
    expect(serializeErrorChain(null)).toEqual([]);
    expect(serializeErrorChain(undefined)).toEqual([]);
  });

  it('preserves error.code when present', () => {
    const err = new Error('enoent') as Error & { code?: string };
    err.code = 'ENOENT';
    const chain = serializeErrorChain(err);
    expect(chain[0].code).toBe('ENOENT');
  });
});
