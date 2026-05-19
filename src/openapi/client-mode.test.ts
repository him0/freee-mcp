import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ZodIssue } from 'zod';

function collectIssueMessages(issues: ZodIssue[]): string[] {
  return issues.flatMap((issue) =>
    issue.code === 'invalid_union'
      ? issue.unionErrors.flatMap((err) => collectIssueMessages(err.issues))
      : [issue.message],
  );
}

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

// The mocked `../api/client.js` must also expose `ApiHttpError`, because
// `client-mode.ts` does `instanceof ApiHttpError` and that must refer to the
// same class the test constructs. Hoist a local class via `vi.hoisted` so
// both the mock factory and the test bodies share one identity.
const { MockApiHttpError } = vi.hoisted(() => ({
  MockApiHttpError: class MockApiHttpError extends Error {
    readonly statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.name = 'ApiHttpError';
      this.statusCode = statusCode;
    }
  },
}));

vi.mock('../api/client.js', () => ({
  makeApiRequest: vi.fn(() => Promise.resolve({ ok: true })),
  isBinaryFileResponse: vi.fn(() => false),
  ApiHttpError: MockApiHttpError,
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

  it('returns isError: true when upstream API responds with 400', async () => {
    // MCP spec recommends signalling tool execution errors (e.g., upstream 4xx)
    // via `CallToolResult.isError: true` so LLMs and clients can distinguish
    // them from successful responses without parsing the body.
    const clientModule = await import('../api/client.js');
    vi.mocked(clientModule.makeApiRequest).mockRejectedValueOnce(
      new MockApiHttpError('API request failed: 400\n\nエラー詳細:\nissue_date は必須です', 400),
    );

    const { generateClientModeTool } = await import('./client-mode.js');

    generateClientModeTool(stubServer);
    const postHandler = capturedHandlers.get('freee_api_post');
    expect(postHandler).toBeDefined();

    const result = (await postHandler?.(
      { service: 'accounting', path: '/api/1/deals', body: { foo: 'bar' } },
      undefined,
    )) as { isError?: boolean; content: Array<{ type: string; text: string }> };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/APIリクエストエラー/);
    expect(result.content[0].text).toMatch(/issue_date は必須です/);
  });

  it('does not set isError for non-400 upstream HTTP errors (e.g., 500)', async () => {
    // Only 400 currently flips isError; 5xx etc. remain success-shaped to keep
    // the existing LLM-mediated retry/recovery behaviour.
    const clientModule = await import('../api/client.js');
    vi.mocked(clientModule.makeApiRequest).mockRejectedValueOnce(
      new MockApiHttpError('API request failed: 500', 500),
    );

    const { generateClientModeTool } = await import('./client-mode.js');

    generateClientModeTool(stubServer);
    const getHandler = capturedHandlers.get('freee_api_get');

    const result = (await getHandler?.(
      { service: 'accounting', path: '/api/1/users/me' },
      undefined,
    )) as { isError?: boolean; content: Array<{ type: string; text: string }> };

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toMatch(/APIリクエストエラー/);
  });

  it('does not set isError for non-ApiHttpError exceptions (auth/network/etc.)', async () => {
    const clientModule = await import('../api/client.js');
    vi.mocked(clientModule.makeApiRequest).mockRejectedValueOnce(
      new Error('認証エラーが発生しました。'),
    );

    const { generateClientModeTool } = await import('./client-mode.js');

    generateClientModeTool(stubServer);
    const getHandler = capturedHandlers.get('freee_api_get');

    const result = (await getHandler?.(
      { service: 'accounting', path: '/api/1/users/me' },
      undefined,
    )) as { isError?: boolean; content: Array<{ type: string; text: string }> };

    expect(result.isError).toBeUndefined();
  });

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

  it('rejects a leading UTF-8 BOM with a dedicated error (deterministic across OSes)', async () => {
    const { coercibleRecord } = await import('./client-mode.js');
    const schema = coercibleRecord('body');
    const bom = String.fromCharCode(0xfeff);
    const result = schema.safeParse(`${bom}{"a":1}`);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = collectIssueMessages(result.error.issues);
      expect(messages.some((m) => m.includes('UTF-8 BOM'))).toBe(true);
    }
  });

  it('passes JSON strings with surrounding whitespace through (JSON.parse handles it)', async () => {
    const { coercibleRecord } = await import('./client-mode.js');
    const schema = coercibleRecord('body');
    const result = schema.safeParse('  \r\n{"a":1}\r\n  ');
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
      const messages = collectIssueMessages(result.error.issues);
      expect(messages.some((m) => /length \d+/.test(m))).toBe(true);
      for (const message of messages) {
        expect(message).not.toContain('Acme');
        expect(message).not.toContain('SECRET');
        expect(message).not.toContain('partner_name');
      }
    }
  });

  it('publishes anyOf JSON Schema so MCP clients accept both object and string bodies', async () => {
    const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');
    const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
    const { InMemoryTransport } = await import('@modelcontextprotocol/sdk/inMemory.js');
    const { coercibleRecord } = await import('./client-mode.js');

    const server = new McpServer({ name: 'test', version: '1.0.0' });
    server.registerTool(
      'with_body',
      { inputSchema: { body: coercibleRecord('body') } },
      async () => ({ content: [{ type: 'text' as const, text: 'ok' }] }),
    );

    const [serverT, clientT] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'tester', version: '1.0.0' });
    await Promise.all([server.connect(serverT), client.connect(clientT)]);

    const tools = await client.listTools();
    const tool = tools.tools.find((t) => t.name === 'with_body');
    if (!tool) throw new Error('tool not registered');

    type ToolInputSchema = { properties: { body: { anyOf?: Array<{ type?: string }> } }; required?: string[] };
    const inputSchema = tool.inputSchema as ToolInputSchema;
    expect(inputSchema.properties.body.anyOf).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'object' }),
        expect.objectContaining({ type: 'string' }),
      ]),
    );
    expect(inputSchema.required).toContain('body');

    await client.close();
  });
});
