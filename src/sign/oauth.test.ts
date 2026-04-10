import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildSignAuthUrl, exchangeSignCodeForTokens } from './oauth.js';

vi.mock('./config.js', () => ({
  SIGN_AUTHORIZATION_ENDPOINT: 'https://ninja-sign.com/oauth/authorize',
  SIGN_TOKEN_ENDPOINT: 'https://ninja-sign.com/oauth/token',
  SIGN_OAUTH_SCOPE: 'all',
  getSignCredentials: (): Promise<{ clientId: string; clientSecret: string; callbackPort: number }> =>
    Promise.resolve({
      clientId: 'sign-test-client-id',
      clientSecret: 'sign-test-client-secret',
      callbackPort: 54322,
    }),
}));

vi.mock('./tokens.js', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    saveSignTokens: vi.fn(),
  };
});

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('sign/oauth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('buildSignAuthUrl', () => {
    it('PKCE パラメータなしの URL を生成する', () => {
      const result = buildSignAuthUrl('test-state', 'http://127.0.0.1:54321/callback', 'sign-test-client-id');

      expect(result).toContain('https://ninja-sign.com/oauth/authorize');
      expect(result).toContain('response_type=code');
      expect(result).toContain('client_id=sign-test-client-id');
      expect(result).toContain('scope=all');
      expect(result).toContain('state=test-state');
      // PKCE parameters must NOT be present
      expect(result).not.toContain('code_challenge');
      expect(result).not.toContain('code_challenge_method');
    });
  });

  describe('exchangeSignCodeForTokens', () => {
    it('code_verifier なしでトークン交換する', async () => {
      const mockTokenResponse = {
        access_token: 'sign-access-token',
        refresh_token: 'sign-refresh-token',
        expires_in: 7200,
        token_type: 'Bearer',
        scope: 'all',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      });

      const result = await exchangeSignCodeForTokens(
        'test-code',
        'http://127.0.0.1:54321/callback',
      );

      const fetchCall = mockFetch.mock.calls[0];
      const body = fetchCall[1].body as URLSearchParams;

      // code_verifier must NOT be sent
      expect(body.get('code_verifier')).toBeNull();
      expect(body.get('grant_type')).toBe('authorization_code');
      expect(body.get('client_id')).toBe('sign-test-client-id');
      expect(body.get('client_secret')).toBe('sign-test-client-secret');

      expect(result.access_token).toBe('sign-access-token');
      expect(result.refresh_token).toBe('sign-refresh-token');
      expect(result.scope).toBe('all');
    });

    it('無効な client_secret → 401 エラー', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'invalid_client' }),
      });

      await expect(
        exchangeSignCodeForTokens('test-code', 'http://127.0.0.1:54321/callback'),
      ).rejects.toThrow('Token exchange failed: 401');
    });

    it('OAuth error=access_denied → エラー', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'access_denied' }),
      });

      await expect(
        exchangeSignCodeForTokens('test-code', 'http://127.0.0.1:54321/callback'),
      ).rejects.toThrow('Token exchange failed: 400');
    });
  });

  describe('リクエストヘッダー', () => {
    it('User-Agent ヘッダーが freee-mcp プレフィックスで始まる', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'at',
            refresh_token: 'rt',
            expires_in: 7200,
          }),
      });

      await exchangeSignCodeForTokens('code', 'http://127.0.0.1:54321/callback');

      const fetchCall = mockFetch.mock.calls[0];
      const headers = fetchCall[1].headers;
      expect(headers['User-Agent']).toMatch(/^freee-mcp\//);
    });
  });
});
