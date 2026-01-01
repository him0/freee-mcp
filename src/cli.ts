import prompts from 'prompts';
import * as os from 'node:os';
import crypto from 'node:crypto';
import open from 'open';
import {
  startCallbackServer,
  stopCallbackServer,
  getActualRedirectUri,
  getDefaultAuthManager,
} from './auth/server.js';
import { buildAuthUrl, exchangeCodeForTokens } from './auth/oauth.js';
import { saveFullConfig, type FullConfig } from './config/companies.js';
import { DEFAULT_CALLBACK_PORT, AUTH_TIMEOUT_MS, FREEE_API_URL } from './constants.js';
import { safeParseJson } from './utils/error.js';

type Credentials = {
  clientId: string;
  clientSecret: string;
  callbackPort: number;
};

type OAuthResult = {
  accessToken: string;
  refreshToken: string;
};

type SelectedCompany = {
  id: number;
  name: string;
  displayName: string;
};

type Company = {
  id: number;
  name: string;
  display_name: string;
};

async function fetchCompanies(accessToken: string): Promise<Company[]> {
  const response = await fetch(`${FREEE_API_URL}/api/1/companies`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await safeParseJson(response);
    throw new Error(
      `事業所一覧の取得に失敗しました: ${response.status} ${JSON.stringify(errorData)}`,
    );
  }

  const data = await response.json();
  return data.companies || [];
}

async function collectCredentials(): Promise<Credentials> {
  const existingConfig = await import('./config/companies.js').then((m) => m.loadFullConfig());
  const hasExistingCredentials = !!(existingConfig.clientId && existingConfig.clientSecret);

  if (hasExistingCredentials) {
    console.log('既存の設定が見つかりました。');
    console.log('  変更しない項目はそのまま Enter を押してください。\n');
  }

  console.log('ステップ 1/3: OAuth認証情報の入力\n');

  const credentials = await prompts([
    {
      type: 'text',
      name: 'clientId',
      message: 'FREEE_CLIENT_ID:',
      initial: existingConfig.clientId || undefined,
      validate: (value: string): string | boolean =>
        value.trim() ? true : 'CLIENT_ID は必須です',
    },
    {
      type: 'password',
      name: 'clientSecret',
      message: hasExistingCredentials
        ? 'FREEE_CLIENT_SECRET (変更しない場合は空欄):'
        : 'FREEE_CLIENT_SECRET:',
      validate: (value: string): string | boolean => {
        if (hasExistingCredentials && !value.trim()) {
          return true;
        }
        return value.trim() ? true : 'CLIENT_SECRET は必須です';
      },
    },
    {
      type: 'text',
      name: 'callbackPort',
      message: 'FREEE_CALLBACK_PORT:',
      initial: String(existingConfig.callbackPort || DEFAULT_CALLBACK_PORT),
    },
  ]);

  if (!credentials.clientId) {
    throw new Error('セットアップがキャンセルされました。');
  }

  const clientId = credentials.clientId.trim();
  const clientSecret = credentials.clientSecret.trim() || existingConfig.clientSecret;
  const callbackPort = parseInt(credentials.callbackPort.trim(), 10);

  if (!clientSecret) {
    throw new Error('CLIENT_SECRET は必須です。');
  }

  process.env.FREEE_CLIENT_ID = clientId;
  process.env.FREEE_CLIENT_SECRET = clientSecret;
  process.env.FREEE_CALLBACK_PORT = String(callbackPort);

  console.log('\n認証情報を受け取りました。\n');

  return { clientId, clientSecret, callbackPort };
}

async function performOAuth(): Promise<OAuthResult> {
  console.log('ステップ 2/3: OAuth認証\n');
  console.log('ブラウザで認証ページを開きます...');

  await import('./config.js').then((m) => m.loadConfig());
  await startCallbackServer();

  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  const state = crypto.randomBytes(16).toString('base64url');

  const authUrl = buildAuthUrl(codeChallenge, state, getActualRedirectUri());

  console.log(`\n認証URL: ${authUrl}\n`);

  await open(authUrl);

  console.log('ブラウザで認証を完了してください...');
  console.log('認証が完了すると自動的に次のステップに進みます。\n');

  const authManager = getDefaultAuthManager();

  const callbackPromise = new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(
      () => {
        reject(new Error('認証がタイムアウトしました（5分）'));
      },
      AUTH_TIMEOUT_MS,
    );

    authManager.registerCliAuthHandler(state, {
      resolve: (code: string): void => {
        clearTimeout(timeout);
        resolve(code);
      },
      reject: (error: Error): void => {
        clearTimeout(timeout);
        reject(error);
      },
      codeVerifier,
    });
  });

  try {
    const authCode = await callbackPromise;
    console.log('認証コードを受け取りました。');

    console.log('トークンを取得中...');
    const tokens = await exchangeCodeForTokens(authCode, codeVerifier, getActualRedirectUri());
    console.log('トークンを取得しました。\n');

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    };
  } finally {
    authManager.removeCliAuthHandler(state);
  }
}

