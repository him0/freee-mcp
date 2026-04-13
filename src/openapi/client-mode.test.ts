import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Privacy regression tests for the generated freee_api_* tools.
 *
 * The single most important guarantee of the RequestRecorder design is that
 * user-supplied query values and request bodies NEVER leave the process via
 * the canonical log line. The type system already excludes those fields from
 * `ToolCallInfo`, but a reviewer could still accidentally pass them; these
 * runtime tests catch that regression.
 */

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
  it('captures query keys but never values in the recorder payload', async () => {
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

    // Key names are allowed
    const toolCalls = (payload.mcp as { tool_calls: Array<{ query_keys?: string[] }> }).tool_calls;
    expect(toolCalls).toHaveLength(1);
    expect(toolCalls[0].query_keys).toEqual(
      expect.arrayContaining(['start_issue_date', 'partner_name', 'internal_memo']),
    );

    // Values must NOT appear anywhere in the payload JSON.
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

    // No body field in ToolCallInfo means body is not even representable; assert the
    // actual values are absent so a future refactor that adds `args.body` fails loudly.
    expect(payloadJson).not.toContain('99999999');
    expect(payloadJson).not.toContain('confidential');
    expect(payloadJson).not.toContain('ceo@example.com');
  });

  it('records api_path_pattern via sanitizePath, not raw path', async () => {
    const { generateClientModeTool } = await import('./client-mode.js');
    const { RequestRecorder, withRequestRecorder } = await import('../server/request-context.js');

    generateClientModeTool(stubServer);
    const getHandler = capturedHandlers.get('freee_api_get');

    const recorder = new RequestRecorder({
      request_id: 'req-path-1',
      source_ip: '127.0.0.1',
      method: 'POST',
      path: '/mcp',
    });

    await withRequestRecorder(recorder, () =>
      getHandler?.(
        {
          service: 'accounting',
          path: '/api/1/deals/54321?limit=5',
        },
        undefined,
      ),
    );

    const toolCalls = (
      recorder.buildPayload({ status: 200, duration_ms: 1 }).mcp as {
        tool_calls: Array<{ api_path_pattern?: string }>;
      }
    ).tool_calls;

    // The specific IDs are replaced with :id and the query string is stripped.
    expect(toolCalls[0].api_path_pattern).toBe('/api/:id/deals/:id');
    expect(toolCalls[0].api_path_pattern).not.toContain('54321');
    expect(toolCalls[0].api_path_pattern).not.toContain('limit=5');
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
