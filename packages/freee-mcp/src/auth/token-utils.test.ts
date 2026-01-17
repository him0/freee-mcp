import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTokenData, TokenResponse, TokenFallbacks } from './token-utils.js';

describe('token-utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createTokenData', () => {
    it('should create TokenData with all fields from response', () => {
      const response: TokenResponse = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'read write',
      };
      const fallbacks: TokenFallbacks = {
        refreshToken: 'fallback-refresh-token',
        scope: 'fallback-scope',
      };

      const result = createTokenData(response, fallbacks);

      expect(result).toEqual({
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: Date.now() + 3600 * 1000,
        token_type: 'Bearer',
        scope: 'read write',
      });
    });

    it('should use fallback refreshToken when response refresh_token is undefined', () => {
      const response: TokenResponse = {
        access_token: 'test-access-token',
        expires_in: 3600,
      };
      const fallbacks: TokenFallbacks = {
        refreshToken: 'fallback-refresh-token',
        scope: 'fallback-scope',
      };

      const result = createTokenData(response, fallbacks);

      expect(result.refresh_token).toBe('fallback-refresh-token');
    });

    it('should use empty string when both refresh_token and fallback are undefined', () => {
      const response: TokenResponse = {
        access_token: 'test-access-token',
        expires_in: 3600,
      };
      const fallbacks: TokenFallbacks = {
        scope: 'fallback-scope',
      };

      const result = createTokenData(response, fallbacks);

      expect(result.refresh_token).toBe('');
    });

    it('should use Bearer as default token_type when not provided', () => {
      const response: TokenResponse = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
      };
      const fallbacks: TokenFallbacks = {
        scope: 'fallback-scope',
      };

      const result = createTokenData(response, fallbacks);

      expect(result.token_type).toBe('Bearer');
    });

    it('should use fallback scope when response scope is undefined', () => {
      const response: TokenResponse = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
      };
      const fallbacks: TokenFallbacks = {
        scope: 'fallback-scope',
      };

      const result = createTokenData(response, fallbacks);

      expect(result.scope).toBe('fallback-scope');
    });

    it('should calculate expires_at correctly from expires_in', () => {
      const response: TokenResponse = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 7200,
        token_type: 'Bearer',
        scope: 'read write',
      };
      const fallbacks: TokenFallbacks = {
        scope: 'fallback-scope',
      };

      const result = createTokenData(response, fallbacks);

      expect(result.expires_at).toBe(Date.now() + 7200 * 1000);
    });

    it('should prefer response values over fallbacks', () => {
      const response: TokenResponse = {
        access_token: 'response-access-token',
        refresh_token: 'response-refresh-token',
        expires_in: 3600,
        token_type: 'CustomType',
        scope: 'response-scope',
      };
      const fallbacks: TokenFallbacks = {
        refreshToken: 'fallback-refresh-token',
        scope: 'fallback-scope',
      };

      const result = createTokenData(response, fallbacks);

      expect(result.refresh_token).toBe('response-refresh-token');
      expect(result.token_type).toBe('CustomType');
      expect(result.scope).toBe('response-scope');
    });
  });
});
