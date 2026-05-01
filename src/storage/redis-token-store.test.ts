import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TokenData } from '../auth/tokens.js';
import { RedisUnavailableError } from '../server/errors.js';
import { RedisTokenStore } from './redis-token-store.js';

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
    it('should delete tokens, current company, dict, and legacy keys', async () => {
      await tokenStore.clearTokens('user-1');

      expect(mockRedis.del).toHaveBeenCalledWith('freee-mcp:tokens:user-1');
      expect(mockRedis.del).toHaveBeenCalledWith('freee-mcp:company:user-1');
      expect(mockRedis.del).toHaveBeenCalledWith('freee-mcp:company:current:user-1');
      expect(mockRedis.del).toHaveBeenCalledWith('freee-mcp:company:dict:user-1');
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
      expect(refreshFreeeTokenRaw).toHaveBeenCalledWith('test-refresh-token', storeOptions);
      expect(mockRedis.set).toHaveBeenCalledWith(
        'freee-mcp:tokens:user-1',
        JSON.stringify(newTokens),
        'EX',
        expect.any(Number),
      );
    });
  });

  describe('getCurrentCompanyId', () => {
    it('should return company ID from the new dedicated key', async () => {
      mockRedis._store.set('freee-mcp:company:current:user-1', '12345');

      const result = await tokenStore.getCurrentCompanyId('user-1');

      expect(result).toBe('12345');
      expect(mockRedis.get).toHaveBeenCalledWith('freee-mcp:company:current:user-1');
    });

    it('should fall back to the legacy hash when the new key is missing', async () => {
      mockRedis._hashStore.set('freee-mcp:company:user-1', { currentCompanyId: '67890' });

      const result = await tokenStore.getCurrentCompanyId('user-1');

      expect(result).toBe('67890');
      expect(mockRedis.hget).toHaveBeenCalledWith('freee-mcp:company:user-1', 'currentCompanyId');
    });

    it('should return default "0" when neither new nor legacy keys exist', async () => {
      const result = await tokenStore.getCurrentCompanyId('user-1');

      expect(result).toBe('0');
    });
  });

  describe('setCurrentCompany', () => {
    function getDictEntry(
      userId: string,
      companyId: string,
    ): { name?: string; display_name?: string; description?: string; updatedAt?: number } | null {
      const hash = mockRedis._hashStore.get(`freee-mcp:company:dict:${userId}`);
      const raw = hash?.[companyId];
      return raw ? JSON.parse(raw) : null;
    }

    it('should write current company id and a dict entry with all fields', async () => {
      await tokenStore.setCurrentCompany(
        'user-1',
        '12345',
        'My Company',
        'A description',
        'My Company DBA',
      );

      expect(mockRedis._store.get('freee-mcp:company:current:user-1')).toBe('12345');
      const entry = getDictEntry('user-1', '12345');
      expect(entry).toEqual({
        name: 'My Company',
        display_name: 'My Company DBA',
        description: 'A description',
        updatedAt: expect.any(Number),
      });
    });

    it('should preserve existing name when subsequent call omits the name arg', async () => {
      await tokenStore.setCurrentCompany('user-1', '12345', 'My Company', 'A description');
      await tokenStore.setCurrentCompany('user-1', '12345');

      const entry = getDictEntry('user-1', '12345');
      expect(entry?.name).toBe('My Company');
      expect(entry?.description).toBe('A description');
    });

    it('should overwrite name only when an explicit value is provided', async () => {
      await tokenStore.setCurrentCompany('user-1', '12345', 'Old Name');
      await tokenStore.setCurrentCompany('user-1', '12345', 'New Name');

      expect(getDictEntry('user-1', '12345')?.name).toBe('New Name');
    });

    it('should keep per-company entries separate when switching companies', async () => {
      await tokenStore.setCurrentCompany('user-1', 'A', 'Alpha');
      await tokenStore.setCurrentCompany('user-1', 'B', 'Beta');
      await tokenStore.setCurrentCompany('user-1', 'A');

      expect(mockRedis._store.get('freee-mcp:company:current:user-1')).toBe('A');
      expect(getDictEntry('user-1', 'A')?.name).toBe('Alpha');
      expect(getDictEntry('user-1', 'B')?.name).toBe('Beta');
    });
  });

  describe('getCompanyInfo', () => {
    it('should return the dict entry for a matching company id', async () => {
      mockRedis._hashStore.set('freee-mcp:company:dict:user-1', {
        '12345': JSON.stringify({
          name: 'My Company',
          display_name: 'My Co',
          description: 'desc',
          updatedAt: 1700000000000,
        }),
      });

      const result = await tokenStore.getCompanyInfo('user-1', '12345');

      expect(result).toEqual({
        id: '12345',
        name: 'My Company',
        display_name: 'My Co',
        description: 'desc',
        addedAt: 1700000000000,
      });
    });

    it('should fall back to legacy hash and lazily backfill the new dict', async () => {
      mockRedis._hashStore.set('freee-mcp:company:user-1', {
        currentCompanyId: '12345',
        name: 'Legacy Co',
        description: 'old desc',
        updatedAt: '1699000000000',
      });

      const result = await tokenStore.getCompanyInfo('user-1', '12345');

      expect(result).toEqual({
        id: '12345',
        name: 'Legacy Co',
        description: 'old desc',
        addedAt: 1699000000000,
      });

      const dict = mockRedis._hashStore.get('freee-mcp:company:dict:user-1');
      expect(dict?.['12345']).toBeDefined();
      const entry = JSON.parse(dict?.['12345'] ?? '{}');
      expect(entry).toMatchObject({
        name: 'Legacy Co',
        description: 'old desc',
      });
    });

    it('should return null when legacy entry exists for a different company', async () => {
      mockRedis._hashStore.set('freee-mcp:company:user-1', {
        currentCompanyId: '99999',
        name: 'Other',
      });

      const result = await tokenStore.getCompanyInfo('user-1', '12345');

      expect(result).toBeNull();
    });

    it('should return null when no data exists in either store', async () => {
      const result = await tokenStore.getCompanyInfo('user-1', '12345');

      expect(result).toBeNull();
    });
  });

  describe('Redis error handling', () => {
    const redisError = new Error('Connection lost');

    it('should throw RedisUnavailableError on loadTokens failure', async () => {
      mockRedis.get.mockRejectedValue(redisError);
      await expect(tokenStore.loadTokens('user-1')).rejects.toThrow(RedisUnavailableError);
      await expect(tokenStore.loadTokens('user-1')).rejects.toThrow('loadTokens');
    });

    it('should throw RedisUnavailableError on saveTokens failure', async () => {
      mockRedis.set.mockRejectedValue(redisError);
      await expect(tokenStore.saveTokens('user-1', mockTokenData)).rejects.toThrow(
        RedisUnavailableError,
      );
    });

    it('should throw RedisUnavailableError on clearTokens failure', async () => {
      mockRedis.del.mockRejectedValue(redisError);
      await expect(tokenStore.clearTokens('user-1')).rejects.toThrow(RedisUnavailableError);
    });

    it('should throw RedisUnavailableError on getCurrentCompanyId failure', async () => {
      mockRedis.hget.mockRejectedValue(redisError);
      await expect(tokenStore.getCurrentCompanyId('user-1')).rejects.toThrow(RedisUnavailableError);
    });

    it('should throw RedisUnavailableError on setCurrentCompany failure', async () => {
      mockRedis.hset.mockRejectedValue(redisError);
      await expect(tokenStore.setCurrentCompany('user-1', '123')).rejects.toThrow(
        RedisUnavailableError,
      );
    });

    it('should throw RedisUnavailableError on getCompanyInfo failure', async () => {
      mockRedis.hgetall.mockRejectedValue(redisError);
      await expect(tokenStore.getCompanyInfo('user-1', '123')).rejects.toThrow(
        RedisUnavailableError,
      );
    });

    it('should preserve original error as cause', async () => {
      mockRedis.get.mockRejectedValue(redisError);
      try {
        await tokenStore.loadTokens('user-1');
      } catch (err) {
        expect(err).toBeInstanceOf(RedisUnavailableError);
        expect((err as RedisUnavailableError).cause).toBe(redisError);
      }
    });
  });
});
