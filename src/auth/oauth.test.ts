import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import { generatePKCE, buildAuthUrl, exchangeCodeForTokens } from './oauth.js';

vi.mock('crypto');
vi.mock('../config.js', () => ({
  config: {
    freee: {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret'
    },
    oauth: {
      authorizationEndpoint: 'https://accounts.secure.freee.co.jp/public_api/authorize',
      tokenEndpoint: 'https://accounts.secure.freee.co.jp/public_api/token',
      redirectUri: 'http://127.0.0.1:8080/callback',
      scope: 'read write'
    }
  }
}));

vi.mock('./tokens.js', () => ({
  saveTokens: vi.fn()
}));

const mockCrypto = vi.mocked(crypto);
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('oauth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generatePKCE', () => {
    it('should generate PKCE challenge and verifier', () => {
      const mockRandomBytes = vi.fn().mockReturnValue({
        toString: vi.fn().mockReturnValue('test-code-verifier')
      });
      const mockHash = {
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue('test-code-challenge')
      };
      const mockCreateHash = vi.fn().mockReturnValue(mockHash);

      mockCrypto.randomBytes = mockRandomBytes;
      mockCrypto.createHash = mockCreateHash;

      const result = generatePKCE();

      expect(mockRandomBytes).toHaveBeenCalledWith(32);
      expect(mockCreateHash).toHaveBeenCalledWith('sha256');
      expect(mockHash.update).toHaveBeenCalledWith('test-code-verifier');
      expect(mockHash.digest).toHaveBeenCalledWith('base64url');
      expect(result).toEqual({
        codeVerifier: 'test-code-verifier',
        codeChallenge: 'test-code-challenge'
      });
    });
  });

  describe('buildAuthUrl', () => {
    it('should build correct authorization URL', () => {
      const codeChallenge = 'test-challenge';
      const state = 'test-state';
      const redirectUri = 'http://127.0.0.1:8080/callback';

      const result = buildAuthUrl(codeChallenge, state, redirectUri);

      expect(result).toContain('https://accounts.secure.freee.co.jp/public_api/authorize');
      expect(result).toContain('response_type=code');
      expect(result).toContain('client_id=test-client-id');
      expect(result).toContain('redirect_uri=http%3A%2F%2F127.0.0.1%3A8080%2Fcallback');
      expect(result).toContain('scope=read+write');
      expect(result).toContain('state=test-state');
      expect(result).toContain('code_challenge=test-challenge');
      expect(result).toContain('code_challenge_method=S256');
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange authorization code for tokens', async () => {
      const mockTokenResponse = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'read write'
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse)
      });

      const result = await exchangeCodeForTokens('test-code', 'test-verifier', 'http://127.0.0.1:8080/callback');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://accounts.secure.freee.co.jp/public_api/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: 'test-client-id',
            client_secret: 'test-client-secret',
            code: 'test-code',
            redirect_uri: 'http://127.0.0.1:8080/callback',
            code_verifier: 'test-verifier',
          }),
        }
      );

      expect(result).toEqual({
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: expect.any(Number),
        token_type: 'Bearer',
        scope: 'read write'
      });
    });

    it('should throw error when token exchange fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'invalid_grant' })
      });

      await expect(exchangeCodeForTokens('invalid-code', 'test-verifier', 'http://127.0.0.1:8080/callback'))
        .rejects.toThrow('Token exchange failed: 400');
    });

    it('should handle missing optional fields in token response', async () => {
      const mockTokenResponse = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse)
      });

      const result = await exchangeCodeForTokens('test-code', 'test-verifier', 'http://127.0.0.1:8080/callback');

      expect(result.token_type).toBe('Bearer');
      expect(result.scope).toBe('read write');
    });
  });
});