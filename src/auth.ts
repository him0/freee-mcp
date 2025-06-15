import crypto from 'crypto';
import http from 'http';
import { URL } from 'url';
import open from 'open';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

// OAuth設定
const OAUTH_CONFIG = {
  clientId: process.env.FREEE_CLIENT_ID || '', // 環境変数から取得
  redirectUri: 'http://127.0.0.1:8080/callback',
  authorizationEndpoint: 'https://accounts.secure.freee.co.jp/public_api/authorize',
  tokenEndpoint: 'https://accounts.secure.freee.co.jp/public_api/token',
  scope: 'read write',
  oobRedirectUri: 'urn:ietf:wg:oauth:2.0:oob',
};

// トークンの型定義
export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp
  token_type: string;
  scope: string;
}

// PKCE用のcode_verifierとcode_challengeを生成
function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

// トークンファイルのパスを取得
function getTokenFilePath(): string {
  const configDir = path.join(os.homedir(), '.config', 'freee-mcp');
  return path.join(configDir, 'tokens.json');
}

// トークンをファイルに保存
export async function saveTokens(tokens: TokenData): Promise<void> {
  const tokenPath = getTokenFilePath();
  const configDir = path.dirname(tokenPath);
  
  try {
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(tokenPath, JSON.stringify(tokens, null, 2), { mode: 0o600 });
    console.error('Tokens saved successfully');
  } catch (error) {
    console.error('Failed to save tokens:', error);
    throw error;
  }
}

// トークンをファイルから読み込み
export async function loadTokens(): Promise<TokenData | null> {
  const tokenPath = getTokenFilePath();
  
  try {
    const data = await fs.readFile(tokenPath, 'utf8');
    return JSON.parse(data) as TokenData;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null; // ファイルが存在しない
    }
    console.error('Failed to load tokens:', error);
    throw error;
  }
}

// トークンの有効性をチェック
export function isTokenValid(tokens: TokenData): boolean {
  return Date.now() < tokens.expires_at;
}

// リフレッシュトークンを使用してアクセストークンを更新
export async function refreshAccessToken(refreshToken: string): Promise<TokenData> {
  const response = await fetch(OAUTH_CONFIG.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: OAUTH_CONFIG.clientId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Token refresh failed: ${response.status} ${JSON.stringify(errorData)}`);
  }

  const tokenResponse = await response.json();
  const tokens: TokenData = {
    access_token: tokenResponse.access_token,
    refresh_token: tokenResponse.refresh_token || refreshToken, // 新しいリフレッシュトークンがない場合は既存のものを使用
    expires_at: Date.now() + (tokenResponse.expires_in * 1000),
    token_type: tokenResponse.token_type || 'Bearer',
    scope: tokenResponse.scope || OAUTH_CONFIG.scope,
  };

  await saveTokens(tokens);
  return tokens;
}

// トークンファイルをクリア（認証リセット）
export async function clearTokens(): Promise<void> {
  const tokenPath = getTokenFilePath();
  
  try {
    await fs.unlink(tokenPath);
    console.error('Tokens cleared successfully');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error('No tokens to clear (file does not exist)');
      return;
    }
    console.error('Failed to clear tokens:', error);
    throw error;
  }
}

// 有効なアクセストークンを取得（必要に応じて自動更新）
export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await loadTokens();
  if (!tokens) {
    return null; // 認証が必要
  }

  if (isTokenValid(tokens)) {
    return tokens.access_token;
  }

  // トークンの有効期限が切れている場合は自動更新
  try {
    const newTokens = await refreshAccessToken(tokens.refresh_token);
    return newTokens.access_token;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return null; // 再認証が必要
  }
}

// Authorization Code + PKCE フローでの認証
export async function authenticateWithPKCE(): Promise<TokenData> {
  if (!OAUTH_CONFIG.clientId) {
    throw new Error('FREEE_CLIENT_ID environment variable is not set');
  }

  const { codeVerifier, codeChallenge } = generatePKCE();
  const state = crypto.randomBytes(16).toString('hex');

  // まずローカルサーバーでの認証を試行
  try {
    return await authenticateWithLocalServer(codeVerifier, codeChallenge, state);
  } catch (error) {
    console.error('Local server authentication failed, falling back to OOB:', error);
    return await authenticateWithOOB(codeVerifier, codeChallenge, state);
  }
}

// ローカルサーバーを使用した認証
async function authenticateWithLocalServer(
  codeVerifier: string,
  codeChallenge: string,
  state: string
): Promise<TokenData> {
  return new Promise<TokenData>((resolve, reject) => {
    let server: http.Server | null = null;
    const port = 8080;

    const cleanup = (): void => {
      if (server) {
        server.close();
        server = null;
      }
    };

    server = http.createServer((req, res) => {
      const url = new URL(req.url!, `http://127.0.0.1:${port}`);
      
      if (url.pathname === '/callback') {
        const code = url.searchParams.get('code');
        const returnedState = url.searchParams.get('state');
        const error = url.searchParams.get('error');

        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<h1>認証エラー</h1><p>認証に失敗しました。</p>');
          cleanup();
          reject(new Error(`OAuth error: ${error}`));
          return;
        }

        if (!code || returnedState !== state) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<h1>認証エラー</h1><p>無効な認証コードまたは状態です。</p>');
          cleanup();
          reject(new Error('Invalid authorization code or state'));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>認証完了</h1><p>認証が完了しました。このページを閉じてください。</p>');
        cleanup();

        // 認証コードをアクセストークンに交換
        exchangeCodeForTokens(code, codeVerifier)
          .then(resolve)
          .catch(reject);
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    server.on('error', (error) => {
      cleanup();
      reject(error);
    });

    server.listen(port, '127.0.0.1', () => {
      const authUrl = buildAuthUrl(codeChallenge, state, OAUTH_CONFIG.redirectUri);
      console.error(`Opening browser for authentication: ${authUrl}`);
      open(authUrl).catch(() => {
        console.error('Failed to open browser automatically. Please visit the URL manually:');
        console.error(authUrl);
      });
    });

    // 5分でタイムアウト
    setTimeout(() => {
      cleanup();
      reject(new Error('Authentication timeout'));
    }, 5 * 60 * 1000);
  });
}

