import {
  isTokenValid,
  type OAuthClientConfig,
  refreshFreeeTokenRaw,
  type TokenData,
  TokenDataSchema,
} from '../../auth/tokens.js';
import { REFRESH_TOKEN_TTL_SECONDS } from '../../constants.js';
import { withRedis } from '../../server/errors.js';
import { getLogger } from '../../server/logger.js';
import type { Redis } from '../../storage/redis-client.js';

const TOKEN_KEY_PREFIX = 'freee-sign-mcp:tokens:';

export interface SignTokenStore {
  loadTokens(userId: string): Promise<TokenData | null>;
  saveTokens(userId: string, tokens: TokenData): Promise<void>;
  clearTokens(userId: string): Promise<void>;
  getValidAccessToken(userId: string): Promise<string | null>;
}

export class SignRedisTokenStore implements SignTokenStore {
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
        getLogger().error(
          { userId, error: result.error.message },
          'Invalid Sign token data in Redis',
        );
        return null;
      }
      return result.data;
    } catch {
      getLogger().error({ userId }, 'Failed to parse Sign token data from Redis');
      return null;
    }
  }

  async saveTokens(userId: string, tokens: TokenData): Promise<void> {
    await withRedis('saveTokens', () =>
      this.redis.set(
        this.tokenKey(userId),
        JSON.stringify(tokens),
        'EX',
        REFRESH_TOKEN_TTL_SECONDS,
      ),
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

  private tokenKey(userId: string): string {
    return `${TOKEN_KEY_PREFIX}${userId}`;
  }
}
