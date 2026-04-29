import http from 'node:http';
import { context, propagation, trace } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import express from 'express';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { createDefaultPropagator } from './init.js';

function makeRequest(
  port: number,
  path: string,
  method = 'GET',
  headers?: Record<string, string>,
): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: '127.0.0.1', port, path, method, headers },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve({ statusCode: res.statusCode ?? 0, body });
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

function setupInMemoryOtel(): { exporter: InMemorySpanExporter; provider: BasicTracerProvider } {
  const exporter = new InMemorySpanExporter();
  const provider = new BasicTracerProvider({
    resource: resourceFromAttributes({ 'service.name': 'test' }),
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });

  const contextManager = new AsyncLocalStorageContextManager();
  context.setGlobalContextManager(contextManager);
  propagation.setGlobalPropagator(createDefaultPropagator());
  trace.setGlobalTracerProvider(provider);

  return { exporter, provider };
}

describe('createTracingMiddleware', () => {
  let server: http.Server;
  let port: number;

  afterEach(() => {
    trace.disable();
    context.disable();
    propagation.disable();
    vi.resetModules();
    delete process.env.OTEL_ENABLED;
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  it('passes through when OTel is disabled', async () => {
    const { createTracingMiddleware } = await import('./middleware.js');
    const app = express();
    app.use(createTracingMiddleware());
    app.get('/test', (_req, res) => {
      res.json({ ok: true });
    });

    server = app.listen(0);
    const addr = server.address();
    port = typeof addr === 'object' && addr ? addr.port : 0;

    const result = await makeRequest(port, '/test');
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ ok: true });

    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('creates spans when OTel is enabled', async () => {
    process.env.OTEL_ENABLED = 'true';
    const { exporter, provider } = setupInMemoryOtel();

    vi.doMock('./init.js', () => ({ isOtelEnabled: () => true }));
    const { createTracingMiddleware } = await import('./middleware.js');
    const app = express();
    app.use(createTracingMiddleware());
    app.get('/test', (_req, res) => {
      res.json({ ok: true });
    });

    server = app.listen(0);
    const addr = server.address();
    port = typeof addr === 'object' && addr ? addr.port : 0;

    const result = await makeRequest(port, '/test');
    expect(result.statusCode).toBe(200);

    const spans = exporter.getFinishedSpans();
    expect(spans.length).toBe(1);
    // Span name follows the OTel/Datadog `http.server.request` convention
    // so existing Datadog facets continue to match. Method and path are
    // kept as attributes (`http.request.method`, `url.path`) instead of
    // being baked into the span name.
    expect(spans[0].name).toBe('http.server.request');
    expect(spans[0].attributes['http.request.method']).toBe('GET');
    expect(spans[0].attributes['url.path']).toBe('/test');
    expect(spans[0].attributes['http.transport']).toBe('jsonrpc');

    await provider.shutdown();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('skips /health endpoint', async () => {
    process.env.OTEL_ENABLED = 'true';
    const { exporter, provider } = setupInMemoryOtel();

    vi.doMock('./init.js', () => ({ isOtelEnabled: () => true }));
    const { createTracingMiddleware } = await import('./middleware.js');
    const app = express();
    app.use(createTracingMiddleware());
    app.get('/health', (_req, res) => {
      res.json({ status: 'ok' });
    });

    server = app.listen(0);
    const addr = server.address();
    port = typeof addr === 'object' && addr ? addr.port : 0;

    const result = await makeRequest(port, '/health');
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ status: 'ok' });

    const spans = exporter.getFinishedSpans();
    expect(spans.length).toBe(0);

    await provider.shutdown();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('handles errors in route handlers', async () => {
    process.env.OTEL_ENABLED = 'true';
    const { exporter, provider } = setupInMemoryOtel();

    vi.doMock('./init.js', () => ({ isOtelEnabled: () => true }));
    const { createTracingMiddleware } = await import('./middleware.js');
    const app = express();
    app.use(createTracingMiddleware());
    app.get('/error', (_req, res) => {
      res.status(500).json({ error: 'Internal' });
    });
    // Express error handler
    app.use(
      (
        _err: unknown,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction,
      ) => {
        res.status(500).json({ error: 'Internal' });
      },
    );

    server = app.listen(0);
    const addr = server.address();
    port = typeof addr === 'object' && addr ? addr.port : 0;

    const result = await makeRequest(port, '/error');
    expect(result.statusCode).toBe(500);

    const spans = exporter.getFinishedSpans();
    expect(spans.length).toBe(1);
    expect(spans[0].status.code).toBe(2); // SpanStatusCode.ERROR

    await provider.shutdown();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('captures status code from response', async () => {
    process.env.OTEL_ENABLED = 'true';
    const { exporter, provider } = setupInMemoryOtel();

    vi.doMock('./init.js', () => ({ isOtelEnabled: () => true }));
    const { createTracingMiddleware } = await import('./middleware.js');
    const app = express();
    app.use(createTracingMiddleware());
    app.get('/created', (_req, res) => {
      res.status(201).json({ created: true });
    });

    server = app.listen(0);
    const addr = server.address();
    port = typeof addr === 'object' && addr ? addr.port : 0;

    const result = await makeRequest(port, '/created');
    expect(result.statusCode).toBe(201);

    const spans = exporter.getFinishedSpans();
    expect(spans.length).toBe(1);
    expect(spans[0].attributes['http.response.status_code']).toBe(201);

    await provider.shutdown();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('extracts incoming W3C traceparent so the span links to the upstream gateway trace', async () => {
    process.env.OTEL_ENABLED = 'true';
    const { exporter, provider } = setupInMemoryOtel();

    vi.doMock('./init.js', () => ({ isOtelEnabled: () => true }));
    const { createTracingMiddleware } = await import('./middleware.js');
    const app = express();
    app.use(createTracingMiddleware());
    app.post('/mcp', (_req, res) => {
      res.status(200).json({ ok: true });
    });

    server = app.listen(0);
    const addr = server.address();
    port = typeof addr === 'object' && addr ? addr.port : 0;

    // traceparent: version-traceid-parentspanid-flags
    const upstreamTraceId = '0af7651916cd43dd8448eb211c80319c';
    const upstreamSpanId = 'b7ad6b7169203331';
    await makeRequest(port, '/mcp', 'POST', {
      traceparent: `00-${upstreamTraceId}-${upstreamSpanId}-01`,
    });

    const spans = exporter.getFinishedSpans();
    expect(spans.length).toBe(1);
    // The server span MUST inherit the upstream trace_id and treat the
    // upstream span as its parent. Without `propagation.extract` the span
    // would start a fresh trace and Datadog APM would render two
    // disconnected services.
    expect(spans[0].spanContext().traceId).toBe(upstreamTraceId);
    expect(spans[0].parentSpanContext?.spanId).toBe(upstreamSpanId);

    await provider.shutdown();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('starts a fresh root trace when no incoming traceparent header is present', async () => {
    // Regression guard: when nothing upstream sets a traceparent (e.g. local
    // CLI mode or an internal cron), the server span must be a brand-new
    // root, not silently reuse a stale parent.
    process.env.OTEL_ENABLED = 'true';
    const { exporter, provider } = setupInMemoryOtel();

    vi.doMock('./init.js', () => ({ isOtelEnabled: () => true }));
    const { createTracingMiddleware } = await import('./middleware.js');
    const app = express();
    app.use(createTracingMiddleware());
    app.post('/mcp', (_req, res) => {
      res.status(200).json({ ok: true });
    });

    server = app.listen(0);
    const addr = server.address();
    port = typeof addr === 'object' && addr ? addr.port : 0;

    await makeRequest(port, '/mcp', 'POST');

    const spans = exporter.getFinishedSpans();
    expect(spans.length).toBe(1);
    // No upstream parent → parentSpanContext is undefined (root span).
    expect(spans[0].parentSpanContext).toBeUndefined();
    // The synthesized traceId should still be a valid 32-hex (sanity check
    // that the span itself is well-formed).
    expect(spans[0].spanContext().traceId).toMatch(/^[0-9a-f]{32}$/);

    await provider.shutdown();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('classifies GET /mcp as the SSE transport and POST /mcp as JSON-RPC', async () => {
    process.env.OTEL_ENABLED = 'true';
    const { exporter, provider } = setupInMemoryOtel();

    vi.doMock('./init.js', () => ({ isOtelEnabled: () => true }));
    const { createTracingMiddleware } = await import('./middleware.js');
    const app = express();
    app.use(createTracingMiddleware());
    app.all('/mcp', (_req, res) => {
      res.status(200).json({ ok: true });
    });

    server = app.listen(0);
    const addr = server.address();
    port = typeof addr === 'object' && addr ? addr.port : 0;

    await makeRequest(port, '/mcp', 'GET');
    await makeRequest(port, '/mcp', 'POST');

    const spans = exporter.getFinishedSpans();
    expect(spans.length).toBe(2);
    const byMethod = Object.fromEntries(
      spans.map((s) => [s.attributes['http.request.method'] as string, s]),
    );
    expect(byMethod.GET.attributes['http.transport']).toBe('sse');
    expect(byMethod.POST.attributes['http.transport']).toBe('jsonrpc');

    await provider.shutdown();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('classifies non-/mcp GET requests as JSON-RPC, not SSE', async () => {
    // OAuth callbacks and other GET endpoints are one-shot, not streaming.
    // The transport label exists to separate SSE long-lived connections
    // from one-shot handlers, so it must be path-aware.
    process.env.OTEL_ENABLED = 'true';
    const { exporter, provider } = setupInMemoryOtel();

    vi.doMock('./init.js', () => ({ isOtelEnabled: () => true }));
    const { createTracingMiddleware } = await import('./middleware.js');
    const app = express();
    app.use(createTracingMiddleware());
    app.get('/oauth/authorize', (_req, res) => {
      res.status(200).json({ ok: true });
    });

    server = app.listen(0);
    const addr = server.address();
    port = typeof addr === 'object' && addr ? addr.port : 0;

    await makeRequest(port, '/oauth/authorize', 'GET');

    const spans = exporter.getFinishedSpans();
    expect(spans.length).toBe(1);
    expect(spans[0].attributes['http.transport']).toBe('jsonrpc');

    await provider.shutdown();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('records http.response.close_reason=completed when the server finishes the response', async () => {
    process.env.OTEL_ENABLED = 'true';
    const { exporter, provider } = setupInMemoryOtel();

    vi.doMock('./init.js', () => ({ isOtelEnabled: () => true }));
    const { createTracingMiddleware } = await import('./middleware.js');
    const app = express();
    app.use(createTracingMiddleware());
    app.post('/mcp', (_req, res) => {
      res.status(200).json({ ok: true });
    });

    server = app.listen(0);
    const addr = server.address();
    port = typeof addr === 'object' && addr ? addr.port : 0;

    await makeRequest(port, '/mcp', 'POST');

    const spans = exporter.getFinishedSpans();
    expect(spans.length).toBe(1);
    expect(spans[0].attributes['http.response.close_reason']).toBe('completed');

    await provider.shutdown();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });
});

describe('createTracingMiddleware - canonical log line', () => {
  let server: http.Server;
  let port: number;

  afterEach(async () => {
    if (server?.listening) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
    vi.resetModules();
    vi.restoreAllMocks();
  });

  async function setupAppWithLoggerSpy(
    routeHandler: (req: express.Request, res: express.Response) => void,
    routePath = '/mcp',
  ): Promise<{
    logInfo: ReturnType<typeof vi.fn>;
    logWarn: ReturnType<typeof vi.fn>;
    logError: ReturnType<typeof vi.fn>;
    app: express.Express;
  }> {
    const logInfo = vi.fn();
    const logWarn = vi.fn();
    const logError = vi.fn();
    vi.doMock('../server/logger.js', () => ({
      getLogger: (): {
        info: ReturnType<typeof vi.fn>;
        warn: ReturnType<typeof vi.fn>;
        error: ReturnType<typeof vi.fn>;
      } => ({ info: logInfo, warn: logWarn, error: logError }),
    }));

    const { createTracingMiddleware } = await import('./middleware.js');
    const { getCurrentRecorder } = await import('../server/request-context.js');

    const app = express();
    app.use(createTracingMiddleware());
    app.all(routePath, (req, res) => {
      // Expose recorder access to the route so it can record tool/api calls.
      (req as unknown as { recorder: unknown }).recorder = getCurrentRecorder();
      routeHandler(req, res);
    });
    return { logInfo, logWarn, logError, app };
  }

  function listen(app: express.Express): Promise<{ srv: http.Server; port: number }> {
    return new Promise((resolve) => {
      const srv = app.listen(0, () => {
        const addr = srv.address();
        resolve({ srv, port: typeof addr === 'object' && addr ? addr.port : 0 });
      });
    });
  }

  it('emits exactly one canonical log line per request with the full payload shape', async () => {
    const { logInfo, app } = await setupAppWithLoggerSpy((_req, res) => {
      res.status(200).json({ ok: true });
    });
    ({ srv: server, port } = await listen(app));

    const result = await makeRequest(port, '/mcp');
    expect(result.statusCode).toBe(200);

    // Give res.on('finish') a tick to flush synchronously before assertions.
    await new Promise((r) => setTimeout(r, 10));

    expect(logInfo).toHaveBeenCalledTimes(1);
    const [payload, message] = logInfo.mock.calls[0];
    expect(message).toBe('mcp request ok');

    expect(payload).toMatchObject({
      request_id: expect.any(String),
      source_ip: expect.any(String),
      user_id: null,
      session_id: null,
      http: {
        method: 'GET',
        path: '/mcp',
        status: 200,
        duration_ms: expect.any(Number),
        // Triage facets surfaced into the canonical log line so Datadog
        // queries can split SSE long-lived connections from JSON-RPC
        // one-shot calls without joining the trace span attributes.
        transport: 'sse',
        close_reason: 'completed',
      },
      mcp: { tool_calls: [], tool_call_count: 0 },
      api: { calls: [], call_count: 0 },
      errors: [],
    });
  });

  it('emits canonical log at error level for 5xx with server_error message', async () => {
    const { logInfo, logWarn, logError, app } = await setupAppWithLoggerSpy((_req, res) => {
      res.status(500).json({ error: 'boom' });
    });
    ({ srv: server, port } = await listen(app));

    await makeRequest(port, '/mcp');
    await new Promise((r) => setTimeout(r, 10));

    expect(logInfo).not.toHaveBeenCalled();
    expect(logWarn).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalledTimes(1);
    const [payload, message] = logError.mock.calls[0];
    expect(message).toBe('mcp request server_error');
    expect((payload as { http: { status: number } }).http.status).toBe(500);
  });

  it('emits canonical log at warn level for 4xx with client_error message', async () => {
    const { logInfo, logWarn, logError, app } = await setupAppWithLoggerSpy((_req, res) => {
      res.status(400).json({ error: 'invalid request' });
    });
    ({ srv: server, port } = await listen(app));

    await makeRequest(port, '/mcp');
    await new Promise((r) => setTimeout(r, 10));

    expect(logInfo).not.toHaveBeenCalled();
    expect(logError).not.toHaveBeenCalled();
    expect(logWarn).toHaveBeenCalledTimes(1);
    const [payload, message] = logWarn.mock.calls[0];
    expect(message).toBe('mcp request client_error');
    expect((payload as { http: { status: number } }).http.status).toBe(400);
  });

  it('maps 404 to warn (covers both upstream and synthetic routing not-found)', async () => {
    const { logInfo, logWarn, logError, app } = await setupAppWithLoggerSpy((_req, res) => {
      res.status(404).json({ error: 'not found' });
    });
    ({ srv: server, port } = await listen(app));

    await makeRequest(port, '/mcp');
    await new Promise((r) => setTimeout(r, 10));

    expect(logInfo).not.toHaveBeenCalled();
    expect(logError).not.toHaveBeenCalled();
    expect(logWarn).toHaveBeenCalledTimes(1);
  });

  it('synthesizes a fallback errors[0] for 5xx when no recordError was called', async () => {
    const { UNRECORDED_ERROR_TYPE } = await import('../server/request-context.js');
    const { logError, app } = await setupAppWithLoggerSpy((_req, res) => {
      res.status(500).json({ error: 'opaque' });
    });
    ({ srv: server, port } = await listen(app));

    await makeRequest(port, '/mcp');
    await new Promise((r) => setTimeout(r, 10));

    const [payload] = logError.mock.calls[0] as [Record<string, unknown>];
    const errors = payload.errors as Array<Record<string, unknown>>;
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      source: 'response',
      status_code: 500,
      error_type: UNRECORDED_ERROR_TYPE,
    });
  });

  it('synthesizes a fallback errors[0] for 4xx as well, not only 5xx', async () => {
    const { UNRECORDED_ERROR_TYPE } = await import('../server/request-context.js');
    const { logWarn, app } = await setupAppWithLoggerSpy((_req, res) => {
      res.status(401).json({ error: 'unauthorized' });
    });
    ({ srv: server, port } = await listen(app));

    await makeRequest(port, '/mcp');
    await new Promise((r) => setTimeout(r, 10));

    const [payload] = logWarn.mock.calls[0] as [Record<string, unknown>];
    const errors = payload.errors as Array<Record<string, unknown>>;
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      source: 'response',
      status_code: 401,
      error_type: UNRECORDED_ERROR_TYPE,
    });
  });

  it('does NOT synthesize a fallback when an explicit recordError was already called', async () => {
    type Recorder = import('../server/request-context.js').RequestRecorder;
    const { logError, app } = await setupAppWithLoggerSpy((req, res) => {
      const recorder = (req as unknown as { recorder?: Recorder }).recorder;
      recorder?.recordError({
        source: 'redis_unavailable',
        status_code: 503,
        error_type: 'redis_unavailable',
        chain: [{ name: 'RedisUnavailableError', message: 'down' }],
      });
      res.status(503).json({ error: 'service_unavailable' });
    });
    ({ srv: server, port } = await listen(app));

    await makeRequest(port, '/mcp');
    await new Promise((r) => setTimeout(r, 10));

    const [payload] = logError.mock.calls[0] as [Record<string, unknown>];
    const errors = payload.errors as Array<Record<string, unknown>>;
    expect(errors).toHaveLength(1);
    expect(errors[0]?.source).toBe('redis_unavailable');
  });

  it('does NOT synthesize a fallback for 2xx responses', async () => {
    const { logInfo, app } = await setupAppWithLoggerSpy((_req, res) => {
      res.status(200).json({ ok: true });
    });
    ({ srv: server, port } = await listen(app));

    await makeRequest(port, '/mcp');
    await new Promise((r) => setTimeout(r, 10));

    const [payload] = logInfo.mock.calls[0] as [Record<string, unknown>];
    expect(payload.errors).toEqual([]);
  });

  it('does NOT synthesize a fallback for 3xx redirects', async () => {
    // Locks the gate at status >= 400 so OAuth redirects never get flagged.
    const { logInfo, app } = await setupAppWithLoggerSpy((_req, res) => {
      res.status(302).set('Location', '/somewhere').end();
    });
    ({ srv: server, port } = await listen(app));

    await makeRequest(port, '/mcp');
    await new Promise((r) => setTimeout(r, 10));

    const [payload] = logInfo.mock.calls[0] as [Record<string, unknown>];
    expect(payload.errors).toEqual([]);
  });

  it('flushes only once even if both finish and close events fire', async () => {
    const { logInfo, app } = await setupAppWithLoggerSpy((_req, res) => {
      res.status(200).json({ ok: true });
    });
    ({ srv: server, port } = await listen(app));

    await makeRequest(port, '/mcp');
    await new Promise((r) => setTimeout(r, 20));

    // flushOnce() in the middleware guarantees at most one emit.
    expect(logInfo).toHaveBeenCalledTimes(1);
  });

  it('skips /health entirely — no canonical log emitted', async () => {
    const { logInfo, app } = await setupAppWithLoggerSpy(
      (_req, res) => {
        res.status(200).json({ status: 'ok' });
      },
      '/health',
    );
    ({ srv: server, port } = await listen(app));

    await makeRequest(port, '/health');
    await new Promise((r) => setTimeout(r, 10));

    expect(logInfo).not.toHaveBeenCalled();
  });

  it('includes recorded tool_calls and api_calls from downstream handlers', async () => {
    type Recorder = import('../server/request-context.js').RequestRecorder;
    const { logInfo, app } = await setupAppWithLoggerSpy(async (req, res) => {
      // Simulate a tool handler recording activity on the in-context recorder.
      const recorder = (req as unknown as { recorder?: Recorder }).recorder;
      recorder?.recordToolCall({
        tool: 'freee_api_get',
        service: 'accounting',
        status: 'success',
        duration_ms: 5,
      });
      recorder?.recordApiCall({
        method: 'GET',
        path_pattern: '/api/:id/deals',
        status_code: 200,
        duration_ms: 3,
        company_id: '12345',
        user_id: 'user-1',
        error_type: null,
        query_keys: ['limit'],
      });
      res.status(200).json({ ok: true });
    });
    ({ srv: server, port } = await listen(app));

    await makeRequest(port, '/mcp');
    await new Promise((r) => setTimeout(r, 10));

    expect(logInfo).toHaveBeenCalledTimes(1);
    const [payload] = logInfo.mock.calls[0] as [Record<string, unknown>];
    expect((payload.mcp as { tool_call_count: number }).tool_call_count).toBe(1);
    const api = payload.api as { call_count: number; calls: unknown[] };
    expect(api.call_count).toBe(1);
    expect(api.calls).toEqual([
      expect.objectContaining({
        method: 'GET',
        status_code: 200,
        query_keys: ['limit'],
      }),
    ]);
  });

  it('captures the inbound User-Agent header verbatim in the canonical log', async () => {
    const { logInfo, app } = await setupAppWithLoggerSpy((_req, res) => {
      res.status(200).json({ ok: true });
    });
    ({ srv: server, port } = await listen(app));

    await makeRequest(port, '/mcp', 'GET', {
      'user-agent': 'ClaudeDesktop/1.2.3 (macOS 15.1)',
    });
    await new Promise((r) => setTimeout(r, 10));

    expect(logInfo).toHaveBeenCalledTimes(1);
    const [payload] = logInfo.mock.calls[0] as [Record<string, unknown>];
    expect(payload.user_agent).toBe('ClaudeDesktop/1.2.3 (macOS 15.1)');
  });

  it('sets user_agent to null when the client sends no User-Agent header', async () => {
    const { logInfo, app } = await setupAppWithLoggerSpy((_req, res) => {
      res.status(200).json({ ok: true });
    });
    ({ srv: server, port } = await listen(app));

    // Node's http module always sends a default User-Agent unless we actively
    // overwrite it with an empty string. Empty is the closest thing to "no
    // UA" a real client can produce.
    await makeRequest(port, '/mcp', 'GET', { 'user-agent': '' });
    await new Promise((r) => setTimeout(r, 10));

    const [payload] = logInfo.mock.calls[0] as [Record<string, unknown>];
    expect(payload.user_agent).toBeNull();
  });

  it('truncates oversized user-agents to 256 characters', async () => {
    const { logInfo, app } = await setupAppWithLoggerSpy((_req, res) => {
      res.status(200).json({ ok: true });
    });
    ({ srv: server, port } = await listen(app));

    const huge = `BadClient/${'x'.repeat(400)}`;
    await makeRequest(port, '/mcp', 'GET', { 'user-agent': huge });
    await new Promise((r) => setTimeout(r, 10));

    const [payload] = logInfo.mock.calls[0] as [Record<string, unknown>];
    const ua = payload.user_agent as string;
    expect(ua.length).toBe(256);
    expect(ua.startsWith('BadClient/')).toBe(true);
  });

  it('scrubs numeric IDs and emails from the user-agent', async () => {
    const { logInfo, app } = await setupAppWithLoggerSpy((_req, res) => {
      res.status(200).json({ ok: true });
    });
    ({ srv: server, port } = await listen(app));

    await makeRequest(port, '/mcp', 'GET', {
      'user-agent': 'CustomBot/1.0 (uid=98765432 contact=ops@example.com)',
    });
    await new Promise((r) => setTimeout(r, 10));

    const [payload] = logInfo.mock.calls[0] as [Record<string, unknown>];
    const ua = payload.user_agent as string;
    expect(ua).toContain('[REDACTED_ID]');
    expect(ua).toContain('[REDACTED_EMAIL]');
    expect(ua).not.toContain('98765432');
    expect(ua).not.toContain('ops@example.com');
  });

  it('caps length AFTER scrubbing so ID/email expansion cannot exceed 256', async () => {
    // Regression test for the truncate-then-scrub ordering bug.
    //
    // Input is exactly 256 chars and contains a 6-digit number preceded by
    // whitespace (so `\b\d{6,}\b` can match — without the space, `A123456`
    // has no word boundary between A and 1). After scrubbing, the 6-digit
    // ID `123456` is replaced with `[REDACTED_ID]` (13 chars), inflating
    // the result from 256 → 263. If the code truncated before scrubbing
    // the output would violate the 256-char cap; scrub-then-truncate must
    // clamp it back to 256.
    const base = 'A'.repeat(249);
    const input = `${base} 123456`; // 249 + 7 = 256 chars
    expect(input.length).toBe(256);

    const { logInfo, app } = await setupAppWithLoggerSpy((_req, res) => {
      res.status(200).json({ ok: true });
    });
    ({ srv: server, port } = await listen(app));

    await makeRequest(port, '/mcp', 'GET', { 'user-agent': input });
    await new Promise((r) => setTimeout(r, 10));

    const [payload] = logInfo.mock.calls[0] as [Record<string, unknown>];
    const ua = payload.user_agent as string;
    // The critical invariant: no matter what the scrub does, the final
    // string MUST fit within the cap.
    expect(ua.length).toBeLessThanOrEqual(256);
    // Original ID must not leak.
    expect(ua).not.toContain('123456');
    // The scrubbed prefix should be present (possibly cut at the cap
    // boundary, so check the leading token rather than the full marker).
    expect(ua).toContain('[REDAC');
    expect(ua.startsWith(base)).toBe(true);
  });

  // -- cid (correlation ID) header propagation -----------------------------
  //
  // End-to-end coverage that the middleware wires the inbound correlation
  // headers into the canonical log line via `resolveCid`. Per-source unit
  // coverage of `resolveCid` itself lives in request-context.test.ts.
  it('propagates X-Correlation-ID into the cid field of the canonical log', async () => {
    const { logInfo, app } = await setupAppWithLoggerSpy((_req, res) => {
      res.status(200).json({ ok: true });
    });
    ({ srv: server, port } = await listen(app));

    await makeRequest(port, '/mcp', 'GET', { 'x-correlation-id': 'cid-from-correlation' });
    await new Promise((r) => setTimeout(r, 10));

    const [payload] = logInfo.mock.calls[0] as [Record<string, unknown>];
    expect(payload.cid).toBe('cid-from-correlation');
  });

  it('falls back to X-Request-ID when X-Correlation-ID is absent', async () => {
    const { logInfo, app } = await setupAppWithLoggerSpy((_req, res) => {
      res.status(200).json({ ok: true });
    });
    ({ srv: server, port } = await listen(app));

    await makeRequest(port, '/mcp', 'GET', { 'x-request-id': 'rid-from-request' });
    await new Promise((r) => setTimeout(r, 10));

    const [payload] = logInfo.mock.calls[0] as [Record<string, unknown>];
    expect(payload.cid).toBe('rid-from-request');
  });

  it('prefers X-Correlation-ID when both correlation headers are present', async () => {
    const { logInfo, app } = await setupAppWithLoggerSpy((_req, res) => {
      res.status(200).json({ ok: true });
    });
    ({ srv: server, port } = await listen(app));

    await makeRequest(port, '/mcp', 'GET', {
      'x-correlation-id': 'cid-wins',
      'x-request-id': 'rid-loses',
    });
    await new Promise((r) => setTimeout(r, 10));

    const [payload] = logInfo.mock.calls[0] as [Record<string, unknown>];
    expect(payload.cid).toBe('cid-wins');
  });

  it('generates a UUID cid when no correlation headers are sent', async () => {
    const { logInfo, app } = await setupAppWithLoggerSpy((_req, res) => {
      res.status(200).json({ ok: true });
    });
    ({ srv: server, port } = await listen(app));

    await makeRequest(port, '/mcp');
    await new Promise((r) => setTimeout(r, 10));

    const [payload] = logInfo.mock.calls[0] as [Record<string, unknown>];
    expect(payload.cid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('rejects an invalid X-Correlation-ID and falls through to X-Request-ID', async () => {
    // Locks the no-partial-sanitize contract end-to-end: even though the
    // correlation header is present, its whitespace makes it invalid, so
    // the middleware should NOT pass through the dirty value, and should
    // NOT strip-and-keep it — it should fall through to the next source.
    const { logInfo, app } = await setupAppWithLoggerSpy((_req, res) => {
      res.status(200).json({ ok: true });
    });
    ({ srv: server, port } = await listen(app));

    await makeRequest(port, '/mcp', 'GET', {
      'x-correlation-id': 'has space',
      'x-request-id': 'rid-clean',
    });
    await new Promise((r) => setTimeout(r, 10));

    const [payload] = logInfo.mock.calls[0] as [Record<string, unknown>];
    expect(payload.cid).toBe('rid-clean');
  });

  it('keeps cid independent from request_id (server-assigned)', async () => {
    // Locks the contract: cid carries the upstream-supplied correlation ID,
    // request_id is always the server-assigned UUID. They MUST NOT collapse.
    const { logInfo, app } = await setupAppWithLoggerSpy((_req, res) => {
      res.status(200).json({ ok: true });
    });
    ({ srv: server, port } = await listen(app));

    await makeRequest(port, '/mcp', 'GET', { 'x-correlation-id': 'gateway-trace-1' });
    await new Promise((r) => setTimeout(r, 10));

    const [payload] = logInfo.mock.calls[0] as [Record<string, unknown>];
    expect(payload.cid).toBe('gateway-trace-1');
    expect(payload.request_id).not.toBe(payload.cid);
    expect(typeof payload.request_id).toBe('string');
  });
});

/**
 * Direct unit tests for `normalizeUserAgent`.
 *
 * These complement the HTTP-level tests above by exercising edge cases that
 * Node's `http.request` can't produce in practice (undefined header,
 * `string[]` header, input at the exact 256-char boundary). Running these as
 * pure function calls avoids the ~40 ms/per-case socket overhead of booting
 * an Express server.
 */
describe('normalizeUserAgent', () => {
  it('returns undefined for an undefined input (absent header case)', async () => {
    const { normalizeUserAgent } = await import('./middleware.js');
    expect(normalizeUserAgent(undefined)).toBeUndefined();
  });

  it('returns undefined for an empty string', async () => {
    const { normalizeUserAgent } = await import('./middleware.js');
    expect(normalizeUserAgent('')).toBeUndefined();
  });

  it('returns undefined for a `string[]` value (defensive guard)', async () => {
    // Node's IncomingHttpHeaders types `user-agent` as `string | undefined`,
    // so a `string[]` should never reach this helper in practice. The `unknown`
    // parameter + `typeof` guard exists purely as defense-in-depth against a
    // future typing regression or middleware that forwards raw multi-value
    // headers. This test locks that guard in place.
    const { normalizeUserAgent } = await import('./middleware.js');
    expect(normalizeUserAgent(['ClaudeDesktop/1.0', 'AnotherClient/2.0'])).toBeUndefined();
  });

  it('passes through a normal user-agent unchanged', async () => {
    const { normalizeUserAgent } = await import('./middleware.js');
    expect(normalizeUserAgent('ClaudeDesktop/1.2.3 (macOS 15.1)')).toBe(
      'ClaudeDesktop/1.2.3 (macOS 15.1)',
    );
  });

  it('preserves realistic Chrome/Safari UAs whose build numbers are <6 digits', async () => {
    // Regression test for CodeRabbit finding M1 — confirm that real-world UAs
    // with 4-digit build numbers (the most common pattern) are NOT mangled by
    // the 6+-digit NUMERIC_ID_PATTERN scrub. If this test fails, the scrub has
    // become too aggressive and Datadog client-segment analytics will silently
    // degrade.
    const { normalizeUserAgent } = await import('./middleware.js');
    const chrome =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Chrome/120.0.6099.129 Safari/605.1.15';
    expect(normalizeUserAgent(chrome)).toBe(chrome);
  });

  it('redacts a 6+ digit build number if a client UA happens to embed one', async () => {
    // This documents the known tradeoff — UAs with 6+-digit build numbers
    // WILL be scrubbed. The defense-in-depth policy takes priority over
    // analytics precision for this edge case. See CLAUDE.md for an example
    // so future on-call engineers aren't confused by a `[REDACTED_ID]` in UA.
    const { normalizeUserAgent } = await import('./middleware.js');
    expect(normalizeUserAgent('Chrome/120.0.987654.1')).toBe('Chrome/120.0.[REDACTED_ID].1');
  });

  it('boundary: input of exactly 256 chars with no scrub passes through', async () => {
    const { normalizeUserAgent } = await import('./middleware.js');
    const exactly256 = 'A'.repeat(256);
    expect(normalizeUserAgent(exactly256)).toBe(exactly256);
  });

  it('boundary: input of 257 chars gets truncated to 256', async () => {
    const { normalizeUserAgent } = await import('./middleware.js');
    const result = normalizeUserAgent('A'.repeat(257));
    expect(result).toBeDefined();
    expect(result).toHaveLength(256);
  });
});

describe('levelFor', () => {
  it('maps 2xx and 3xx to info', async () => {
    const { levelFor } = await import('./middleware.js');
    expect(levelFor(200)).toBe('info');
    expect(levelFor(201)).toBe('info');
    expect(levelFor(204)).toBe('info');
    expect(levelFor(301)).toBe('info');
    expect(levelFor(302)).toBe('info');
  });

  it('maps all 4xx codes to warn (including auth/notfound)', async () => {
    const { levelFor } = await import('./middleware.js');
    expect(levelFor(400)).toBe('warn');
    expect(levelFor(401)).toBe('warn');
    expect(levelFor(403)).toBe('warn');
    expect(levelFor(404)).toBe('warn');
    expect(levelFor(422)).toBe('warn');
    expect(levelFor(429)).toBe('warn');
    expect(levelFor(499)).toBe('warn');
  });

  it('maps 5xx to error', async () => {
    const { levelFor } = await import('./middleware.js');
    expect(levelFor(500)).toBe('error');
    expect(levelFor(502)).toBe('error');
    expect(levelFor(503)).toBe('error');
    expect(levelFor(599)).toBe('error');
  });

  it('boundary: 399 is info, 400 is warn', async () => {
    const { levelFor } = await import('./middleware.js');
    expect(levelFor(399)).toBe('info');
    expect(levelFor(400)).toBe('warn');
  });

  it('boundary: 499 is warn, 500 is error', async () => {
    const { levelFor } = await import('./middleware.js');
    expect(levelFor(499)).toBe('warn');
    expect(levelFor(500)).toBe('error');
  });
});

describe('messageFor', () => {
  it('returns "mcp request ok" for 2xx/3xx', async () => {
    const { messageFor } = await import('./middleware.js');
    expect(messageFor(200)).toBe('mcp request ok');
    expect(messageFor(302)).toBe('mcp request ok');
  });

  it('returns "mcp request client_error" for 4xx', async () => {
    const { messageFor } = await import('./middleware.js');
    expect(messageFor(400)).toBe('mcp request client_error');
    expect(messageFor(404)).toBe('mcp request client_error');
    expect(messageFor(422)).toBe('mcp request client_error');
  });

  it('returns "mcp request server_error" for 5xx', async () => {
    const { messageFor } = await import('./middleware.js');
    expect(messageFor(500)).toBe('mcp request server_error');
    expect(messageFor(503)).toBe('mcp request server_error');
  });
});