// Out-Of-Band認証（フォールバック）
async function authenticateWithOOB(
  codeVerifier: string,
  codeChallenge: string,
  state: string
): Promise<TokenData> {
  const authUrl = buildAuthUrl(codeChallenge, state, OAUTH_CONFIG.oobRedirectUri);
  
  console.error('='.repeat(80));
  console.error('ローカルサーバーでの認証に失敗しました。手動認証に切り替えます。');
  console.error('以下のURLをブラウザで開いて認証を完了してください：');
  console.error('');
  console.error(authUrl);
  console.error('');
  console.error('認証後に表示される認証コードを入力してください：');
  console.error('='.repeat(80));

  // ブラウザを開く試行
  try {
    await open(authUrl);
  } catch (error) {
    console.error('Failed to open browser:', error);
  }

  // ユーザーからの認証コード入力を待機
  return new Promise((resolve, reject) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr
    });

    rl.question('認証コードを入力してください: ', async (code: string) => {
      rl.close();
      
      if (!code.trim()) {
        reject(new Error('認証コードが入力されませんでした'));
        return;
      }

      try {
        const tokens = await exchangeCodeForTokens(code.trim(), codeVerifier);
        resolve(tokens);
      } catch (error) {
        reject(error);
      }
    });
  });
}

// 認証URLを構築
function buildAuthUrl(codeChallenge: string, state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: OAUTH_CONFIG.clientId,
    redirect_uri: redirectUri,
    scope: OAUTH_CONFIG.scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `${OAUTH_CONFIG.authorizationEndpoint}?${params.toString()}`;
}

// 認証コードをアクセストークンに交換
async function exchangeCodeForTokens(code: string, codeVerifier: string): Promise<TokenData> {
  const response = await fetch(OAUTH_CONFIG.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: OAUTH_CONFIG.clientId,
      code,
      redirect_uri: OAUTH_CONFIG.redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Token exchange failed: ${response.status} ${JSON.stringify(errorData)}`);
  }

  const tokenResponse = await response.json();
  const tokens: TokenData = {
    access_token: tokenResponse.access_token,
    refresh_token: tokenResponse.refresh_token,
    expires_at: Date.now() + (tokenResponse.expires_in * 1000),
    token_type: tokenResponse.token_type || 'Bearer',
    scope: tokenResponse.scope || OAUTH_CONFIG.scope,
  };

  await saveTokens(tokens);
  return tokens;
}