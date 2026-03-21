import { createRequire } from 'node:module';
import { loadFullConfig } from './config/companies.js';
import {
  AUTH_TIMEOUT_MS,
  DEFAULT_CALLBACK_PORT,
  FREEE_API_URL,
  FREEE_AUTHORIZATION_ENDPOINT,
  FREEE_OAUTH_SCOPE,
  FREEE_TOKEN_ENDPOINT,
  SERVER_INSTRUCTIONS,
} from './constants.js';

const require = createRequire(import.meta.url);
const { version: packageVersion } = require('../package.json') as { version: string };

/**
 * Validate and parse a port value.
 * Returns defaultPort with a warning if the value is invalid.
 */
export function parsePort(value: string | number | undefined, defaultPort: number): number {
  if (value === undefined || value === null) {
    return defaultPort;
  }

  const port = typeof value === 'string' ? parseInt(value, 10) : value;

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error(
      `Warning: ポートの値が不正です (${String(value)})。デフォルトポート ${defaultPort} を使用します。`,
    );
    return defaultPort;
  }

  return port;
}

export interface Config {
  freee: {
    clientId: string;
    clientSecret: string;
    companyId: string;
    apiUrl: string;
  };
  oauth: {
    callbackPort: number;
    redirectUri: string;
    authorizationEndpoint: string;
    tokenEndpoint: string;
    scope: string;
  };
  server: {
    name: string;
    version: string;
    instructions: string;
  };
  auth: {
    timeoutMs: number;
  };
}

// Cached config
let cachedConfig: Config | null = null;

/**
 * Check if environment variables are set for credentials.
 * Both FREEE_CLIENT_ID and FREEE_CLIENT_SECRET must be set together.
 * Throws an error if only one of them is set.
 */
function hasEnvCredentials(): boolean {
  const hasClientId = !!process.env.FREEE_CLIENT_ID;
  const hasClientSecret = !!process.env.FREEE_CLIENT_SECRET;

  if (hasClientId && !hasClientSecret) {
    throw new Error(
      '環境変数 FREEE_CLIENT_SECRET が設定されていません。\n' +
        '`freee-mcp configure` を実行して設定ファイルへ移行することを推奨します。\n' +
        '環境変数を使う場合は FREEE_CLIENT_ID と FREEE_CLIENT_SECRET の両方を設定してください。',
    );
  }

  if (!hasClientId && hasClientSecret) {
    throw new Error(
      '環境変数 FREEE_CLIENT_ID が設定されていません。\n' +
        '`freee-mcp configure` を実行して設定ファイルへ移行することを推奨します。\n' +
        '環境変数を使う場合は FREEE_CLIENT_ID と FREEE_CLIENT_SECRET の両方を設定してください。',
    );
  }

  return hasClientId && hasClientSecret;
}

/**
 * Load and cache configuration
 * Priority: environment variables > config file > error
 */
export async function loadConfig(): Promise<Config> {
  if (cachedConfig) {
    return cachedConfig;
  }

  const fullConfig = await loadFullConfig();

  // Load credentials with priority: env > file
  let clientId: string;
  let clientSecret: string;
  let callbackPort: number;

  if (hasEnvCredentials()) {
    // Environment variables take priority (with deprecation warning)
    console.error('Warning: 環境変数での認証情報設定は非推奨です。');
    console.error('  `freee-mcp configure` を実行して設定ファイルに移行してください。');
    console.error('  環境変数設定は将来のバージョンで削除される予定です。\n');

    clientId = process.env.FREEE_CLIENT_ID || '';
    clientSecret = process.env.FREEE_CLIENT_SECRET || '';
    callbackPort = parsePort(process.env.FREEE_CALLBACK_PORT, DEFAULT_CALLBACK_PORT);
  } else {
    // Load from config file
    if (!fullConfig.clientId || !fullConfig.clientSecret) {
      throw new Error(
        '認証情報が設定されていません。\n' +
          '`freee-mcp configure` を実行してセットアップしてください。',
      );
    }

    clientId = fullConfig.clientId;
    clientSecret = fullConfig.clientSecret;
    callbackPort = parsePort(fullConfig.callbackPort, DEFAULT_CALLBACK_PORT);
  }

  cachedConfig = {
    freee: {
      clientId,
      clientSecret,
      companyId: '0',
      apiUrl: FREEE_API_URL,
    },
    oauth: {
      callbackPort,
      redirectUri: `http://127.0.0.1:${callbackPort}/callback`,
      authorizationEndpoint: FREEE_AUTHORIZATION_ENDPOINT,
      tokenEndpoint: FREEE_TOKEN_ENDPOINT,
      scope: FREEE_OAUTH_SCOPE,
    },
    server: {
      name: 'freee',
      version: packageVersion,
      instructions: SERVER_INSTRUCTIONS,
    },
    auth: {
      timeoutMs: AUTH_TIMEOUT_MS,
    },
  };

  return cachedConfig;
}

