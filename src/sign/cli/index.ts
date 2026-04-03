import crypto from 'node:crypto';
import open from 'open';
import prompts from 'prompts';
import {
  getDefaultAuthManager,
  startCallbackServer,
  stopCallbackServer,
} from '../../auth/server.js';
import {
  type McpTarget,
  addMcpServerConfig,
  checkMcpConfigStatus,
  getTargetDisplayName,
} from '../../config/mcp-config.js';
import { AUTH_TIMEOUT_MS } from '../../constants.js';
import { clearSignConfig, loadSignConfig, saveSignConfig } from '../config.js';
import { buildSignAuthUrl, exchangeSignCodeForTokens } from '../oauth.js';
import { type SignCredentials, collectSignCredentials } from './prompts.js';

interface SignConfigureOptions {
  force?: boolean;
}

async function resetExistingConfig(): Promise<void> {
  console.log('保存済みのログイン情報をリセットしています...');
  const { clearSignTokens } = await import('../tokens.js');
  await clearSignTokens();
  await clearSignConfig();
  console.log('リセットが完了しました。\n');
}

async function saveCredentials(credentials: SignCredentials): Promise<void> {
  const config = await loadSignConfig();
  config.clientId = credentials.clientId;
  config.clientSecret = credentials.clientSecret;
  config.callbackPort = credentials.callbackPort;
  await saveSignConfig(config);
}

async function performSignOAuthFlow(credentials: SignCredentials): Promise<void> {
  console.log('ステップ 2/2: OAuth認証\n');
  console.log('ブラウザで認証ページを開きます...');

  await startCallbackServer(credentials.callbackPort);

  const state = crypto.randomBytes(16).toString('base64url');
  const redirectUri = `http://127.0.0.1:${credentials.callbackPort}/callback`;
  const authUrl = buildSignAuthUrl(state, redirectUri, credentials.clientId);

  console.log(`\n認証URL: ${authUrl}\n`);

  await open(authUrl);

  console.log('ブラウザで認証を完了してください...');
  console.log('認証が完了すると自動的に次のステップに進みます。\n');

  const authManager = getDefaultAuthManager();

  const callbackPromise = new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('認証がタイムアウトしました（5分）'));
    }, AUTH_TIMEOUT_MS);

    authManager.registerCliAuthHandler(state, {
      resolve: (code: string): void => {
        clearTimeout(timeout);
        resolve(code);
      },
      reject: (error: Error): void => {
        clearTimeout(timeout);
        reject(error);
      },
      codeVerifier: '',
    });
  });

  try {
    const authCode = await callbackPromise;
    console.log('認証コードを受け取りました。');

    console.log('トークンを取得中...');
    await exchangeSignCodeForTokens(authCode, redirectUri);
    console.log('トークンを取得しました。\n');
  } finally {
    authManager.removeCliAuthHandler(state);
  }
}

const SIGN_MCP_SERVER_NAME = 'freee-sign-mcp';

async function addSignMcpConfig(target: McpTarget): Promise<void> {
  await addMcpServerConfig(target, SIGN_MCP_SERVER_NAME, {
    command: 'npx',
    args: ['freee-sign-mcp'],
  });
}

async function configureSignMcpTarget(target: 'claude-code' | 'claude-desktop'): Promise<void> {
  const status = await checkMcpConfigStatus(target);
  const displayName = getTargetDisplayName(target);

  const { shouldAdd } = await prompts({
    type: 'confirm',
    name: 'shouldAdd',
    message: `${displayName} に freee-sign を追加しますか?`,
    initial: true,
  });

  if (shouldAdd) {
    await addSignMcpConfig(target);
    console.log(`  ✓ ${displayName} に ${SIGN_MCP_SERVER_NAME} を追加しました。`);
    console.log(`    設定ファイル: ${status.path}`);
  } else {
    console.log(`  - ${displayName} への追加をスキップしました。`);
  }
}

async function configureSignMcp(): Promise<void> {
  console.log('=== MCP設定 ===\n');
  console.log('Claude Code / Claude Desktop に freee-sign を設定できます。\n');

  await configureSignMcpTarget('claude-code');
  console.log('');

  await configureSignMcpTarget('claude-desktop');
  console.log('');

  console.log('=== Skill (API リファレンス) の更新 ===\n');
  console.log('サイン API リファレンスを利用するには、スキルを最新版に更新してください:\n');
  console.log('  npx skills add freee/freee-mcp\n');
}

export async function signConfigure(options: SignConfigureOptions = {}): Promise<void> {
  console.log('\n=== freee-mcp vdev Sign Configuration Setup ===\n');

  if (options.force) {
    await resetExistingConfig();
  }

  console.log('このウィザードでは、freee サインの設定と認証を対話式で行います。');
  console.log('freee サイン OAuth認証情報が必要です。\n');

  const credentials = await collectSignCredentials();
  console.log('\n認証情報を受け取りました。\n');

  await saveCredentials(credentials);
  await performSignOAuthFlow(credentials);

  stopCallbackServer();

  console.log('設定情報を保存しました。\n');
  console.log('認証情報は ~/.config/freee-mcp/sign-config.json に保存されました。');
  console.log('トークンは ~/.config/freee-mcp/sign-tokens.json に保存されました。\n');

  await configureSignMcp();

  console.log('セットアップ完了!');
  console.log('変更を反映するには、Claude Code / Claude Desktop を再起動してください。\n');
}