async function selectCompany(accessToken: string): Promise<SelectedCompany> {
  console.log('ステップ 3/3: デフォルト事業所の選択\n');
  console.log('事業所一覧を取得中...');

  const companies = await fetchCompanies(accessToken);

  if (companies.length === 0) {
    throw new Error('利用可能な事業所がありません。');
  }

  const companySelection = await prompts({
    type: 'select',
    name: 'companyId',
    message: 'デフォルトの事業所を選択してください:',
    choices: companies.map((company) => ({
      title: `${company.display_name || company.name} (ID: ${company.id})`,
      value: company.id,
    })),
  });

  if (!companySelection.companyId) {
    throw new Error('セットアップがキャンセルされました。');
  }

  const selectedCompany = companies.find((c) => c.id === companySelection.companyId);

  if (!selectedCompany) {
    throw new Error(`選択した事業所が見つかりません: ID ${companySelection.companyId}`);
  }

  console.log(`\n${selectedCompany.display_name || selectedCompany.name} を選択しました。\n`);

  return {
    id: selectedCompany.id,
    name: selectedCompany.name,
    displayName: selectedCompany.display_name || selectedCompany.name,
  };
}

async function saveConfig(
  credentials: Credentials,
  selectedCompany: SelectedCompany,
): Promise<void> {
  const fullConfig: FullConfig = {
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    callbackPort: credentials.callbackPort,
    defaultCompanyId: String(selectedCompany.id),
  };

  await saveFullConfig(fullConfig);
  console.log('設定情報を保存しました。\n');
  console.log(`デフォルト事業所: ${selectedCompany.displayName} (ID: ${selectedCompany.id})\n`);
  console.log('注: 別の事業所を使用する場合は、APIツールの company_id パラメータで指定できます。\n');

  console.log('=== MCP設定 ===\n');
  console.log('以下の設定をClaude desktopの設定ファイルに追加してください:\n');

  const platform = os.platform();
  let configPath = '';
  if (platform === 'darwin') {
    configPath = '~/Library/Application Support/Claude/claude_desktop_config.json';
  } else if (platform === 'win32') {
    configPath = '%APPDATA%\\Claude\\claude_desktop_config.json';
  } else {
    configPath = '~/.config/Claude/claude_desktop_config.json';
  }

  console.log(`設定ファイルの場所: ${configPath}\n`);

  const mcpConfig = {
    mcpServers: {
      'freee-mcp': {
        command: 'npx',
        args: ['@him0/freee-mcp', 'client'],
      },
    },
  };

  console.log(JSON.stringify(mcpConfig, null, 2));
  console.log('\nセットアップ完了!\n');
  console.log('認証情報は ~/.config/freee-mcp/config.json に保存されました。');
  console.log('トークンは ~/.config/freee-mcp/tokens.json に保存されました。');
  console.log('Claude desktopを再起動すると、freee-mcpが利用可能になります。\n');
}

export async function configure(): Promise<void> {
  console.log('\n=== freee-mcp Configuration Setup ===\n');
  console.log('このウィザードでは、freee-mcpの設定と認証を対話式で行います。');
  console.log('freee OAuth認証情報が必要です。\n');

  try {
    const credentials = await collectCredentials();
    const oauthResult = await performOAuth();
    const selectedCompany = await selectCompany(oauthResult.accessToken);
    await saveConfig(credentials, selectedCompany);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\nError: ${error.message}`);
    } else {
      console.error('\n設定中にエラーが発生しました:', error);
    }
    process.exit(1);
  } finally {
    stopCallbackServer();
  }
}