/**
 * Get cached configuration synchronously
 * Throws if loadConfig() has not been called yet
 */
export function getConfig(): Config {
  if (!cachedConfig) {
    throw new Error('Config not loaded. Call loadConfig() first in async context.');
  }
  return cachedConfig;
}

export interface RemoteServerConfig {
  port: number;
  issuerUrl: string;
  jwtSecret: string;
  freeeClientId: string;
  freeeClientSecret: string;
  freeeAuthorizationEndpoint: string;
  freeeTokenEndpoint: string;
  freeeScope: string;
  redisUrl: string;
}

export function loadRemoteServerConfig(): RemoteServerConfig {
  const issuerUrl = process.env.ISSUER_URL;
  if (!issuerUrl) {
    throw new Error('ISSUER_URL environment variable is required for serve mode.');
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required for serve mode.');
  }
  if (jwtSecret.length < 32) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters. Use a cryptographically random value: openssl rand -hex 32',
    );
  }

  const freeeClientId = process.env.FREEE_CLIENT_ID;
  const freeeClientSecret = process.env.FREEE_CLIENT_SECRET;

  if (!freeeClientId || !freeeClientSecret) {
    throw new Error(
      'FREEE_CLIENT_ID and FREEE_CLIENT_SECRET environment variables are required for serve mode.',
    );
  }

  return {
    port: parsePort(process.env.PORT, 3000),
    issuerUrl,
    jwtSecret,
    freeeClientId,
    freeeClientSecret,
    freeeAuthorizationEndpoint:
      process.env.FREEE_AUTHORIZATION_ENDPOINT || FREEE_AUTHORIZATION_ENDPOINT,
    freeeTokenEndpoint: process.env.FREEE_TOKEN_ENDPOINT || FREEE_TOKEN_ENDPOINT,
    freeeScope: process.env.FREEE_SCOPE || FREEE_OAUTH_SCOPE,
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  };
}

// Initialize cachedConfig for remote mode so getConfig() works without loadConfig()
export function initRemoteConfig(remoteConfig: RemoteServerConfig): void {
  cachedConfig = {
    freee: {
      clientId: remoteConfig.freeeClientId,
      clientSecret: remoteConfig.freeeClientSecret,
      companyId: '0',
      apiUrl: FREEE_API_URL,
    },
    oauth: {
      callbackPort: DEFAULT_CALLBACK_PORT,
      redirectUri: `http://127.0.0.1:${DEFAULT_CALLBACK_PORT}/callback`,
      authorizationEndpoint: remoteConfig.freeeAuthorizationEndpoint,
      tokenEndpoint: remoteConfig.freeeTokenEndpoint,
      scope: remoteConfig.freeeScope,
    },
    server: {
      name: 'freee',
      version: packageVersion,
      instructions: SERVER_INSTRUCTIONS,
    },
    auth: {
      timeoutMs: AUTH_TIMEOUT_MS,
    },
  };
}
