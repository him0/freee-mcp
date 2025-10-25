import prompts from 'prompts';
import * as os from 'node:os';
import crypto from 'node:crypto';
import open from 'open';
import {
  startCallbackServer,
  stopCallbackServer,
  getActualRedirectUri,
  getActualCallbackPort,
} from './auth/server.js';
import { buildAuthUrl, exchangeCodeForTokens } from './auth/oauth.js';
import { config as defaultConfig } from './config.js';
import {
  setCurrentCompany,
  saveFullConfig,
  type FullConfig,
} from './config/companies.js';

interface ConfigValues {
  clientId: string;
  clientSecret: string;
  companyId: string;
  callbackPort: string;
}

interface Company {
  id: number;
  name: string;
  display_name: string;
  role: string;
}

interface CliAuthHandler {
  resolve: (code: string) => void;
  reject: (error: Error) => void;
  codeVerifier: string;
}

declare global {
  var __cliAuthHandlers: Record<string, CliAuthHandler> | undefined;
}

async function fetchCompanies(accessToken: string): Promise<Company[]> {
  const response = await fetch(
    `${defaultConfig.freee.apiUrl}/api/1/companies`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `事業所一覧の取得に失敗しました: ${response.status} ${JSON.stringify(errorData)}`
    );
  }

  const data = await response.json();
  return data.companies || [];
}

