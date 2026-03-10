import { loadFullConfig } from './config/companies.js';
import { DEFAULT_CALLBACK_PORT, AUTH_TIMEOUT_MS, FREEE_API_URL } from './constants.js';

/**
 * Validate and parse a callback port value.
 * Returns DEFAULT_CALLBACK_PORT with a warning if the value is invalid.
 */
export function parseCallbackPort(value: string | number | undefined): number {
  if (value === undefined || value === null) {
    return DEFAULT_CALLBACK_PORT;
  }

  const port = typeof value === 'string' ? parseInt(value, 10) : value;

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error(
      `Warning: FREEE_CALLBACK_PORT の値が不正です (${String(value)})。` +
      `デフォルトポート ${DEFAULT_CALLBACK_PORT} を使用します。`
    );
    return DEFAULT_CALLBACK_PORT;
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
      '環境変数を使う場合は FREEE_CLIENT_ID と FREEE_CLIENT_SECRET の両方を設定してください。'
    );
  }

  if (!hasClientId && hasClientSecret) {
    throw new Error(
      '環境変数 FREEE_CLIENT_ID が設定されていません。\n' +
      '`freee-mcp configure` を実行して設定ファイルへ移行することを推奨します。\n' +
      '環境変数を使う場合は FREEE_CLIENT_ID と FREEE_CLIENT_SECRET の両方を設定してください。'
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
    callbackPort = parseCallbackPort(process.env.FREEE_CALLBACK_PORT);
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
    callbackPort = parseCallbackPort(fullConfig.callbackPort);
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
      instructions: 'freee APIと連携するMCPサーバー。会計・人事労務・請求書・工数管理・販売APIをサポート。詳細ガイドはfreee-api-skill skillを参照。skillが未インストールの場合は npx skills add で追加してください。',
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
