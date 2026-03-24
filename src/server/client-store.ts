import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import type { OAuthClientInformationFull } from '@modelcontextprotocol/sdk/shared/auth.js';
import { OAuthClientInformationFullSchema } from '@modelcontextprotocol/sdk/shared/auth.js';
import type { Redis } from '../storage/redis-client.js';
import { type CIMDFetcher, HttpCIMDFetcher, hashCimdUrl } from './cimd-fetcher.js';
import { RedisUnavailableError, withRedis } from './errors.js';
import { getLogger } from './logger.js';

const KEY_PREFIX = 'freee-mcp:oauth';
const CIMD_CACHE_TTL_SECONDS = 60 * 60; // 1 hour
const CLIENT_TTL_SECONDS = 365 * 24 * 60 * 60; // 1 year

export interface ClientStoreOptions {
  redis: Redis;
  cimdFetcher?: CIMDFetcher;
}

function isCimdUrl(clientId: string): boolean {
  try {
    const url = new URL(clientId);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

export class RedisClientStore implements OAuthRegisteredClientsStore {
  private readonly redis: Redis;
  private readonly cimdFetcher: CIMDFetcher;

  constructor(options: ClientStoreOptions) {
    this.redis = options.redis;
    this.cimdFetcher = options.cimdFetcher ?? new HttpCIMDFetcher();
  }

  async getClient(clientId: string): Promise<OAuthClientInformationFull | undefined> {
    if (isCimdUrl(clientId)) {
      return this.getCimdClient(clientId);
    }
    return this.getDcrClient(clientId);
  }

  async registerClient(client: OAuthClientInformationFull): Promise<OAuthClientInformationFull> {
    await withRedis('registerClient', () =>
      this.redis.set(
        `${KEY_PREFIX}:client:${client.client_id}`,
        JSON.stringify(client),
        'EX',
        CLIENT_TTL_SECONDS,
      ),
    );
    return client;
  }

  private async getCimdClient(
    clientIdUrl: string,
  ): Promise<OAuthClientInformationFull | undefined> {
    const hash = hashCimdUrl(clientIdUrl);
    const cacheKey = `${KEY_PREFIX}:cimd:${hash}`;

    const cached = await withRedis('getCimdClient:cache-read', () => this.redis.get(cacheKey));

    if (cached) {
      const parsed = this.parseClientData(cached);
      if (parsed) return parsed;
    }

    try {
      const metadata = await this.cimdFetcher.fetch(clientIdUrl);
      const clientInfo: OAuthClientInformationFull = {
        ...metadata,
        client_id: clientIdUrl,
        client_id_issued_at: Math.floor(Date.now() / 1000),
      };

      await withRedis('getCimdClient:cache-write', () =>
        this.redis.set(cacheKey, JSON.stringify(clientInfo), 'EX', CIMD_CACHE_TTL_SECONDS),
      );
      return clientInfo;
    } catch (err) {
      if (err instanceof RedisUnavailableError) throw err;
      getLogger().error({ clientIdUrl, err }, 'CIMD fetch failed');
      return undefined;
    }
  }

  private async getDcrClient(clientId: string): Promise<OAuthClientInformationFull | undefined> {
    const key = `${KEY_PREFIX}:client:${clientId}`;
    const raw = await withRedis('getDcrClient:read', () => this.redis.get(key));
    if (!raw) return undefined;

    const parsed = this.parseClientData(raw);
    if (parsed) return parsed;

    getLogger().error({ clientId }, 'Corrupt DCR client data, removing key');
    await withRedis('getDcrClient:cleanup', () => this.redis.del(key));
    return undefined;
  }

  private parseClientData(raw: string): OAuthClientInformationFull | null {
    try {
      const result = OAuthClientInformationFullSchema.safeParse(JSON.parse(raw));
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  }
}
