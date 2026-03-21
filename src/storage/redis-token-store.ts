import type { Redis } from './redis-client.js';
import {
  type TokenData,
  type OAuthClientConfig,
  TokenDataSchema,
  refreshFreeeTokenRaw,
  isTokenValid,
} from '../auth/tokens.js';
import type { CompanyConfig } from '../config/companies.js';
import type { TokenStore } from './token-store.js';
import { RedisUnavailableError } from '../server/errors.js';

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
    let raw: string | null;
    try {
      raw = await this.redis.get(this.tokenKey(userId));
    } catch (err) {
      throw new RedisUnavailableError('loadTokens', err as Error);
    }
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw);
      const result = TokenDataSchema.safeParse(parsed);
      if (!result.success) {
        console.error(
          `[error] Invalid token data in Redis for user ${userId}:`,
          result.error.message,
        );
        return null;
      }
      return result.data;
    } catch {
      console.error(`[error] Failed to parse token data from Redis for user ${userId}`);
      return null;
    }
  }

  async saveTokens(userId: string, tokens: TokenData): Promise<void> {
    try {
      await this.redis.set(this.tokenKey(userId), JSON.stringify(tokens), 'EX', TOKEN_TTL_SECONDS);
    } catch (err) {
      throw new RedisUnavailableError('saveTokens', err as Error);
    }
  }

  async clearTokens(userId: string): Promise<void> {
    try {
      await this.redis.del(this.tokenKey(userId));
    } catch (err) {
      throw new RedisUnavailableError('clearTokens', err as Error);
    }
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
    try {
      const companyId = await this.redis.hget(this.companyKey(userId), 'currentCompanyId');
      return companyId || '0';
    } catch (err) {
      throw new RedisUnavailableError('getCurrentCompanyId', err as Error);
    }
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
    try {
      await this.redis.hset(this.companyKey(userId), fields);
    } catch (err) {
      throw new RedisUnavailableError('setCurrentCompany', err as Error);
    }
  }

  async getCompanyInfo(userId: string, companyId: string): Promise<CompanyConfig | null> {
    let data: Record<string, string>;
    try {
      data = await this.redis.hgetall(this.companyKey(userId));
    } catch (err) {
      throw new RedisUnavailableError('getCompanyInfo', err as Error);
    }
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
