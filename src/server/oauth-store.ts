import type { Redis } from '../storage/redis-client.js';

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

export class OAuthStateStore {
  constructor(private readonly redis: Redis) {}

  // --- Sessions ---

  async saveSession(id: string, data: OAuthSessionData): Promise<void> {
    await this.redis.set(
      `${KEY_PREFIX}:session:${id}`,
      JSON.stringify(data),
      'EX',
      SESSION_TTL_SECONDS,
    );
  }

  async consumeSession(id: string): Promise<OAuthSessionData | null> {
    const raw = await this.redis.getdel(`${KEY_PREFIX}:session:${id}`);
    return raw ? (JSON.parse(raw) as OAuthSessionData) : null;
  }

  // --- Auth Codes ---

  async saveAuthCode(code: string, data: AuthCodeData): Promise<void> {
    await this.redis.set(
      `${KEY_PREFIX}:code:${code}`,
      JSON.stringify(data),
      'EX',
      AUTH_CODE_TTL_SECONDS,
    );
  }

  async getAuthCode(code: string): Promise<AuthCodeData | null> {
    const raw = await this.redis.get(`${KEY_PREFIX}:code:${code}`);
    return raw ? (JSON.parse(raw) as AuthCodeData) : null;
  }

  async consumeAuthCode(code: string): Promise<AuthCodeData | null> {
    const raw = await this.redis.getdel(`${KEY_PREFIX}:code:${code}`);
    return raw ? (JSON.parse(raw) as AuthCodeData) : null;
  }

  // --- Refresh Tokens ---

  async saveRefreshToken(token: string, data: RefreshTokenData): Promise<void> {
    await this.redis.set(
      `${KEY_PREFIX}:refresh:${token}`,
      JSON.stringify(data),
      'EX',
      REFRESH_TOKEN_TTL_SECONDS,
    );
  }

  async getRefreshToken(token: string): Promise<RefreshTokenData | null> {
    const raw = await this.redis.get(`${KEY_PREFIX}:refresh:${token}`);
    return raw ? (JSON.parse(raw) as RefreshTokenData) : null;
  }

  async consumeRefreshToken(token: string): Promise<RefreshTokenData | null> {
    const raw = await this.redis.getdel(`${KEY_PREFIX}:refresh:${token}`);
    return raw ? (JSON.parse(raw) as RefreshTokenData) : null;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.redis.del(`${KEY_PREFIX}:refresh:${token}`);
  }
}
