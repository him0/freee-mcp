import crypto from 'node:crypto';
import { getConfig } from '../../config.js';
import { generatePKCE, buildAuthUrl } from '../../auth/oauth.js';
import { registerAuthenticationRequest, getActualRedirectUri, startCallbackServerWithAutoStop } from '../../auth/server.js';
import { AUTH_TIMEOUT_MS } from '../../constants.js';
import { FileTokenStore } from '../../storage/file-token-store.js';
import { writeStderr } from '../output.js';

export async function handleAuthenticate(): Promise<void> {
  const config = getConfig();

  if (!config.freee.clientId || !config.freee.clientSecret) {
    throw new Error('認証情報が設定されていません。`freee-mcp configure` を実行してください。');
  }

  await startCallbackServerWithAutoStop(AUTH_TIMEOUT_MS);

  const { codeVerifier, codeChallenge } = generatePKCE();
  const state = crypto.randomBytes(16).toString('hex');
  const authUrl = buildAuthUrl(codeChallenge, state, getActualRedirectUri());

  registerAuthenticationRequest(state, codeVerifier);

  writeStderr(`認証URL: ${authUrl}`);
  writeStderr('ブラウザで開いて認証してください。5分でタイムアウトします。');
}

export async function handleAuthStatus(): Promise<void> {
  const tokenStore = new FileTokenStore();
  const tokens = await tokenStore.loadTokens('local');
  if (!tokens) {
    writeStderr('未認証。`freee-cli authenticate` で認証してください。');
    return;
  }

  const isValid = Date.now() < tokens.expires_at;
  const expiryDate = new Date(tokens.expires_at).toLocaleString();

  writeStderr(`認証状態: ${isValid ? '有効' : '期限切れ'}`);
  writeStderr(`有効期限: ${expiryDate}`);
  if (!isValid) {
    writeStderr('次回API使用時に自動更新されます。');
  }
}

export async function handleClearAuth(): Promise<void> {
  const tokenStore = new FileTokenStore();
  await tokenStore.clearTokens('local');
  writeStderr('認証情報をクリアしました。');
}
