import {
  isTokenValid,
  type OAuthClientConfig,
  refreshFreeeTokenRaw,
  type TokenData,
  TokenDataSchema,
} from '../auth/tokens.js';
import type { CompanyConfig } from '../config/companies.js';
import { withRedis } from '../server/errors.js';
import { getLogger } from '../server/logger.js';
import type { Redis } from './redis-client.js';
import type { TokenStore } from './token-store.js';

const TOKEN_KEY_PREFIX = 'freee-mcp:tokens:';
const COMPANY_KEY_PREFIX = 'freee-mcp:company:';
const TOKEN_TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days

export class RedisTokenStore implements TokenStore {
  private redis: Redis;
  private oauthConfig: OAuthClientConfig;

  constructor(redis: Redis, oauthConfig: OAuthClientConfig) {
    this.redis = redis;
    this.oauthConfig = oauthConfig;
  }

  async loadTokens(userId: string): Promise<TokenData | null> {
    const raw = await withRedis('loadTokens', () => this.redis.get(this.tokenKey(userId)));
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw);
      const result = TokenDataSchema.safeParse(parsed);
      if (!result.success) {
        getLogger().error({ userId, error: result.error.message }, 'Invalid token data in Redis');
        return null;
      }
      return result.data;
    } catch {
      getLogger().error({ userId }, 'Failed to parse token data from Redis');
      return null;
    }
  }

  async saveTokens(userId: string, tokens: TokenData): Promise<void> {
    await withRedis('saveTokens', () =>
      this.redis.set(this.tokenKey(userId), JSON.stringify(tokens), 'EX', TOKEN_TTL_SECONDS),
    );
  }

  async clearTokens(userId: string): Promise<void> {
    await withRedis('clearTokens', () => this.redis.del(this.tokenKey(userId)));
  }

  async getValidAccessToken(userId: string): Promise<string | null> {
    const tokens = await this.loadTokens(userId);
    if (!tokens) {
      return null;
    }

    if (isTokenValid(tokens)) {
      return tokens.access_token;
    }

    // refreshFreeeTokenRaw may throw a freee API error -- that is NOT a Redis error
    const newTokens = await refreshFreeeTokenRaw(tokens.refresh_token, this.oauthConfig);

    await this.saveTokens(userId, newTokens);
    return newTokens.access_token;
  }

  async getCurrentCompanyId(userId: string): Promise<string> {
    const companyId = await withRedis('getCurrentCompanyId', () =>
      this.redis.hget(this.companyKey(userId), 'currentCompanyId'),
    );
    return companyId || '0';
  }

  async setCurrentCompany(
    userId: string,
    companyId: string,
    name?: string,
    description?: string,
  ): Promise<void> {
    const fields: Record<string, string> = {
      currentCompanyId: companyId,
      updatedAt: String(Date.now()),
      name: name ?? '',
      description: description ?? '',
    };
    await withRedis('setCurrentCompany', () => this.redis.hset(this.companyKey(userId), fields));
  }

  async getCompanyInfo(userId: string, companyId: string): Promise<CompanyConfig | null> {
    const data = await withRedis('getCompanyInfo', () =>
      this.redis.hgetall(this.companyKey(userId)),
    );
    if (!data || data.currentCompanyId !== companyId) {
      return null;
    }

    return {
      id: companyId,
      name: data.name,
      description: data.description,
      addedAt: data.updatedAt ? Number(data.updatedAt) : Date.now(),
    };
  }

  private tokenKey(userId: string): string {
    return `${TOKEN_KEY_PREFIX}${userId}`;
  }

  private companyKey(userId: string): string {
    return `${COMPANY_KEY_PREFIX}${userId}`;
  }
}
