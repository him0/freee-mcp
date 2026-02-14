/**
 * Tests for CallbackServer.handleCallback
 * Ensures browser response reflects actual token exchange result
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import http from 'http';
import net from 'net';
import { AuthenticationManager, CallbackServer } from './server.js';
import { TokenData } from './tokens.js';

let testPort = 54390;

// Mock config - callbackPort will be set dynamically per test
vi.mock('../config.js', () => ({
  getConfig: () => ({
    freee: {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      apiUrl: 'https://api.freee.co.jp',
    },
    oauth: {
      get callbackPort() { return testPort; },
      scope: 'read write',
      authorizationEndpoint: 'https://accounts.secure.freee.co.jp/public_api/authorize',
      tokenEndpoint: 'https://accounts.secure.freee.co.jp/public_api/token',
    },
    auth: {
      timeoutMs: 300000,
    },
  }),
}));

const mockTokens: TokenData = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_at: Date.now() + 3600000,
  token_type: 'Bearer',
  scope: 'read write',
};

const mockExchangeCodeForTokens = vi.fn();

vi.mock('./oauth.js', () => ({
  exchangeCodeForTokens: (...args: unknown[]) => mockExchangeCodeForTokens(...args),
}));

/**
 * Helper to send an HTTP request using Node's http module (bypasses mocked global.fetch)
 */
function httpGet(url: string): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode ?? 0, body });
      });
    }).on('error', reject);
  });
}

/**
 * Find a free port
 */
function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      if (addr && typeof addr === 'object') {
        const port = addr.port;
        srv.close(() => resolve(port));
      } else {
        srv.close(() => reject(new Error('Could not get port')));
      }
    });
    srv.on('error', reject);
  });
}

/**
 * Stop server and wait for it to fully close
 */
function stopAndWait(server: CallbackServer): Promise<void> {
  return new Promise((resolve) => {
    server.stop();
    // Give the OS a moment to release the port
    setTimeout(resolve, 50);
  });
}

describe('CallbackServer.handleCallback', () => {
  let server: CallbackServer;
  let authManager: AuthenticationManager;

  beforeEach(async () => {
    vi.clearAllMocks();
    testPort = await findFreePort();
    authManager = new AuthenticationManager();
    server = new CallbackServer(authManager);
  });

  afterEach(async () => {
    await stopAndWait(server);
  });

  describe('token exchange success', () => {
    it('should return 200 with success message when token exchange succeeds', async () => {
      mockExchangeCodeForTokens.mockResolvedValue(mockTokens);

      const state = 'test-state-success';
      authManager.registerAuthentication(state, 'test-code-verifier');

      await server.start();
      const port = server.getPort();
      const result = await httpGet(
        `http://127.0.0.1:${port}/callback?code=test-auth-code&state=${state}`,
      );

      expect(result.statusCode).toBe(200);
      expect(result.body).toContain('認証完了');
      expect(mockExchangeCodeForTokens).toHaveBeenCalledWith(
        'test-auth-code',
        'test-code-verifier',
        expect.stringContaining('/callback'),
      );
    });
  });

  describe('token exchange failure', () => {
    it('should return 500 with error message when token exchange fails', async () => {
      mockExchangeCodeForTokens.mockRejectedValue(
        new Error('Token exchange failed: 400 {"error":"invalid_grant"}'),
      );

      const state = 'test-state-failure';
      authManager.registerAuthentication(state, 'test-code-verifier');

      await server.start();
      const port = server.getPort();
      const result = await httpGet(
        `http://127.0.0.1:${port}/callback?code=expired-auth-code&state=${state}`,
      );

      expect(result.statusCode).toBe(500);
      expect(result.body).toContain('認証エラー');
      expect(result.body).toContain('トークンの取得に失敗しました');
    });
  });

  describe('missing parameters', () => {
    it('should return 400 when code is missing', async () => {
      await server.start();
      const port = server.getPort();
      const result = await httpGet(
        `http://127.0.0.1:${port}/callback?state=some-state`,
      );

      expect(result.statusCode).toBe(400);
      expect(result.body).toContain('認証コードまたは状態パラメータが不足');
    });

    it('should return 400 when state is missing', async () => {
      await server.start();
      const port = server.getPort();
      const result = await httpGet(
        `http://127.0.0.1:${port}/callback?code=some-code`,
      );

      expect(result.statusCode).toBe(400);
      expect(result.body).toContain('認証コードまたは状態パラメータが不足');
    });
  });

  describe('unknown state', () => {
    it('should return 400 when state does not match any pending authentication', async () => {
      await server.start();
      const port = server.getPort();
      const result = await httpGet(
        `http://127.0.0.1:${port}/callback?code=some-code&state=unknown-state`,
      );

      expect(result.statusCode).toBe(400);
      expect(result.body).toContain('不明な認証状態');
    });
  });

  describe('OAuth error from provider', () => {
    it('should return 400 when OAuth error is present', async () => {
      await server.start();
      const port = server.getPort();
      const result = await httpGet(
        `http://127.0.0.1:${port}/callback?error=access_denied&error_description=User+denied+access&state=some-state`,
      );

      expect(result.statusCode).toBe(400);
      expect(result.body).toContain('認証エラー');
    });
  });
});
