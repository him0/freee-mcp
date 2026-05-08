import http from 'node:http';
import net from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../config.js', () => ({
  getConfig: (): {
    auth: { timeoutMs: number };
    oauth: { callbackPort: number };
  } => ({
    auth: { timeoutMs: 60_000 },
    oauth: { callbackPort: 0 },
  }),
}));

vi.mock('./oauth.js', () => ({
  exchangeCodeForTokens: vi.fn(),
}));

import { getDefaultAuthManager, startCallbackServer, stopCallbackServer } from './server.js';

async function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (typeof address === 'object' && address) {
        const port = address.port;
        server.close(() => resolve(port));
      } else {
        reject(new Error('Failed to obtain free port'));
      }
    });
  });
}

interface RawResponse {
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  body: string;
}

async function getRaw(url: string): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode ?? 0,
          headers: res.headers,
          body: Buffer.concat(chunks).toString('utf8'),
        });
      });
      res.on('error', reject);
    });
    req.on('error', reject);
  });
}

describe('CallbackServer HTML response safety', () => {
  let port: number;

  beforeEach(async () => {
    port = await findFreePort();
    await startCallbackServer(port);
  });

  afterEach(() => {
    stopCallbackServer();
    getDefaultAuthManager().clearAllPending();
  });

  it('escapes HTML in error_description to prevent reflected XSS', async () => {
    const payload = '<img src=x onerror=alert(1)>';
    const url = `http://127.0.0.1:${port}/callback?error=access_denied&error_description=${encodeURIComponent(payload)}`;

    const response = await getRaw(url);

    expect(response.statusCode).toBe(400);
    expect(response.body).not.toContain('<img src=x onerror=alert(1)>');
    expect(response.body).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('falls back to escaped error code when error_description is missing', async () => {
    const payload = '<svg/onload=alert(1)>';
    const url = `http://127.0.0.1:${port}/callback?error=${encodeURIComponent(payload)}`;

    const response = await getRaw(url);

    expect(response.statusCode).toBe(400);
    expect(response.body).not.toContain(payload);
    expect(response.body).toContain('&lt;svg/onload=alert(1)&gt;');
  });

  it('returns hardening headers (CSP, nosniff) on HTML responses', async () => {
    const response = await getRaw(`http://127.0.0.1:${port}/callback?error=foo`);

    expect(response.headers['content-type']).toBe('text/html; charset=utf-8');
    expect(response.headers['content-security-policy']).toContain("default-src 'none'");
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['referrer-policy']).toBe('no-referrer');
  });

  it('applies the same hardening headers to the index page', async () => {
    const response = await getRaw(`http://127.0.0.1:${port}/`);

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-security-policy']).toContain("default-src 'none'");
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('applies the same hardening headers to the 404 page', async () => {
    const response = await getRaw(`http://127.0.0.1:${port}/does-not-exist`);

    expect(response.statusCode).toBe(404);
    expect(response.headers['content-security-policy']).toContain("default-src 'none'");
  });
});
