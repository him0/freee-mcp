import { loadFullConfig } from './config/companies.js';

// Mode can be set programmatically via setMode()
let clientMode = false;

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
  mode: {
    useClientMode: boolean;
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
    console.error('⚠️  警告: 環境変数での認証情報設定は非推奨です。');
    console.error('    `freee-mcp configure` を実行して設定ファイルに移行してください。');
    console.error('    環境変数設定は将来のバージョンで削除される予定です。\n');

    clientId = process.env.FREEE_CLIENT_ID || '';
    clientSecret = process.env.FREEE_CLIENT_SECRET || '';
    callbackPort = process.env.FREEE_CALLBACK_PORT
      ? parseInt(process.env.FREEE_CALLBACK_PORT, 10)
      : 54321;
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
    callbackPort = fullConfig.callbackPort || 54321;
  }

  // Load default company ID from env (deprecated)
  let companyId = process.env.FREEE_DEFAULT_COMPANY_ID || '0';
  if (process.env.FREEE_DEFAULT_COMPANY_ID) {
    console.error('⚠️  警告: FREEE_DEFAULT_COMPANY_ID 環境変数は非推奨です。');
    console.error('    事業所IDは `freee_set_company` ツールで動的に変更できます。\n');
  }

  cachedConfig = {
    freee: {
      clientId,
      clientSecret,
      companyId,
      apiUrl: 'https://api.freee.co.jp',
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
      timeoutMs: 5 * 60 * 1000, // 5分
    },
    mode: {
      useClientMode: clientMode,
    },
  };

  return cachedConfig;
}

/**
 * Get config synchronously (must call loadConfig first)
 * For backward compatibility with existing code
 */
export function getConfig(): Config {
  if (!cachedConfig) {
    throw new Error('Config not loaded. Call loadConfig() first.');
  }
  return cachedConfig;
}

/**
 * Legacy export for backward compatibility
 * @deprecated Use loadConfig() or getConfig() instead
 */
export const config = new Proxy({} as Config, {
  get(_target, prop): unknown {
    if (!cachedConfig) {
      throw new Error('Config not loaded. Call loadConfig() first in async context.');
    }
    return cachedConfig[prop as keyof Config];
  },
});

/**
 * Sets the API mode (client or individual tools)
 */
export function setMode(useClient: boolean): void {
  clientMode = useClient;
}
