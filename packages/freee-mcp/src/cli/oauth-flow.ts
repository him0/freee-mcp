import crypto from 'node:crypto';
import open from 'open';
import {
  startCallbackServer,
  getActualRedirectUri,
  getDefaultAuthManager,
} from '../auth/server.js';
import { buildAuthUrl, exchangeCodeForTokens } from '../auth/oauth.js';
import { AUTH_TIMEOUT_MS } from '../constants.js';
import type { OAuthResult } from './types.js';

export async function performOAuth(): Promise<OAuthResult> {
  console.log('ステップ 2/3: OAuth認証\n');
  console.log('ブラウザで認証ページを開きます...');

  await import('../config.js').then((m) => m.loadConfig());
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
