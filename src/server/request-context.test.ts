import { describe, expect, it } from 'vitest';
import {
  RequestRecorder,
  UNRECORDED_ERROR_NAME,
  UNRECORDED_ERROR_TYPE,
  getCurrentRecorder,
  resolveCid,
  withRequestRecorder,
} from './request-context.js';

function makeRecorder(overrides: Partial<ConstructorParameters<typeof RequestRecorder>[0]> = {}) {
  return new RequestRecorder({
    request_id: 'req-test',
    cid: 'cid-test',
    source_ip: '127.0.0.1',
    method: 'POST',
    path: '/mcp',
    ...overrides,
  });
}

describe('RequestRecorder', () => {
  describe('recordToolCall / recordApiCall / recordError', () => {
    it('buffers tool calls and exposes them via buildPayload', () => {
      const recorder = makeRecorder();

      recorder.recordToolCall({
        tool: 'freee_api_get',
        service: 'accounting',
        status: 'success',
        duration_ms: 123,
      });

      const payload = recorder.buildPayload({ status: 200, duration_ms: 200 });
      expect(payload.mcp).toMatchObject({
        tool_call_count: 1,
        tool_calls: [
          expect.objectContaining({
            tool: 'freee_api_get',
            service: 'accounting',
            status: 'success',
            duration_ms: 123,
          }),
        ],
      });
    });

    it('buffers api calls with query_keys (privacy-safe key names)', () => {
      const recorder = makeRecorder();

      recorder.recordApiCall({
        method: 'GET',
        path_pattern: '/api/:id/deals',
        status_code: 200,
        duration_ms: 50,
        company_id: '12345',
        user_id: 'user-1',
        error_type: null,
        query_keys: ['limit', 'offset'],
      });

      const payload = recorder.buildPayload({ status: 200, duration_ms: 100 });
      expect(payload.api.call_count).toBe(1);
      expect(payload.api.calls).toEqual([
        expect.objectContaining({
          method: 'GET',
          status_code: 200,
          error_type: null,
          query_keys: ['limit', 'offset'],
        }),
      ]);
    });

    it('records errors with a timestamp', () => {
      const recorder = makeRecorder();

      recorder.recordError({
        source: 'api_client',
        status_code: 500,
        error_type: 'http_error',
        chain: [{ name: 'Error', message: 'boom' }],
      });

      const payload = recorder.buildPayload({ status: 200, duration_ms: 100 });
      const errors = payload.errors as Array<{ source: string; timestamp: number; chain: unknown }>;
      expect(errors).toHaveLength(1);
      expect(errors[0].source).toBe('api_client');
      expect(typeof errors[0].timestamp).toBe('number');
      expect(errors[0].chain).toEqual([{ name: 'Error', message: 'boom' }]);
    });
  });

  describe('buildPayload', () => {
    it('produces the canonical log shape', () => {
      const recorder = makeRecorder({
        request_id: 'req-canonical',
        source_ip: '10.0.0.1',
        method: 'POST',
        path: '/mcp',
      });
      recorder.updateContext({ user_id: 'user-42', session_id: 'sess-xyz' });

      const payload = recorder.buildPayload({ status: 200, duration_ms: 321 });

      expect(payload).toEqual({
        request_id: 'req-canonical',
        cid: 'cid-test',
        source_ip: '10.0.0.1',
        user_agent: null,
        user_id: 'user-42',
        session_id: 'sess-xyz',
        http: {
          method: 'POST',
          path: '/mcp',
          status: 200,
          duration_ms: 321,
        },
        mcp: {
          tool_calls: [],
          tool_call_count: 0,
        },
        api: {
          calls: [],
          call_count: 0,
        },
        errors: [],
      });
    });

    it('defaults user_id and session_id to null when unset', () => {
      const recorder = makeRecorder();
      const payload = recorder.buildPayload({ status: 200, duration_ms: 10 });
      expect(payload.user_id).toBeNull();
      expect(payload.session_id).toBeNull();
    });

    it('includes user_agent in the payload when set on the context', () => {
      const recorder = makeRecorder({
        user_agent: 'ClaudeDesktop/1.2.3 (macOS 15.1)',
      });
      const payload = recorder.buildPayload({ status: 200, duration_ms: 1 });
      expect(payload.user_agent).toBe('ClaudeDesktop/1.2.3 (macOS 15.1)');
    });

    it('serializes user_agent as null when unset', () => {
      const recorder = makeRecorder();
      const payload = recorder.buildPayload({ status: 200, duration_ms: 1 });
      expect(payload.user_agent).toBeNull();
    });
  });

  describe('flushOnce', () => {
    it('returns true on the first call and false thereafter', () => {
      const recorder = makeRecorder();
      expect(recorder.flushOnce()).toBe(true);
      expect(recorder.flushOnce()).toBe(false);
      expect(recorder.flushOnce()).toBe(false);
    });
  });

  describe('synthesizeFallbackErrorIfMissing', () => {
    it('synthesizes a placeholder ErrorInfo when errors[] is empty', () => {
      const recorder = makeRecorder();

      recorder.synthesizeFallbackErrorIfMissing(500);

      const payload = recorder.buildPayload({ status: 500, duration_ms: 1 });
      expect(payload.errors).toHaveLength(1);
      expect(payload.errors[0]).toMatchObject({
        source: 'response',
        status_code: 500,
        error_type: UNRECORDED_ERROR_TYPE,
      });
      expect(payload.errors[0]?.chain[0]?.name).toBe(UNRECORDED_ERROR_NAME);
      expect(payload.errors[0]?.chain[0]?.message).toContain('HTTP 500');
    });

    it('embeds method and path into the synthesized message for Datadog drilldown', () => {
      const recorder = makeRecorder({ method: 'GET', path: '/authorize' });

      recorder.synthesizeFallbackErrorIfMissing(400);

      const payload = recorder.buildPayload({ status: 400, duration_ms: 1 });
      const message = payload.errors[0]?.chain[0]?.message ?? '';
      expect(message).toContain('GET');
      expect(message).toContain('/authorize');
      expect(message).toContain('HTTP 400');
    });

    it('is a no-op when an explicit recordError was already called', () => {
      const recorder = makeRecorder();
      recorder.recordError({
        source: 'redis_unavailable',
        status_code: 503,
        error_type: 'redis_unavailable',
        chain: [{ name: 'RedisUnavailableError', message: 'down' }],
      });

      recorder.synthesizeFallbackErrorIfMissing(503);

      const payload = recorder.buildPayload({ status: 503, duration_ms: 1 });
      expect(payload.errors).toHaveLength(1);
      expect(payload.errors[0]?.source).toBe('redis_unavailable');
    });

    it('embeds the actual status code into the synthesized message', () => {
      const recorder = makeRecorder();
      recorder.synthesizeFallbackErrorIfMissing(401);

      const payload = recorder.buildPayload({ status: 401, duration_ms: 1 });
      expect(payload.errors[0]?.status_code).toBe(401);
      expect(payload.errors[0]?.chain[0]?.message).toContain('HTTP 401');
    });

    it('is idempotent — calling twice produces exactly one synthesized entry', () => {
      // The middleware's flushOnce() guarantees one call per request, but
      // this method is public — lock the contract so a future bypass of
      // the errors.length guard cannot silently double-append.
      const recorder = makeRecorder();
      recorder.synthesizeFallbackErrorIfMissing(500);
      recorder.synthesizeFallbackErrorIfMissing(500);

      const payload = recorder.buildPayload({ status: 500, duration_ms: 1 });
      expect(payload.errors).toHaveLength(1);
    });
  });

  describe('updateContext', () => {
    it('patches only the allowed fields', () => {
      const recorder = makeRecorder({
        request_id: 'req-1',
        source_ip: '127.0.0.1',
        method: 'GET',
        path: '/mcp',
      });

      recorder.updateContext({ user_id: 'u-1' });
      const p1 = recorder.buildPayload({ status: 200, duration_ms: 1 });
      expect(p1.user_id).toBe('u-1');
      expect(p1.session_id).toBeNull();

      recorder.updateContext({ session_id: 's-1' });
      const p2 = recorder.buildPayload({ status: 200, duration_ms: 1 });
      expect(p2.user_id).toBe('u-1');
      expect(p2.session_id).toBe('s-1');

      // Request metadata from the constructor is preserved.
      expect(p2.request_id).toBe('req-1');
      expect((p2.http as { method: string }).method).toBe('GET');
    });
  });
});

