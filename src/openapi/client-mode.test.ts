import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Privacy regression tests: query values and request bodies must never appear
// in the canonical log payload emitted by RequestRecorder.

type CapturedHandler = (
  args: Record<string, unknown>,
  extra?: Record<string, unknown>,
) => Promise<unknown>;

const capturedHandlers = new Map<string, CapturedHandler>();

vi.mock('../telemetry/tool-tracer.js', () => ({
  registerTracedTool: (
    _server: McpServer,
    name: string,
    _config: unknown,
    handler: CapturedHandler,
  ): void => {
    capturedHandlers.set(name, handler);
  },
  setToolAttributes: vi.fn(),
}));

vi.mock('./schema-loader.js', () => ({
  validatePathForService: vi.fn(() => ({ isValid: true, actualPath: undefined, baseUrl: undefined })),
  listAllAvailablePaths: vi.fn(() => ''),
}));

vi.mock('../api/client.js', () => ({
  makeApiRequest: vi.fn(() => Promise.resolve({ ok: true })),
  isBinaryFileResponse: vi.fn(() => false),
}));

vi.mock('../storage/context.js', () => ({
  extractTokenContext: vi.fn(() => ({ userId: 'test-user', tokenStore: {} })),
}));

const stubServer = {} as McpServer;

beforeEach(() => {
  capturedHandlers.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('generateClientModeTool - privacy', () => {
  it('never leaks query values into the recorder payload', async () => {
    // ToolCallInfo no longer carries query_keys (those live on ApiCallInfo,
    // populated inside `makeApiRequest`). Here `makeApiRequest` is mocked so
    // no api_call is recorded — the assertion is therefore strictly about the
    // tool layer not capturing user-supplied query values. The matching
    // key-name + value-keep-out coverage for the api layer lives in
    // `src/api/client.test.ts`.
    const { generateClientModeTool } = await import('./client-mode.js');
    const { RequestRecorder, withRequestRecorder } = await import('../server/request-context.js');

    generateClientModeTool(stubServer);
    const getHandler = capturedHandlers.get('freee_api_get');
    expect(getHandler).toBeDefined();

    const recorder = new RequestRecorder({
      request_id: 'req-priv-1',
      source_ip: '127.0.0.1',
      method: 'POST',
      path: '/mcp',
    });

    await withRequestRecorder(recorder, () =>
      getHandler?.(
        {
          service: 'accounting',
          path: '/api/1/deals',
          query: {
            start_issue_date: '2024-01-01',
            partner_name: 'Acme Corp (SECRET)',
            internal_memo: 'leak-this-sensitive-value',
          },
        },
        undefined,
      ),
    );

    const payload = recorder.buildPayload({ status: 200, duration_ms: 10 });
    const payloadJson = JSON.stringify(payload);

    expect(payloadJson).not.toContain('2024-01-01');
    expect(payloadJson).not.toContain('Acme Corp');
    expect(payloadJson).not.toContain('SECRET');
    expect(payloadJson).not.toContain('leak-this-sensitive-value');
  });

  it('does not capture request body values in the recorder payload', async () => {
    const { generateClientModeTool } = await import('./client-mode.js');
    const { RequestRecorder, withRequestRecorder } = await import('../server/request-context.js');

    generateClientModeTool(stubServer);
    const postHandler = capturedHandlers.get('freee_api_post');
    expect(postHandler).toBeDefined();

    const recorder = new RequestRecorder({
      request_id: 'req-priv-2',
      source_ip: '127.0.0.1',
      method: 'POST',
      path: '/mcp',
    });

    await withRequestRecorder(recorder, () =>
      postHandler?.(
        {
          service: 'accounting',
          path: '/api/1/deals',
          body: {
            amount: 99999999,
            memo: 'confidential deal notes',
            partner_email: 'ceo@example.com',
          },
        },
        undefined,
      ),
    );

    const payloadJson = JSON.stringify(recorder.buildPayload({ status: 200, duration_ms: 10 }));

    expect(payloadJson).not.toContain('99999999');
    expect(payloadJson).not.toContain('confidential');
    expect(payloadJson).not.toContain('ceo@example.com');
  });

  // Path sanitization coverage moved to `src/api/client.test.ts` —
  // `path_pattern` now lives on `ApiCallInfo` (which is recorded inside
  // `makeApiRequest`), and that path is mocked in this test file.

  it('records tool_call with error status when validation fails', async () => {
    const schemaLoader = await import('./schema-loader.js');
    vi.mocked(schemaLoader.validatePathForService).mockReturnValueOnce({
      isValid: false,
      message: 'path not found',
    });

    const { generateClientModeTool } = await import('./client-mode.js');
    const { RequestRecorder, withRequestRecorder } = await import('../server/request-context.js');

    generateClientModeTool(stubServer);
    const getHandler = capturedHandlers.get('freee_api_get');

    const recorder = new RequestRecorder({
      request_id: 'req-val-1',
      source_ip: '127.0.0.1',
      method: 'POST',
      path: '/mcp',
    });

    await withRequestRecorder(recorder, () =>
      getHandler?.({ service: 'accounting', path: '/api/1/nonexistent' }, undefined),
    );

    const payload = recorder.buildPayload({ status: 200, duration_ms: 1 });
    const toolCalls = (payload.mcp as { tool_calls: Array<{ status: string }> }).tool_calls;
    expect(toolCalls).toHaveLength(1);
    expect(toolCalls[0].status).toBe('error');

    const errors = payload.errors as Array<{ source: string; error_type?: string }>;
    expect(errors[0].source).toBe('validation');
    expect(errors[0].error_type).toBe('path_validation_failed');
  });
});

describe('coercibleRecord', () => {
  it('passes plain objects through unchanged', async () => {
    const { coercibleRecord } = await import('./client-mode.js');
    const schema = coercibleRecord('body');
    const result = schema.safeParse({ a: 1, b: 'two' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ a: 1, b: 'two' });
  });

  it('parses JSON-encoded object strings (some MCP clients send object params as strings)', async () => {
    const { coercibleRecord } = await import('./client-mode.js');
    const schema = coercibleRecord('body');
    const result = schema.safeParse('{"company_id":1,"issue_date":"2026-04-26"}');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ company_id: 1, issue_date: '2026-04-26' });
    }
  });

  it('auto-recovers from leading UTF-8 BOM and surrounding whitespace', async () => {
    const { coercibleRecord } = await import('./client-mode.js');
    const schema = coercibleRecord('body');
    const bom = String.fromCharCode(0xfeff);
    const result = schema.safeParse(`${bom}  \r\n{"a":1}\r\n  `);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ a: 1 });
  });

  it('emits a length-only error message on unparseable strings (no payload bytes leak)', async () => {
    const { coercibleRecord } = await import('./client-mode.js');
    const schema = coercibleRecord('body');
    const SECRET = 'partner_name=Acme(SECRET)';
    const result = schema.safeParse(SECRET);
    expect(result.success).toBe(false);
    if (!result.success) {
      const message = result.error.issues[0].message;
      expect(message).toMatch(/length \d+/);
      expect(message).not.toContain('Acme');
      expect(message).not.toContain('SECRET');
      expect(message).not.toContain('partner_name');
    }
  });
});
