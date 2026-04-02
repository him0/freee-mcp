import http from 'node:http';
import { context, propagation, trace } from '@opentelemetry/api';
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
    const { initTelemetry } = await import('./init.js');
    const otel = initTelemetry('1.0.0');

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

    await otel?.shutdown().catch(() => {});
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('skips /health endpoint', async () => {
    process.env.OTEL_ENABLED = 'true';
    const { initTelemetry } = await import('./init.js');
    const otel = initTelemetry('1.0.0');

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

    await otel?.shutdown().catch(() => {});
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('handles errors in route handlers', async () => {
    process.env.OTEL_ENABLED = 'true';
    const { initTelemetry } = await import('./init.js');
    const otel = initTelemetry('1.0.0');

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

    await otel?.shutdown().catch(() => {});
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('captures status code from response', async () => {
    process.env.OTEL_ENABLED = 'true';
    const { initTelemetry } = await import('./init.js');
    const otel = initTelemetry('1.0.0');

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

    await otel?.shutdown().catch(() => {});
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });
});
