import type { Redis } from '../storage/redis-client.js';
import { RedisUnavailableError } from './errors.js';

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

const KEY_PREFIX = 'freee-mcp:oauth';
const SESSION_TTL_SECONDS = 10 * 60; // 10 minutes
const AUTH_CODE_TTL_SECONDS = 10 * 60; // 10 minutes
const REFRESH_TOKEN_TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days

function tryParseJson<T>(raw: string, label: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    console.error(`[error] Failed to parse ${label} data from Redis`);
    return null;
  }
}

export class OAuthStateStore {
  constructor(private readonly redis: Redis) {}

  // --- Sessions ---

  async saveSession(id: string, data: OAuthSessionData): Promise<void> {
    try {
      await this.redis.set(
        `${KEY_PREFIX}:session:${id}`,
        JSON.stringify(data),
        'EX',
        SESSION_TTL_SECONDS,
      );
    } catch (err) {
      throw new RedisUnavailableError('saveSession', err as Error);
    }
  }

  async consumeSession(id: string): Promise<OAuthSessionData | null> {
    let raw: string | null;
    try {
      raw = await this.redis.getdel(`${KEY_PREFIX}:session:${id}`);
    } catch (err) {
      throw new RedisUnavailableError('consumeSession', err as Error);
    }
    if (!raw) return null;
    return tryParseJson<OAuthSessionData>(raw, 'session');
  }

  // --- Auth Codes ---

  async saveAuthCode(code: string, data: AuthCodeData): Promise<void> {
    try {
      await this.redis.set(
        `${KEY_PREFIX}:code:${code}`,
        JSON.stringify(data),
        'EX',
        AUTH_CODE_TTL_SECONDS,
      );
    } catch (err) {
      throw new RedisUnavailableError('saveAuthCode', err as Error);
    }
  }

  async getAuthCode(code: string): Promise<AuthCodeData | null> {
    let raw: string | null;
    try {
      raw = await this.redis.get(`${KEY_PREFIX}:code:${code}`);
    } catch (err) {
      throw new RedisUnavailableError('getAuthCode', err as Error);
    }
    if (!raw) return null;
    return tryParseJson<AuthCodeData>(raw, 'authCode');
  }

  async consumeAuthCode(code: string): Promise<AuthCodeData | null> {
    let raw: string | null;
    try {
      raw = await this.redis.getdel(`${KEY_PREFIX}:code:${code}`);
    } catch (err) {
      throw new RedisUnavailableError('consumeAuthCode', err as Error);
    }
    if (!raw) return null;
    return tryParseJson<AuthCodeData>(raw, 'authCode');
  }

  // --- Refresh Tokens ---

  async saveRefreshToken(token: string, data: RefreshTokenData): Promise<void> {
    try {
      await this.redis.set(
        `${KEY_PREFIX}:refresh:${token}`,
        JSON.stringify(data),
        'EX',
        REFRESH_TOKEN_TTL_SECONDS,
      );
    } catch (err) {
      throw new RedisUnavailableError('saveRefreshToken', err as Error);
    }
  }

  async getRefreshToken(token: string): Promise<RefreshTokenData | null> {
    let raw: string | null;
    try {
      raw = await this.redis.get(`${KEY_PREFIX}:refresh:${token}`);
    } catch (err) {
      throw new RedisUnavailableError('getRefreshToken', err as Error);
    }
    if (!raw) return null;
    return tryParseJson<RefreshTokenData>(raw, 'refreshToken');
  }

  async consumeRefreshToken(token: string): Promise<RefreshTokenData | null> {
    let raw: string | null;
    try {
      raw = await this.redis.getdel(`${KEY_PREFIX}:refresh:${token}`);
    } catch (err) {
      throw new RedisUnavailableError('consumeRefreshToken', err as Error);
    }
    if (!raw) return null;
    return tryParseJson<RefreshTokenData>(raw, 'refreshToken');
  }

  async revokeRefreshToken(token: string): Promise<void> {
    try {
      await this.redis.del(`${KEY_PREFIX}:refresh:${token}`);
    } catch (err) {
      throw new RedisUnavailableError('revokeRefreshToken', err as Error);
    }
  }
}
