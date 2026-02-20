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
 * Load and cache configuration from config file
 */
export async function loadConfig(): Promise<Config> {
  if (cachedConfig) {
    return cachedConfig;
  }

  const fullConfig = await loadFullConfig();

  if (!fullConfig.clientId || !fullConfig.clientSecret) {
    throw new Error(
      '認証情報が設定されていません。\n' +
      '`freee-mcp configure` を実行してセットアップしてください。'
    );
  }

  const clientId = fullConfig.clientId;
  const clientSecret = fullConfig.clientSecret;
  const callbackPort = fullConfig.callbackPort || DEFAULT_CALLBACK_PORT;

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
