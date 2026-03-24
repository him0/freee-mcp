import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import http from 'node:http';
import type { AddressInfo } from 'node:net';

// Use http.request instead of fetch to avoid global fetch mock from setup.ts
function httpRequest(
  url: string,
  options: { method?: string; headers?: Record<string, string> } = {},
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: options.method || 'GET',
        headers: { Connection: 'close', ...options.headers },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve({ status: res.statusCode ?? 0, headers: res.headers, body });
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

// Lightweight Express app to test middleware stack in isolation
async function createTestApp() {
  const express = (await import('express')).default;
  const helmet = (await import('helmet')).default;
  const cors = (await import('cors')).default;
  const { RedisUnavailableError } = await import('./errors.js');

  const app = express();
  const BODY_SIZE_LIMIT = 1_048_576;

  // helmet
  app.use(
    helmet({
      hsts: { maxAge: 31536000, preload: true },
      contentSecurityPolicy: { directives: { defaultSrc: ["'none'"] } },
      frameguard: { action: 'deny' },
    }),
  );

  // CORS
  app.use(
    cors({
      origin: ['https://mcp.example.com'],
      methods: ['GET', 'POST', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Mcp-Session-Id', 'Accept'],
    }),
  );

  // Body size limit
  app.use((req: import('express').Request, res: import('express').Response, next: () => void) => {
    const contentLength = req.headers['content-length'];
    if (contentLength && Number.parseInt(contentLength, 10) > BODY_SIZE_LIMIT) {
      res.status(413).json({ error: 'Payload too large' });
      return;
    }
    next();
  });

  // Test routes
  app.get('/test', (_req, res) => res.json({ ok: true }));
  app.post('/test', (_req, res) => res.json({ ok: true }));
  app.get('/error-redis', () => {
    throw new RedisUnavailableError('test-op');
  });
  app.get('/error-generic', () => {
    throw new Error('something broke');
  });

  // Error handler (same pattern as http-server.ts)
  app.use(
    (
      err: unknown,
      _req: import('express').Request,
      res: import('express').Response,
      next: (err?: unknown) => void,
    ) => {
      if (err instanceof RedisUnavailableError) {
        if (!res.headersSent) {
          res.status(503).json({
            error: 'service_unavailable',
            message: 'Storage backend temporarily unavailable',
          });
        }
        return;
      }
      if (res.headersSent) {
        next(err);
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    },
  );

  return app;
}

describe('middleware stack', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = await createTestApp();
    server = app.listen(0);
    const port = (server.address() as AddressInfo).port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(() => {
    server?.close();
  });

  describe('security headers (helmet)', () => {
    it('should set X-Frame-Options: DENY', async () => {
      const res = await httpRequest(`${baseUrl}/test`);
      expect(res.headers['x-frame-options']).toBe('DENY');
    });

    it('should set Content-Security-Policy', async () => {
      const res = await httpRequest(`${baseUrl}/test`);
      expect(res.headers['content-security-policy']).toContain("default-src 'none'");
    });

    it('should set Strict-Transport-Security', async () => {
      const res = await httpRequest(`${baseUrl}/test`);
      const hsts = res.headers['strict-transport-security'] as string;
      expect(hsts).toContain('max-age=31536000');
      expect(hsts).toContain('preload');
    });

    it('should set X-Content-Type-Options: nosniff', async () => {
      const res = await httpRequest(`${baseUrl}/test`);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('CORS', () => {
    it('should allow configured origin', async () => {
      const res = await httpRequest(`${baseUrl}/test`, {
        headers: { Origin: 'https://mcp.example.com' },
      });
      expect(res.headers['access-control-allow-origin']).toBe('https://mcp.example.com');
    });

    it('should not set CORS header for unconfigured origin', async () => {
      const res = await httpRequest(`${baseUrl}/test`, {
        headers: { Origin: 'https://evil.example.com' },
      });
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should handle preflight OPTIONS request', async () => {
      const res = await httpRequest(`${baseUrl}/test`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://mcp.example.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Authorization,Mcp-Session-Id',
        },
      });
      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-methods']).toContain('POST');
    });
  });

  describe('body size limit', () => {
    it('should reject requests with Content-Length exceeding 1MB', async () => {
      const res = await httpRequest(`${baseUrl}/test`, {
        method: 'POST',
        headers: { 'Content-Length': '2000000' },
      });
      expect(res.status).toBe(413);
      expect(JSON.parse(res.body).error).toBe('Payload too large');
    });

    it('should allow requests within size limit', async () => {
      const res = await httpRequest(`${baseUrl}/test`);
      expect(res.status).toBe(200);
    });
  });

  describe('error handler', () => {
    it('should return 503 for RedisUnavailableError', async () => {
      const res = await httpRequest(`${baseUrl}/error-redis`);
      expect(res.status).toBe(503);
      expect(JSON.parse(res.body).error).toBe('service_unavailable');
    });

    it('should return 500 for generic errors', async () => {
      const res = await httpRequest(`${baseUrl}/error-generic`);
      expect(res.status).toBe(500);
      expect(JSON.parse(res.body).error).toBe('Internal server error');
    });
  });
});
