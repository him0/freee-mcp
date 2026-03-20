import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RedisTokenStore } from './redis-token-store.js';
import type { TokenData } from '../auth/tokens.js';

vi.mock('../auth/tokens.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../auth/tokens.js')>();
  return {
    ...actual,
    refreshFreeeTokenRaw: vi.fn(),
  };
});

const { refreshFreeeTokenRaw } = await import('../auth/tokens.js');

function createMockRedis() {
  const store = new Map<string, string>();
  const hashStore = new Map<string, Record<string, string>>();

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
    hget: vi.fn(async (key: string, field: string) => {
      const hash = hashStore.get(key);
      return hash?.[field] || null;
    }),
    hset: vi.fn(async (key: string, fields: Record<string, string>) => {
      const existing = hashStore.get(key) || {};
      hashStore.set(key, { ...existing, ...fields });
      return Object.keys(fields).length;
    }),
    hgetall: vi.fn(async (key: string) => {
      return hashStore.get(key) || {};
    }),
    // expose stores for test assertions
    _store: store,
    _hashStore: hashStore,
  };
}

const storeOptions = {
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  tokenEndpoint: 'https://test.freee.co.jp/token',
  scope: 'read write',
};

describe('RedisTokenStore', () => {
  let mockRedis: ReturnType<typeof createMockRedis>;
  let tokenStore: RedisTokenStore;

  const mockTokenData: TokenData = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_at: Date.now() + 3600000,
    token_type: 'Bearer',
    scope: 'read write',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockRedis = createMockRedis();
    // Cast to satisfy the Redis type constraint
    tokenStore = new RedisTokenStore(mockRedis as never, storeOptions);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadTokens', () => {
    it('should load tokens from Redis', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify(mockTokenData));

      const result = await tokenStore.loadTokens('user-1');

      expect(mockRedis.get).toHaveBeenCalledWith('freee-mcp:tokens:user-1');
      expect(result).toEqual(mockTokenData);
    });

    it('should return null when no tokens exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await tokenStore.loadTokens('user-1');

      expect(result).toBeNull();
    });

    it('should return null for invalid token data', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ invalid: 'data' }));

      const result = await tokenStore.loadTokens('user-1');

      expect(result).toBeNull();
    });

    it('should return null for malformed JSON', async () => {
      mockRedis.get.mockResolvedValue('not-json');

      const result = await tokenStore.loadTokens('user-1');

      expect(result).toBeNull();
    });
  });

  describe('saveTokens', () => {
    it('should save tokens to Redis with TTL', async () => {
      await tokenStore.saveTokens('user-1', mockTokenData);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'freee-mcp:tokens:user-1',
        JSON.stringify(mockTokenData),
        'EX',
        90 * 24 * 60 * 60,
      );
    });
  });

  describe('clearTokens', () => {
    it('should delete tokens from Redis', async () => {
      await tokenStore.clearTokens('user-1');

      expect(mockRedis.del).toHaveBeenCalledWith('freee-mcp:tokens:user-1');
    });
  });

  describe('getValidAccessToken', () => {
    it('should return valid access token', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify(mockTokenData));

      const result = await tokenStore.getValidAccessToken('user-1');

      expect(result).toBe('test-access-token');
    });

    it('should return null when no tokens exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await tokenStore.getValidAccessToken('user-1');

      expect(result).toBeNull();
    });

    it('should refresh expired token and save to Redis', async () => {
      const expiredToken = {
        ...mockTokenData,
        expires_at: Date.now() - 3600000,
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(expiredToken));

      const newTokens: TokenData = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_at: Date.now() + 3600000,
        token_type: 'Bearer',
        scope: 'read write',
      };
      vi.mocked(refreshFreeeTokenRaw).mockResolvedValue(newTokens);

      const result = await tokenStore.getValidAccessToken('user-1');

      expect(result).toBe('new-access-token');
      expect(refreshFreeeTokenRaw).toHaveBeenCalledWith(
        'test-refresh-token',
        storeOptions,
      );
      expect(mockRedis.set).toHaveBeenCalledWith(
        'freee-mcp:tokens:user-1',
        JSON.stringify(newTokens),
        'EX',
        expect.any(Number),
      );
    });
  });

  describe('getCurrentCompanyId', () => {
    it('should return company ID from Redis', async () => {
      mockRedis.hget.mockResolvedValue('12345');

      const result = await tokenStore.getCurrentCompanyId('user-1');

      expect(result).toBe('12345');
      expect(mockRedis.hget).toHaveBeenCalledWith('freee-mcp:company:user-1', 'currentCompanyId');
    });

    it('should return default "0" when not set', async () => {
      mockRedis.hget.mockResolvedValue(null);

      const result = await tokenStore.getCurrentCompanyId('user-1');

      expect(result).toBe('0');
    });
  });

  describe('setCurrentCompany', () => {
    it('should set company with all fields', async () => {
      await tokenStore.setCurrentCompany('user-1', '12345', 'My Company', 'A description');

      expect(mockRedis.hset).toHaveBeenCalledWith('freee-mcp:company:user-1', {
        currentCompanyId: '12345',
        updatedAt: expect.any(String),
        name: 'My Company',
        description: 'A description',
      });
    });

    it('should set company with only required fields', async () => {
      await tokenStore.setCurrentCompany('user-1', '12345');

      expect(mockRedis.hset).toHaveBeenCalledWith('freee-mcp:company:user-1', {
        currentCompanyId: '12345',
        updatedAt: expect.any(String),
        name: '',
        description: '',
      });
    });
  });

  describe('getCompanyInfo', () => {
    it('should return company info when matching', async () => {
      mockRedis.hgetall.mockResolvedValue({
        currentCompanyId: '12345',
        name: 'My Company',
        description: 'desc',
        updatedAt: '1700000000000',
      });

      const result = await tokenStore.getCompanyInfo('user-1', '12345');

      expect(result).toEqual({
        id: '12345',
        name: 'My Company',
        description: 'desc',
        addedAt: 1700000000000,
      });
    });

    it('should return null when company ID does not match', async () => {
      mockRedis.hgetall.mockResolvedValue({
        currentCompanyId: '99999',
        name: 'Other',
      });

      const result = await tokenStore.getCompanyInfo('user-1', '12345');

      expect(result).toBeNull();
    });

    it('should return null when no data exists', async () => {
      mockRedis.hgetall.mockResolvedValue({});

      const result = await tokenStore.getCompanyInfo('user-1', '12345');

      expect(result).toBeNull();
    });
  });
});
