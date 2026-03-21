import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedisClientStore } from './client-store.js';
import type { CIMDFetcher } from './cimd-fetcher.js';
import type {
  OAuthClientInformationFull,
  OAuthClientMetadata,
} from '@modelcontextprotocol/sdk/shared/auth.js';

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

function createMockFetcher(metadata?: OAuthClientMetadata): CIMDFetcher {
  return {
    fetch: vi.fn(async () => {
      if (!metadata) throw new Error('CIMD fetch failed');
      return metadata;
    }),
  };
}

const cimdMetadata: OAuthClientMetadata = {
  redirect_uris: ['https://claude.ai/api/mcp/auth_callback'],
  client_name: 'Claude',
  token_endpoint_auth_method: 'none',
};

const dcrClient: OAuthClientInformationFull = {
  client_id: 'chatgpt-client-123',
  redirect_uris: ['https://chatgpt.com/connector/oauth/abc'],
  client_name: 'ChatGPT',
  token_endpoint_auth_method: 'none',
  client_id_issued_at: 1700000000,
};

describe('RedisClientStore', () => {
  let redis: ReturnType<typeof createMockRedis>;

  beforeEach(() => {
    redis = createMockRedis();
  });

  describe('DCR clients', () => {
    it('registers and retrieves a DCR client', async () => {
      const store = new RedisClientStore({ redis: redis as never });

      await store.registerClient(dcrClient);
      expect(redis.set).toHaveBeenCalledWith(
        'freee-mcp:oauth:client:chatgpt-client-123',
        expect.any(String),
        'EX',
        31536000,
      );

      const result = await store.getClient('chatgpt-client-123');
      expect(result?.client_id).toBe('chatgpt-client-123');
      expect(result?.client_name).toBe('ChatGPT');
    });

    it('returns undefined for unknown DCR client', async () => {
      const store = new RedisClientStore({ redis: redis as never });
      const result = await store.getClient('unknown-id');
      expect(result).toBeUndefined();
    });

    it('cleans up corrupt DCR data', async () => {
      redis._store.set('freee-mcp:oauth:client:bad-data', '{invalid json broken');
      const store = new RedisClientStore({ redis: redis as never });

      const result = await store.getClient('bad-data');
      expect(result).toBeUndefined();
    });
  });

  describe('CIMD clients', () => {
    it('fetches and caches CIMD metadata', async () => {
      const fetcher = createMockFetcher(cimdMetadata);
      const store = new RedisClientStore({ redis: redis as never, cimdFetcher: fetcher });

      const result = await store.getClient('https://claude.ai/oauth/mcp-oauth-client-metadata');
      expect(fetcher.fetch).toHaveBeenCalledWith(
        'https://claude.ai/oauth/mcp-oauth-client-metadata',
      );
      expect(result?.client_id).toBe('https://claude.ai/oauth/mcp-oauth-client-metadata');
      expect(result?.redirect_uris).toEqual(['https://claude.ai/api/mcp/auth_callback']);
      expect(result?.client_name).toBe('Claude');
    });

    it('returns cached CIMD on second call without re-fetching', async () => {
      const fetcher = createMockFetcher(cimdMetadata);
      const store = new RedisClientStore({ redis: redis as never, cimdFetcher: fetcher });

      await store.getClient('https://claude.ai/oauth/mcp-oauth-client-metadata');
      await store.getClient('https://claude.ai/oauth/mcp-oauth-client-metadata');

      expect(fetcher.fetch).toHaveBeenCalledTimes(1);
    });

    it('returns undefined when CIMD fetch fails and no cache', async () => {
      const fetcher = createMockFetcher(); // will throw
      const store = new RedisClientStore({ redis: redis as never, cimdFetcher: fetcher });

      const result = await store.getClient('https://example.com/bad-cimd');
      expect(result).toBeUndefined();
    });

    it('treats non-HTTPS client_id as DCR (not CIMD)', async () => {
      const fetcher = createMockFetcher(cimdMetadata);
      const store = new RedisClientStore({ redis: redis as never, cimdFetcher: fetcher });

      // HTTP URL should NOT be treated as CIMD
      const result = await store.getClient('http://example.com/metadata');
      expect(fetcher.fetch).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });
});
