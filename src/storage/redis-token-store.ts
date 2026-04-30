import {
  isTokenValid,
  type OAuthClientConfig,
  refreshFreeeTokenRaw,
  type TokenData,
  TokenDataSchema,
} from '../auth/tokens.js';
import type { CompanyConfig } from '../config/companies.js';
import { REFRESH_TOKEN_TTL_SECONDS } from '../constants.js';
import { withRedis } from '../server/errors.js';
import { getLogger } from '../server/logger.js';
import type { Redis } from './redis-client.js';
import type { TokenStore } from './token-store.js';

const TOKEN_KEY_PREFIX = 'freee-mcp:tokens:';
// Legacy single-slot hash. Read-only fallback; new writes go to the keys below.
const COMPANY_KEY_PREFIX = 'freee-mcp:company:';
// Current company id, one value per user.
const COMPANY_CURRENT_KEY_PREFIX = 'freee-mcp:company:current:';
// Per-company dictionary: hash field=companyId, value=JSON({ name?, display_name?, description?, updatedAt }).
const COMPANY_DICT_KEY_PREFIX = 'freee-mcp:company:dict:';

interface DictEntry {
  name?: string;
  display_name?: string;
  description?: string;
  updatedAt?: number;
}

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
      this.redis.set(
        this.tokenKey(userId),
        JSON.stringify(tokens),
        'EX',
        REFRESH_TOKEN_TTL_SECONDS,
      ),
    );
  }

  async clearTokens(userId: string): Promise<void> {
    await withRedis('clearTokens', async () => {
      await Promise.all([
        this.redis.del(this.tokenKey(userId)),
        this.redis.del(this.companyKey(userId)),
        this.redis.del(this.companyCurrentKey(userId)),
        this.redis.del(this.companyDictKey(userId)),
      ]);
    });
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
    // Prefer the new dedicated key; fall back to the legacy single-slot hash.
    const fromNew = await withRedis('getCurrentCompanyId', () =>
      this.redis.get(this.companyCurrentKey(userId)),
    );
    if (fromNew) {
      return fromNew;
    }
    const fromLegacy = await withRedis('getCurrentCompanyId', () =>
      this.redis.hget(this.companyKey(userId), 'currentCompanyId'),
    );
    return fromLegacy || '0';
  }

  async setCurrentCompany(
    userId: string,
    companyId: string,
    name?: string,
    description?: string,
    display_name?: string,
  ): Promise<void> {
    await withRedis('setCurrentCompany', () =>
      this.redis.set(this.companyCurrentKey(userId), companyId),
    );
    // Merge into the per-company dict, preserving fields the caller omitted.
    const existing = (await this.readDictEntry(userId, companyId)) ?? {};
    const merged: DictEntry = {
      ...existing,
      updatedAt: Date.now(),
    };
    if (name !== undefined) merged.name = name;
    if (display_name !== undefined) merged.display_name = display_name;
    if (description !== undefined) merged.description = description;
    await withRedis('setCurrentCompany', () =>
      this.redis.hset(this.companyDictKey(userId), {
        [companyId]: JSON.stringify(merged),
      }),
    );
  }

  async getCompanyInfo(userId: string, companyId: string): Promise<CompanyConfig | null> {
    const fromDict = await this.readDictEntry(userId, companyId);
    if (fromDict) {
      return {
        id: companyId,
        name: fromDict.name,
        display_name: fromDict.display_name,
        description: fromDict.description,
        addedAt: fromDict.updatedAt ?? Date.now(),
      };
    }
    // Legacy single-slot fallback. Returns null when the legacy entry is for
    // a different company or absent.
    const legacy = await withRedis('getCompanyInfo', () =>
      this.redis.hgetall(this.companyKey(userId)),
    );
    if (!legacy || legacy.currentCompanyId !== companyId) {
      return null;
    }
    const result: CompanyConfig = {
      id: companyId,
      name: legacy.name || undefined,
      description: legacy.description || undefined,
      addedAt: legacy.updatedAt ? Number(legacy.updatedAt) : Date.now(),
    };
    // Best-effort lazy backfill into the new dict.
    try {
      const entry: DictEntry = { updatedAt: result.addedAt };
      if (result.name) entry.name = result.name;
      if (result.description) entry.description = result.description;
      await this.redis.hset(this.companyDictKey(userId), {
        [companyId]: JSON.stringify(entry),
      });
    } catch (err) {
      getLogger().warn({ err, userId, companyId }, 'company dict backfill failed (non-fatal)');
    }
    return result;
  }

  private async readDictEntry(userId: string, companyId: string): Promise<DictEntry | null> {
    const raw = await withRedis('getCompanyInfo', () =>
      this.redis.hget(this.companyDictKey(userId), companyId),
    );
    if (!raw) return null;
    try {
      return JSON.parse(raw) as DictEntry;
    } catch {
      return null;
    }
  }

  private tokenKey(userId: string): string {
    return `${TOKEN_KEY_PREFIX}${userId}`;
  }

  private companyKey(userId: string): string {
    return `${COMPANY_KEY_PREFIX}${userId}`;
  }

  private companyCurrentKey(userId: string): string {
    return `${COMPANY_CURRENT_KEY_PREFIX}${userId}`;
  }

  private companyDictKey(userId: string): string {
    return `${COMPANY_DICT_KEY_PREFIX}${userId}`;
  }
}
