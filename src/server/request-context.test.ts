import { describe, expect, it } from 'vitest';
import {
  RequestRecorder,
  getCurrentRecorder,
  withRequestRecorder,
} from './request-context.js';

function makeRecorder(overrides: Partial<ConstructorParameters<typeof RequestRecorder>[0]> = {}) {
  return new RequestRecorder({
    request_id: 'req-test',
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
        api_method: 'GET',
        api_path_pattern: '/api/:id/deals',
        query_keys: ['limit', 'offset'],
        status: 'success',
        duration_ms: 123,
      });

      const payload = recorder.buildPayload({ status: 200, duration_ms: 200 });
      expect(payload.mcp).toMatchObject({
        tool_call_count: 1,
        tool_calls: [
          expect.objectContaining({
            tool: 'freee_api_get',
            query_keys: ['limit', 'offset'],
          }),
        ],
      });
    });

    it('buffers api calls', () => {
      const recorder = makeRecorder();

      recorder.recordApiCall({
        method: 'GET',
        path_pattern: '/api/:id/deals',
        status_code: 200,
        duration_ms: 50,
        company_id: '12345',
        user_id: 'user-1',
        error_type: null,
      });

      const payload = recorder.buildPayload({ status: 200, duration_ms: 100 });
      expect(payload.api_call_count).toBe(1);
      expect(payload.api_calls).toEqual([
        expect.objectContaining({ method: 'GET', status_code: 200, error_type: null }),
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
        api_calls: [],
        api_call_count: 0,
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