describe('AsyncLocalStorage integration', () => {
  it('returns undefined outside withRequestRecorder', () => {
    expect(getCurrentRecorder()).toBeUndefined();
  });

  it('makes the recorder accessible inside withRequestRecorder', () => {
    const recorder = makeRecorder();
    withRequestRecorder(recorder, () => {
      expect(getCurrentRecorder()).toBe(recorder);
    });
    expect(getCurrentRecorder()).toBeUndefined();
  });

  it('isolates recorders across concurrent async contexts', async () => {
    const rA = makeRecorder({ request_id: 'A', source_ip: '1.1.1.1', method: 'GET', path: '/a' });
    const rB = makeRecorder({ request_id: 'B', source_ip: '2.2.2.2', method: 'GET', path: '/b' });

    const runA = (): Promise<string> =>
      withRequestRecorder(rA, async () => {
        // Yield so that runB interleaves before we read back our context.
        await new Promise((r) => setTimeout(r, 5));
        getCurrentRecorder()?.recordToolCall({
          tool: 'tool_a',
          status: 'success',
          duration_ms: 1,
        });
        return (
          (getCurrentRecorder()?.buildPayload({ status: 200, duration_ms: 1 })
            .request_id as string) ?? 'none'
        );
      });

    const runB = (): Promise<string> =>
      withRequestRecorder(rB, async () => {
        await new Promise((r) => setTimeout(r, 1));
        getCurrentRecorder()?.recordToolCall({
          tool: 'tool_b',
          status: 'success',
          duration_ms: 1,
        });
        return (
          (getCurrentRecorder()?.buildPayload({ status: 200, duration_ms: 1 })
            .request_id as string) ?? 'none'
        );
      });

    const [idA, idB] = await Promise.all([runA(), runB()]);
    expect(idA).toBe('A');
    expect(idB).toBe('B');

    // Each recorder only ever saw its own tool call — no cross-contamination.
    const payloadA = rA.buildPayload({ status: 200, duration_ms: 1 });
    const payloadB = rB.buildPayload({ status: 200, duration_ms: 1 });
    expect((payloadA.mcp as { tool_calls: Array<{ tool: string }> }).tool_calls).toEqual([
      expect.objectContaining({ tool: 'tool_a' }),
    ]);
    expect((payloadB.mcp as { tool_calls: Array<{ tool: string }> }).tool_calls).toEqual([
      expect.objectContaining({ tool: 'tool_b' }),
    ]);
  });
});

