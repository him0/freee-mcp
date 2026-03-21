import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OAuthStateStore } from './oauth-store.js';
import { RedisUnavailableError } from './errors.js';
import type { OAuthSessionData, AuthCodeData, RefreshTokenData } from './oauth-store.js';

function createMockRedis() {
  const store = new Map<string, string>();

  return {
    get: vi.fn(async (key: string) => store.get(key) || null),
    set: vi.fn(async (key: string, value: string, _ex?: string, _ttl?: number) => {
      store.set(key, value);
      return 'OK';
    }),
    del: vi.fn(async (key: string) => {
      store.delete(key);
      return 1;
    }),
    getdel: vi.fn(async (key: string) => {
      const value = store.get(key) || null;
      store.delete(key);
      return value;
    }),
    _store: store,
  };
}

const sessionData: OAuthSessionData = {
  clientId: 'client-1',
  redirectUri: 'https://example.com/callback',
  codeChallenge: 'challenge-abc',
  state: 'state-xyz',
  scopes: ['mcp:read', 'mcp:write'],
  freeePkceVerifier: 'verifier-123',
  resource: 'https://mcp.example.com',
};

const authCodeData: AuthCodeData = {
  userId: 'user-42',
  clientId: 'client-1',
  codeChallenge: 'challenge-abc',
  scopes: ['mcp:read', 'mcp:write'],
  redirectUri: 'https://example.com/callback',
};

const refreshData: RefreshTokenData = {
  userId: 'user-42',
  clientId: 'client-1',
  scopes: ['mcp:read', 'mcp:write'],
};

describe('OAuthStateStore', () => {
  let redis: ReturnType<typeof createMockRedis>;
  let store: OAuthStateStore;

  beforeEach(() => {
    redis = createMockRedis();
    store = new OAuthStateStore(redis as never);
  });

  describe('sessions', () => {
    it('saves and consumes a session', async () => {
      await store.saveSession('s1', sessionData);
      expect(redis.set).toHaveBeenCalledWith(
        'freee-mcp:oauth:session:s1',
        JSON.stringify(sessionData),
        'EX',
        600,
      );

      const result = await store.consumeSession('s1');
      expect(result).toEqual(sessionData);
    });

    it('returns null on second consume (one-time use)', async () => {
      await store.saveSession('s2', sessionData);
      await store.consumeSession('s2');
      const result = await store.consumeSession('s2');
      expect(result).toBeNull();
    });

    it('returns null for non-existent session', async () => {
      const result = await store.consumeSession('no-such-session');
      expect(result).toBeNull();
    });
  });

  describe('auth codes', () => {
    it('saves and reads an auth code with getAuthCode', async () => {
      await store.saveAuthCode('code-1', authCodeData);
      expect(redis.set).toHaveBeenCalledWith(
        'freee-mcp:oauth:code:code-1',
        JSON.stringify(authCodeData),
        'EX',
        600,
      );

      const result = await store.getAuthCode('code-1');
      expect(result).toEqual(authCodeData);
    });

    it('getAuthCode does not consume (GET not GETDEL)', async () => {
      await store.saveAuthCode('code-2', authCodeData);
      await store.getAuthCode('code-2');
      const result = await store.getAuthCode('code-2');
      expect(result).toEqual(authCodeData);
    });

    it('consumeAuthCode removes the code', async () => {
      await store.saveAuthCode('code-3', authCodeData);
      const result = await store.consumeAuthCode('code-3');
      expect(result).toEqual(authCodeData);

      const again = await store.consumeAuthCode('code-3');
      expect(again).toBeNull();
    });

    it('returns null for non-existent code', async () => {
      expect(await store.getAuthCode('nope')).toBeNull();
      expect(await store.consumeAuthCode('nope')).toBeNull();
    });
  });

  describe('refresh tokens', () => {
    it('saves and consumes a refresh token', async () => {
      await store.saveRefreshToken('rt-1', refreshData);
      expect(redis.set).toHaveBeenCalledWith(
        'freee-mcp:oauth:refresh:rt-1',
        JSON.stringify(refreshData),
        'EX',
        7776000,
      );

      const result = await store.consumeRefreshToken('rt-1');
      expect(result).toEqual(refreshData);
    });

    it('returns null on second consume', async () => {
      await store.saveRefreshToken('rt-2', refreshData);
      await store.consumeRefreshToken('rt-2');
      expect(await store.consumeRefreshToken('rt-2')).toBeNull();
    });

    it('revokes a refresh token', async () => {
      await store.saveRefreshToken('rt-3', refreshData);
      await store.revokeRefreshToken('rt-3');
      expect(await store.consumeRefreshToken('rt-3')).toBeNull();
    });
  });

  describe('Redis error handling', () => {
    const redisError = new Error('Connection lost');

    it('should throw RedisUnavailableError on saveSession failure', async () => {
      redis.set.mockRejectedValueOnce(redisError);
      await expect(store.saveSession('s-1', sessionData)).rejects.toThrow(RedisUnavailableError);
    });

    it('should throw RedisUnavailableError on consumeSession failure', async () => {
      redis.getdel.mockRejectedValueOnce(redisError);
      await expect(store.consumeSession('s-1')).rejects.toThrow(RedisUnavailableError);
    });

    it('should throw RedisUnavailableError on saveAuthCode failure', async () => {
      redis.set.mockRejectedValueOnce(redisError);
      await expect(store.saveAuthCode('c-1', authCodeData)).rejects.toThrow(RedisUnavailableError);
    });

    it('should throw RedisUnavailableError on getRefreshToken failure', async () => {
      redis.get.mockRejectedValueOnce(redisError);
      await expect(store.getRefreshToken('rt-1')).rejects.toThrow(RedisUnavailableError);
    });

    it('should throw RedisUnavailableError on revokeRefreshToken failure', async () => {
      redis.del.mockRejectedValueOnce(redisError);
      await expect(store.revokeRefreshToken('rt-1')).rejects.toThrow(RedisUnavailableError);
    });

    it('should preserve original error as cause', async () => {
      redis.set.mockRejectedValueOnce(redisError);
      try {
        await store.saveSession('s-1', sessionData);
      } catch (err) {
        expect(err).toBeInstanceOf(RedisUnavailableError);
        expect((err as RedisUnavailableError).cause).toBe(redisError);
      }
    });
  });

  describe('JSON parse error handling', () => {
    it('should return null for malformed session JSON (not throw RedisUnavailableError)', async () => {
      redis.getdel.mockResolvedValueOnce('not-json{');
      const result = await store.consumeSession('bad-session');
      expect(result).toBeNull();
    });

    it('should return null for malformed auth code JSON', async () => {
      redis.get.mockResolvedValueOnce('{{invalid');
      const result = await store.getAuthCode('bad-code');
      expect(result).toBeNull();
    });

    it('should return null for malformed refresh token JSON', async () => {
      redis.get.mockResolvedValueOnce('<not-json>');
      const result = await store.getRefreshToken('bad-rt');
      expect(result).toBeNull();
    });
  });
});