export async function configure(): Promise<void> {
  console.log('\n=== freee-mcp Configuration Setup ===\n');
  console.log(
    'このウィザードでは、freee-mcpの設定と認証を対話式で行います。'
  );
  console.log('freee OAuth認証情報が必要です。\n');

  let configValues: ConfigValues | null = null;

  try {
    // Step 1: Collect OAuth credentials
    console.log('ステップ 1/3: OAuth認証情報の入力\n');

    const credentials = await prompts([
      {
        type: 'text',
        name: 'clientId',
        message: 'FREEE_CLIENT_ID:',
        validate: (value: string): string | boolean => value.trim() ? true : 'CLIENT_ID は必須です'
      },
      {
        type: 'password',
        name: 'clientSecret',
        message: 'FREEE_CLIENT_SECRET:',
        validate: (value: string): string | boolean => value.trim() ? true : 'CLIENT_SECRET は必須です'
      },
      {
        type: 'text',
        name: 'callbackPort',
        message: 'FREEE_CALLBACK_PORT:',
        initial: '54321'
      }
    ]);

    // Check if user cancelled (Ctrl+C)
    if (!credentials.clientId || !credentials.clientSecret) {
      console.error('\n❌ セットアップがキャンセルされました。');
      process.exit(1);
    }

    const { clientId, clientSecret, callbackPort } = credentials;

    // Set temporary environment variables for this process
    process.env.FREEE_CLIENT_ID = clientId.trim();
    process.env.FREEE_CLIENT_SECRET = clientSecret.trim();
    process.env.FREEE_CALLBACK_PORT = callbackPort.trim();

    console.log('\n✓ 認証情報を受け取りました。\n');

    // Step 2: Perform OAuth authentication
    console.log('ステップ 2/3: OAuth認証\n');
    console.log('ブラウザで認証ページを開きます...');

    // Load config first (required by startCallbackServer)
    await import('./config.js').then(m => m.loadConfig());

    // Start callback server
    await startCallbackServer();

    // Generate PKCE
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    const state = crypto.randomBytes(16).toString('base64url');

    // Build auth URL
    const authUrl = buildAuthUrl(codeChallenge, state, getActualRedirectUri());

    console.log(`\n認証URL: ${authUrl}\n`);

    // Open browser
    await open(authUrl);

    console.log('ブラウザで認証を完了してください...');
    console.log(
      '認証が完了すると自動的に次のステップに進みます。\n'
    );

    // Wait for callback (with timeout)
    let authCode: string | null = null;
    let authError: Error | null = null;

    const callbackPromise = new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('認証がタイムアウトしました（5分）'));
      }, 5 * 60 * 1000);

      // Store callback handlers globally so server.ts can access them
      if (!global.__cliAuthHandlers) {
        global.__cliAuthHandlers = {};
      }
      global.__cliAuthHandlers[state] = {
        resolve: (code: string): void => {
          clearTimeout(timeout);
          resolve(code);
        },
        reject: (error: Error): void => {
          clearTimeout(timeout);
          reject(error);
        },
        codeVerifier,
      };
    });

    try {
      authCode = await callbackPromise;
      console.log('✓ 認証コードを受け取りました。');

      // Exchange code for tokens
      console.log('トークンを取得中...');
      const tokens = await exchangeCodeForTokens(
        authCode,
        codeVerifier,
        getActualRedirectUri()
      );
      console.log('✓ トークンを取得しました。\n');

      // Step 3: Fetch and select company
      console.log('ステップ 3/3: デフォルト事業所の選択\n');
      console.log('事業所一覧を取得中...');

      const companies = await fetchCompanies(tokens.access_token);

      if (companies.length === 0) {
        console.error('❌ 利用可能な事業所がありません。');
        process.exit(1);
      }

      const companySelection = await prompts({
        type: 'select',
        name: 'companyId',
        message: 'デフォルトの事業所を選択してください:',
        choices: companies.map((company) => ({
          title: `${company.display_name || company.name} (ID: ${company.id}) - ${company.role}`,
          value: company.id
        }))
      });

      if (!companySelection.companyId) {
        console.error('\n❌ セットアップがキャンセルされました。');
        process.exit(1);
      }

      const selectedCompany = companies.find(c => c.id === companySelection.companyId)!;

      console.log(
        `\n✓ ${selectedCompany.display_name || selectedCompany.name} を選択しました。\n`
      );

      // Save full configuration (credentials + companies)
      const fullConfig: FullConfig = {
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        callbackPort: parseInt(callbackPort.trim(), 10),
        defaultCompanyId: String(selectedCompany.id),
        currentCompanyId: String(selectedCompany.id),
        companies: {},
      };

      companies.forEach((company) => {
        fullConfig.companies[String(company.id)] = {
          id: String(company.id),
          name: company.display_name || company.name,
          description: `Role: ${company.role}`,
          addedAt: Date.now(),
          lastUsed:
            company.id === selectedCompany!.id ? Date.now() : undefined,
        };
      });

      await saveFullConfig(fullConfig);
      console.log('✓ 設定情報を保存しました。\n');

      configValues = {
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        companyId: String(selectedCompany.id),
        callbackPort: callbackPort.trim(),
      };
    } catch (error) {
      authError = error as Error;
      console.error(`\n❌ 認証に失敗しました: ${authError.message}`);
      throw error;
    } finally {
      // Clean up global handlers
      if (global.__cliAuthHandlers) {
        delete global.__cliAuthHandlers[state];
      }
    }

    // Step 4: Display MCP configuration
    console.log('=== MCP設定 ===\n');
    console.log('以下の設定をClaude desktopの設定ファイルに追加してください:\n');

    const platform = os.platform();
    let configPath = '';
    if (platform === 'darwin') {
      configPath =
        '~/Library/Application Support/Claude/claude_desktop_config.json';
    } else if (platform === 'win32') {
      configPath = '%APPDATA%\\Claude\\claude_desktop_config.json';
    } else {
      configPath = '~/.config/Claude/claude_desktop_config.json';
    }

    console.log(`設定ファイルの場所: ${configPath}\n`);

    const mcpConfig = {
      mcpServers: {
        freee: {
          command: 'npx',
          args: ['@him0/freee-mcp'],
        },
      },
    };

    console.log(JSON.stringify(mcpConfig, null, 2));
    console.log('\n✓ セットアップ完了！\n');
    console.log('認証情報は ~/.config/freee-mcp/config.json に保存されました。');
    console.log('トークンは ~/.config/freee-mcp/tokens.json に保存されました。');
    console.log(
      'Claude desktopを再起動すると、freee-mcpが利用可能になります。\n'
    );
  } catch (error) {
    console.error('\n設定中にエラーが発生しました:', error);
    process.exit(1);
  } finally {
    stopCallbackServer();
  }
}

