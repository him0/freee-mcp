import { OAUTH_KEY_PREFIX, REFRESH_TOKEN_TTL_SECONDS } from '../constants.js';
import type { Redis } from '../storage/redis-client.js';
import { withRedis } from './errors.js';
import { getLogger } from './logger.js';

export interface OAuthSessionData {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
  scopes: string[];
  freeePkceVerifier: string;
  resource?: string;
}

export interface AuthCodeData {
  userId: string;
  clientId: string;
  codeChallenge: string;
  scopes: string[];
  redirectUri: string;
  resource?: string;
}

export interface RefreshTokenData {
  userId: string;
  clientId: string;
  scopes: string[];
}

const SESSION_TTL_SECONDS = 10 * 60; // 10 minutes
const AUTH_CODE_TTL_SECONDS = 10 * 60; // 10 minutes

function tryParseJson<T>(raw: string, label: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    getLogger().error({ label }, 'Failed to parse data from Redis');
    return null;
  }
}

export class OAuthStateStore {
  constructor(
    private readonly redis: Redis,
    private readonly prefix: string = OAUTH_KEY_PREFIX,
  ) {}

  // --- Sessions ---

  async saveSession(id: string, data: OAuthSessionData): Promise<void> {
    await withRedis('saveSession', () =>
      this.redis.set(
        `${this.prefix}:session:${id}`,
        JSON.stringify(data),
        'EX',
        SESSION_TTL_SECONDS,
      ),
    );
  }

  async consumeSession(id: string): Promise<OAuthSessionData | null> {
    const raw = await withRedis('consumeSession', () =>
      this.redis.getdel(`${this.prefix}:session:${id}`),
    );
    if (!raw) return null;
    return tryParseJson<OAuthSessionData>(raw, 'session');
  }

  // --- Auth Codes ---

  async saveAuthCode(code: string, data: AuthCodeData): Promise<void> {
    await withRedis('saveAuthCode', () =>
      this.redis.set(
        `${this.prefix}:code:${code}`,
        JSON.stringify(data),
        'EX',
        AUTH_CODE_TTL_SECONDS,
      ),
    );
  }

  async getAuthCode(code: string): Promise<AuthCodeData | null> {
    const raw = await withRedis('getAuthCode', () => this.redis.get(`${this.prefix}:code:${code}`));
    if (!raw) return null;
    return tryParseJson<AuthCodeData>(raw, 'authCode');
  }

  async consumeAuthCode(code: string): Promise<AuthCodeData | null> {
    const raw = await withRedis('consumeAuthCode', () =>
      this.redis.getdel(`${this.prefix}:code:${code}`),
    );
    if (!raw) return null;
    return tryParseJson<AuthCodeData>(raw, 'authCode');
  }

  // --- Refresh Tokens ---

  async saveRefreshToken(token: string, data: RefreshTokenData): Promise<void> {
    await withRedis('saveRefreshToken', () =>
      this.redis.set(
        `${this.prefix}:refresh:${token}`,
        JSON.stringify(data),
        'EX',
        REFRESH_TOKEN_TTL_SECONDS,
      ),
    );
  }

  async getRefreshToken(token: string): Promise<RefreshTokenData | null> {
    const raw = await withRedis('getRefreshToken', () =>
      this.redis.get(`${this.prefix}:refresh:${token}`),
    );
    if (!raw) return null;
    return tryParseJson<RefreshTokenData>(raw, 'refreshToken');
  }

  async consumeRefreshToken(token: string): Promise<RefreshTokenData | null> {
    const raw = await withRedis('consumeRefreshToken', () =>
      this.redis.getdel(`${this.prefix}:refresh:${token}`),
    );
    if (!raw) return null;
    return tryParseJson<RefreshTokenData>(raw, 'refreshToken');
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await withRedis('revokeRefreshToken', () => this.redis.del(`${this.prefix}:refresh:${token}`));
  }
}
