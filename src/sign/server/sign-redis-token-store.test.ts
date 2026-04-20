import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TokenData } from '../../auth/tokens.js';
import { REFRESH_TOKEN_TTL_SECONDS } from '../../constants.js';
import { SignRedisTokenStore } from './sign-redis-token-store.js';

vi.mock('../../auth/tokens.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../auth/tokens.js')>();
  return {
    ...actual,
    isTokenValid: vi.fn(),
    refreshFreeeTokenRaw: vi.fn(),
  };
});

vi.mock('../../server/logger.js', () => ({
  getLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock('../../server/errors.js', () => ({
  withRedis: vi.fn(async (_op: string, fn: () => Promise<unknown>) => fn()),
}));

const { isTokenValid, refreshFreeeTokenRaw } = await import('../../auth/tokens.js');

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
    _store: store,
  };
}

const oauthConfig = {
  clientId: 'sign-client-1',
  clientSecret: 'sign-secret-1',
  tokenEndpoint: 'https://accounts.secure.freee.co.jp/public_api/token',
  scope: 'sign',
};

const validTokens: TokenData = {
  access_token: 'access-abc',
  refresh_token: 'refresh-xyz',
  expires_at: Date.now() + 3600_000,
  token_type: 'Bearer',
  scope: 'sign',
};

describe('SignRedisTokenStore', () => {
  let redis: ReturnType<typeof createMockRedis>;
  let store: SignRedisTokenStore;

  beforeEach(() => {
    vi.clearAllMocks();
    redis = createMockRedis();
    store = new SignRedisTokenStore(redis as never, oauthConfig);
  });

  describe('loadTokens', () => {
    it('returns TokenData when Redis has valid data', async () => {
      redis._store.set('freee-sign-mcp:tokens:user-1', JSON.stringify(validTokens));

      const result = await store.loadTokens('user-1');
      expect(result).toEqual(validTokens);
      expect(redis.get).toHaveBeenCalledWith('freee-sign-mcp:tokens:user-1');
    });

    it('returns null when Redis has no data', async () => {
      const result = await store.loadTokens('user-2');
      expect(result).toBeNull();
    });

    it('returns null for invalid JSON', async () => {
      redis._store.set('freee-sign-mcp:tokens:user-3', 'not-json{');

      const result = await store.loadTokens('user-3');
      expect(result).toBeNull();
    });
  });

  describe('saveTokens', () => {
    it('stores tokens in Redis with TTL', async () => {
      await store.saveTokens('user-1', validTokens);

      expect(redis.set).toHaveBeenCalledWith(
        'freee-sign-mcp:tokens:user-1',
        JSON.stringify(validTokens),
        'EX',
        REFRESH_TOKEN_TTL_SECONDS,
      );
    });
  });

  describe('clearTokens', () => {
    it('deletes tokens from Redis', async () => {
      redis._store.set('freee-sign-mcp:tokens:user-1', JSON.stringify(validTokens));

      await store.clearTokens('user-1');

      expect(redis.del).toHaveBeenCalledWith('freee-sign-mcp:tokens:user-1');
    });
  });

  describe('getValidAccessToken', () => {
    it('returns access_token when token is valid', async () => {
      redis._store.set('freee-sign-mcp:tokens:user-1', JSON.stringify(validTokens));
      vi.mocked(isTokenValid).mockReturnValue(true);

      const result = await store.getValidAccessToken('user-1');
      expect(result).toBe('access-abc');
      expect(refreshFreeeTokenRaw).not.toHaveBeenCalled();
    });

    it('refreshes and returns new access_token when token is expired', async () => {
      const expiredTokens: TokenData = {
        ...validTokens,
        expires_at: Date.now() - 1000,
      };
      redis._store.set('freee-sign-mcp:tokens:user-1', JSON.stringify(expiredTokens));
      vi.mocked(isTokenValid).mockReturnValue(false);

      const refreshedTokens: TokenData = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_at: Date.now() + 3600_000,
        token_type: 'Bearer',
        scope: 'sign',
      };
      vi.mocked(refreshFreeeTokenRaw).mockResolvedValue(refreshedTokens);

      const result = await store.getValidAccessToken('user-1');
      expect(result).toBe('new-access-token');
      expect(refreshFreeeTokenRaw).toHaveBeenCalledWith(expiredTokens.refresh_token, oauthConfig);
      expect(redis.set).toHaveBeenCalledWith(
        'freee-sign-mcp:tokens:user-1',
        JSON.stringify(refreshedTokens),
        'EX',
        REFRESH_TOKEN_TTL_SECONDS,
      );
    });

    it('returns null when Redis has no data', async () => {
      const result = await store.getValidAccessToken('user-no-data');
      expect(result).toBeNull();
      expect(isTokenValid).not.toHaveBeenCalled();
    });
  });
});