/**
 * Direct unit tests for `resolveCid`.
 *
 * Pure-function tests covering header precedence, validation, fall-through to
 * UUID, and the explicit "do NOT partial-sanitize" contract that protects the
 * canonical log line from injection.
 */
describe('resolveCid', () => {
  // RFC 4122 version-agnostic UUID matcher — `crypto.randomUUID` returns v4
  // today, but locking the regex to `[1-5]` would needlessly couple the test
  // to the Node implementation. Charset and dash positions are what matter.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  describe('precedence', () => {
    it('prefers X-Correlation-ID over X-Request-ID when both are valid', () => {
      expect(resolveCid('correlation-1', 'request-1')).toBe('correlation-1');
    });

    it('falls back to X-Request-ID when X-Correlation-ID is absent', () => {
      expect(resolveCid(undefined, 'request-1')).toBe('request-1');
    });

    it('generates a UUID when both headers are absent', () => {
      const cid = resolveCid(undefined, undefined);
      expect(cid).toMatch(UUID_RE);
    });

    it('generates a fresh UUID on every call (no memoization)', () => {
      // Sanity: each request gets its own ID — we are NOT caching the fallback.
      const a = resolveCid(undefined, undefined);
      const b = resolveCid(undefined, undefined);
      expect(a).not.toBe(b);
    });
  });

  describe('fall-through on invalid values (no partial sanitization)', () => {
    it('falls through to X-Request-ID when X-Correlation-ID is invalid', () => {
      // Whitespace is rejected outright; we never strip-and-accept.
      expect(resolveCid('has space', 'request-1')).toBe('request-1');
    });

    it('falls through to UUID when both headers are invalid', () => {
      expect(resolveCid('bad header!', 'also bad@')).toMatch(UUID_RE);
    });

    it('rejects an empty-string X-Correlation-ID and falls through', () => {
      expect(resolveCid('', 'request-1')).toBe('request-1');
    });

    it('rejects an empty-string X-Request-ID and falls through to UUID', () => {
      expect(resolveCid(undefined, '')).toMatch(UUID_RE);
    });
  });

  describe('input type guards', () => {
    it('rejects an array-valued X-Correlation-ID and falls through', () => {
      // Node types `req.headers['x-correlation-id']` as `string | string[]`.
      // Accepting `arr.join(',')` would let an attacker smuggle commas, so a
      // `string[]` (multiple header lines coalesced) is rejected outright.
      expect(resolveCid(['a', 'b'], 'request-1')).toBe('request-1');
    });

    it('rejects an array-valued X-Request-ID and falls through to UUID', () => {
      expect(resolveCid(undefined, ['a', 'b'])).toMatch(UUID_RE);
    });

    it('rejects non-string types (number, object, null) and falls through', () => {
      expect(resolveCid(42, undefined)).toMatch(UUID_RE);
      expect(resolveCid({ value: 'x' }, undefined)).toMatch(UUID_RE);
      expect(resolveCid(null, undefined)).toMatch(UUID_RE);
    });
  });

  describe('length cap (200 chars)', () => {
    it('accepts a value exactly at the 200-char boundary', () => {
      const exactly200 = 'a'.repeat(200);
      expect(resolveCid(exactly200, undefined)).toBe(exactly200);
    });

    it('rejects a 201-char value and falls through', () => {
      const tooLong = 'a'.repeat(201);
      expect(resolveCid(tooLong, 'request-1')).toBe('request-1');
    });
  });

  describe('charset', () => {
    it('accepts a UUIDv4 verbatim', () => {
      const uuid = '0af76519-16cd-43dd-8448-eb211c80319c';
      expect(resolveCid(uuid, undefined)).toBe(uuid);
    });

    it('accepts a Crockford-base32 ULID verbatim', () => {
      // ULID = 26 alphanumerics. The spec excludes I/L/O/U; we don't enforce
      // that — we only require the cid charset, which trivially admits ULIDs.
      const ulid = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
      expect(resolveCid(ulid, undefined)).toBe(ulid);
    });

    it('accepts dotted-colon composite IDs (e.g. service:uuid)', () => {
      // Common upstream pattern: a gateway prefixes its own service name to a
      // generated UUID. Both `:` and `.` must pass through unchanged.
      const composite = 'gw.edge:0af76519-16cd-43dd-8448-eb211c80319c';
      expect(resolveCid(composite, undefined)).toBe(composite);
    });

    it('rejects whitespace, quotes, braces, and newlines (log-injection guards)', () => {
      // These are the characters most likely to corrupt a downstream log
      // parser if smuggled into a JSON-rendered canonical log line.
      for (const bad of ['has space', 'has"quote', 'has{brace}', 'has\nnewline']) {
        expect(resolveCid(bad, undefined)).toMatch(UUID_RE);
      }
    });

    it('rejects non-ASCII Unicode and falls through', () => {
      expect(resolveCid('한글', undefined)).toMatch(UUID_RE);
      expect(resolveCid('日本語', undefined)).toMatch(UUID_RE);
    });
  });
});
