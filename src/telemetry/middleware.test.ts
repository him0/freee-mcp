import http from 'node:http';
import { context, propagation, trace } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import express from 'express';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

function makeRequest(
  port: number,
  path: string,
  method = 'GET',
): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path, method }, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode ?? 0, body });
      });
    });
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
  propagation.setGlobalPropagator(new W3CTraceContextPropagator());
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
    expect(spans[0].name).toBe('HTTP GET /test');

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
  ): Promise<{ logInfo: ReturnType<typeof vi.fn>; app: express.Express }> {
    const logInfo = vi.fn();
    vi.doMock('../server/logger.js', () => ({
      getLogger: (): { info: ReturnType<typeof vi.fn> } => ({ info: logInfo }),
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
    return { logInfo, app };
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
    expect(message).toBe('mcp request completed');

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
      },
      mcp: { tool_calls: [], tool_call_count: 0 },
      api_calls: [],
      api_call_count: 0,
      errors: [],
    });
  });

  it('reflects 500 status in http.status', async () => {
    const { logInfo, app } = await setupAppWithLoggerSpy((_req, res) => {
      res.status(500).json({ error: 'boom' });
    });
    ({ srv: server, port } = await listen(app));

    await makeRequest(port, '/mcp');
    await new Promise((r) => setTimeout(r, 10));

    expect(logInfo).toHaveBeenCalledTimes(1);
    const [payload] = logInfo.mock.calls[0];
    expect((payload as { http: { status: number } }).http.status).toBe(500);
  });

  it('reflects 400 status in http.status (addresses the missing-400-logs bug)', async () => {
    const { logInfo, app } = await setupAppWithLoggerSpy((_req, res) => {
      res.status(400).json({ error: 'invalid request' });
    });
    ({ srv: server, port } = await listen(app));

    await makeRequest(port, '/mcp');
    await new Promise((r) => setTimeout(r, 10));

    expect(logInfo).toHaveBeenCalledTimes(1);
    const [payload] = logInfo.mock.calls[0];
    expect((payload as { http: { status: number } }).http.status).toBe(400);
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
        api_method: 'GET',
        api_path_pattern: '/api/:id/deals',
        query_keys: ['limit'],
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
      });
      res.status(200).json({ ok: true });
    });
    ({ srv: server, port } = await listen(app));

    await makeRequest(port, '/mcp');
    await new Promise((r) => setTimeout(r, 10));

    expect(logInfo).toHaveBeenCalledTimes(1);
    const [payload] = logInfo.mock.calls[0] as [Record<string, unknown>];
    expect((payload.mcp as { tool_call_count: number }).tool_call_count).toBe(1);
    expect(payload.api_call_count).toBe(1);
    expect(payload.api_calls).toEqual([
      expect.objectContaining({ method: 'GET', status_code: 200 }),
    ]);
  });
});
