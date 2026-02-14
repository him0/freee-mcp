import { loadFullConfig } from './config/companies.js';
import { DEFAULT_CALLBACK_PORT, AUTH_TIMEOUT_MS, FREEE_API_URL } from './constants.js';

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
  };
  auth: {
    timeoutMs: number;
  };
}

// Cached config
let cachedConfig: Config | null = null;

/**
 * Check if environment variables are set for credentials
 */
function hasEnvCredentials(): boolean {
  return !!(process.env.FREEE_CLIENT_ID || process.env.FREEE_CLIENT_SECRET);
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
    callbackPort = process.env.FREEE_CALLBACK_PORT
      ? parseInt(process.env.FREEE_CALLBACK_PORT, 10)
      : DEFAULT_CALLBACK_PORT;
  } else {
    // Load from config file
    if (!fullConfig.clientId || !fullConfig.clientSecret) {
      throw new Error(
        '認証情報が設定されていません。\n' +
        '`freee-mcp configure` を実行してセットアップしてください。'
      );
    }

    clientId = fullConfig.clientId;
    clientSecret = fullConfig.clientSecret;
    callbackPort = fullConfig.callbackPort || DEFAULT_CALLBACK_PORT;
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
      authorizationEndpoint: 'https://accounts.secure.freee.co.jp/public_api/authorize',
      tokenEndpoint: 'https://accounts.secure.freee.co.jp/public_api/token',
      scope: 'read write',
    },
    server: {
      name: 'freee',
      version: '1.0.0',
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
