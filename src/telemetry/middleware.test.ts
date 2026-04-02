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
