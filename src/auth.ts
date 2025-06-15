import crypto from 'crypto';
import http from 'http';
import { URL } from 'url';
import open from 'open';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import net from 'net';

// OAuth設定
const OAUTH_CONFIG = {
  clientId: process.env.FREEE_CLIENT_ID || '', // 環境変数から取得
  redirectUri: 'http://127.0.0.1:8080/callback',
  authorizationEndpoint: 'https://accounts.secure.freee.co.jp/public_api/authorize',
  tokenEndpoint: 'https://accounts.secure.freee.co.jp/public_api/token',
  scope: 'read write',
  oobRedirectUri: 'urn:ietf:wg:oauth:2.0:oob',
};

// グローバルサーバーインスタンスと認証状態
let globalCallbackServer: http.Server | null = null;
let pendingAuthentications = new Map<string, {
  codeVerifier: string;
  resolve: (tokens: TokenData) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}>();

// トークンの型定義
export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp
  token_type: string;
  scope: string;
}

// PKCE用のcode_verifierとcode_challengeを生成
export function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

// ポートが使用可能かチェック
async function checkPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, '127.0.0.1', () => {
      server.close(() => {
        resolve(true); // ポートが使用可能
      });
    });
    
    server.on('error', () => {
      resolve(false); // ポートが使用中
    });
  });
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

  // グローバルサーバーが起動していれば、それを使用
  if (globalCallbackServer) {
    return await authenticateWithGlobalServer(codeVerifier, codeChallenge, state);
  } else {
    // フォールバック: 一時的なローカルサーバーを起動
    try {
      return await authenticateWithLocalServer(codeVerifier, codeChallenge, state);
    } catch (error) {
      console.error('Local server authentication failed, falling back to OOB:', error);
      return await authenticateWithOOB(codeVerifier, codeChallenge, state);
    }
  }
}

// グローバルサーバーを使用した認証
async function authenticateWithGlobalServer(
  codeVerifier: string,
  codeChallenge: string,
  state: string
): Promise<TokenData> {
  return new Promise((resolve, reject) => {
    // 5分のタイムアウト設定
    const timeout = setTimeout(() => {
      pendingAuthentications.delete(state);
      reject(new Error('Authentication timeout after 5 minutes'));
    }, 5 * 60 * 1000);

    // 認証リクエストを登録
    pendingAuthentications.set(state, {
      codeVerifier,
      resolve,
      reject,
      timeout
    });

    // 認証URLを生成してブラウザで開く
    const authUrl = buildAuthUrl(codeChallenge, state, OAUTH_CONFIG.redirectUri);
    console.error(`🌐 Opening browser for authentication: ${authUrl}`);
    
    open(authUrl).catch(() => {
      console.error('❌ Failed to open browser automatically. Please visit the URL manually:');
      console.error(authUrl);
    });
  });
}

// ローカルサーバーを使用した認証
async function authenticateWithLocalServer(
  codeVerifier: string,
  codeChallenge: string,
  state: string
): Promise<TokenData> {
  const port = 8080;
  
  // ポートの使用可能性をチェック
  const isPortAvailable = await checkPortAvailable(port);
  if (!isPortAvailable) {
    console.error(`❌ Port ${port} is already in use`);
    throw new Error(`Port ${port} is already in use. Please close other applications using this port or wait for them to finish.`);
  }

  return new Promise<TokenData>((resolve, reject) => {
    let server: http.Server | null = null;

    const cleanup = (): void => {
      if (server) {
        server.close();
        server = null;
      }
    };

    server = http.createServer((req, res) => {
      console.error(`📥 Incoming request: ${req.method} ${req.url}`);
      const url = new URL(req.url!, `http://127.0.0.1:${port}`);

      if (url.pathname === '/callback') {
        const code = url.searchParams.get('code');
        const returnedState = url.searchParams.get('state');
        const error = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description');

        console.error(`🔍 Callback parameters:`, {
          code: code ? `${code.substring(0, 10)}...` : null,
          state: returnedState ? `${returnedState.substring(0, 10)}...` : null,
          expectedState: state ? `${state.substring(0, 10)}...` : null,
          error,
          errorDescription
        });

        if (error) {
          const errorMsg = errorDescription || error;
          console.error(`❌ OAuth error: ${error} - ${errorDescription}`);
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<h1>認証エラー</h1><p>認証に失敗しました: ${errorMsg}</p>`);
          cleanup();
          reject(new Error(`OAuth error: ${error} - ${errorDescription}`));
          return;
        }

        if (!code) {
          console.error(`❌ Missing authorization code`);
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<h1>認証エラー</h1><p>認証コードが見つかりません。</p>');
          cleanup();
          reject(new Error('Missing authorization code'));
          return;
        }

        if (returnedState !== state) {
          console.error(`❌ State mismatch: expected ${state}, got ${returnedState}`);
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<h1>認証エラー</h1><p>不正な認証状態です。セキュリティのため認証を中止しました。</p>');
          cleanup();
          reject(new Error('Invalid state parameter - possible CSRF attack'));
          return;
        }

        console.error(`✅ Valid callback received, exchanging code for tokens...`);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>認証完了</h1><p>認証が完了しました。このページを閉じてください。</p>');
        cleanup();

        // 認証コードをアクセストークンに交換
        exchangeCodeForTokens(code, codeVerifier)
          .then((tokens) => {
            console.error(`🎉 Token exchange successful!`);
            resolve(tokens);
          })
          .catch((exchangeError) => {
            console.error(`❌ Token exchange failed:`, exchangeError);
            reject(exchangeError);
          });
      } else {
        console.error(`❌ Unknown path: ${url.pathname}`);
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404 Not Found</h1><p>このパスは存在しません。</p>');
      }
    });

    server.on('error', (error) => {
      cleanup();
      console.error(`Local server error on port ${port}:`, error);
      if ((error as NodeJS.ErrnoException).code === 'EADDRINUSE') {
        reject(new Error(`Port ${port} is already in use. Please close other applications using this port.`));
      } else {
        reject(error);
      }
    });

    server.listen(port, '127.0.0.1', () => {
      console.error(`✅ Local authentication server started on http://127.0.0.1:${port}`);
      console.error(`🔗 Callback URL: http://127.0.0.1:${port}/callback`);
      
      const authUrl = buildAuthUrl(codeChallenge, state, OAUTH_CONFIG.redirectUri);
      console.error(`🌐 Opening browser for authentication: ${authUrl}`);
      
      open(authUrl).catch(() => {
        console.error('❌ Failed to open browser automatically. Please visit the URL manually:');
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

  // MCP環境では対話的な入力ができないため、URLを提供してエラーとして返す
  const errorMessage =
    `手動認証が必要です。以下のURLをブラウザで開いて認証を完了してください：\n\n` +
    `${authUrl}\n\n` +
    `認証後、freee_authenticate ツールを再度実行してください。\n` +
    `または、ローカルサーバーのポート8080が使用可能か確認してください。`;

  console.error('='.repeat(80));
  console.error('ローカルサーバーでの認証に失敗しました。');
  console.error(errorMessage);
  console.error('='.repeat(80));

  // ブラウザを開く試行
  try {
    await open(authUrl);
  } catch (error) {
    console.error('Failed to open browser:', error);
  }

  throw new Error(errorMessage);
}

// 認証URLを構築
export function buildAuthUrl(codeChallenge: string, state: string, redirectUri: string): string {
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

// コールバックサーバーを起動
export async function startCallbackServer(): Promise<void> {
  if (globalCallbackServer) {
    return; // 既に起動済み
  }

  const port = 8080;
  
  // ポートの使用可能性をチェック
  const isPortAvailable = await checkPortAvailable(port);
  if (!isPortAvailable) {
    throw new Error(`Port ${port} is already in use. Please close other applications using this port.`);
  }

  return new Promise((resolve, reject) => {
    globalCallbackServer = http.createServer((req, res) => {
      console.error(`📥 Callback request: ${req.method} ${req.url}`);
      const url = new URL(req.url!, `http://127.0.0.1:${port}`);

      if (url.pathname === '/callback') {
        handleCallback(url, res);
      } else if (url.pathname === '/') {
        // ルートパスでのヘルスチェック
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>freee MCP OAuth Server</h1><p>コールバックサーバーが稼働中です。</p>');
      } else {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404 Not Found</h1><p>このパスは存在しません。</p>');
      }
    });

    globalCallbackServer.on('error', (error) => {
      console.error(`Callback server error:`, error);
      reject(error);
    });

    globalCallbackServer.listen(port, '127.0.0.1', () => {
      console.error(`🔗 OAuth callback server listening on http://127.0.0.1:${port}`);
      resolve();
    });
  });
}

// 認証リクエストを永続サーバーに登録（Promiseを返さない）
export function registerAuthenticationRequest(state: string, codeVerifier: string): void {
  // 5分のタイムアウト設定
  const timeout = setTimeout(() => {
    pendingAuthentications.delete(state);
    console.error(`⏰ Authentication timeout for state: ${state.substring(0, 10)}...`);
  }, 5 * 60 * 1000);

  // 認証リクエストを登録（ダミーのresolve/rejectを使用）
  pendingAuthentications.set(state, {
    codeVerifier,
    resolve: (tokens: TokenData) => {
      console.error('🎉 Authentication completed successfully!');
    },
    reject: (error: Error) => {
      console.error('❌ Authentication failed:', error);
    },
    timeout
  });
}

// コールバックサーバーを停止
export function stopCallbackServer(): void {
  if (globalCallbackServer) {
    // 保留中の認証をすべて拒否
    for (const [state, auth] of pendingAuthentications) {
      clearTimeout(auth.timeout);
      auth.reject(new Error('Server shutdown'));
    }
    pendingAuthentications.clear();

    globalCallbackServer.close(() => {
      console.error('🔴 OAuth callback server stopped');
    });
    globalCallbackServer = null;
  }
}

// コールバック処理
function handleCallback(url: URL, res: http.ServerResponse): void {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  console.error(`🔍 Callback parameters:`, {
    code: code ? `${code.substring(0, 10)}...` : null,
    state: state ? `${state.substring(0, 10)}...` : null,
    error,
    errorDescription
  });

  if (error) {
    const errorMsg = errorDescription || error;
    console.error(`❌ OAuth error: ${error} - ${errorDescription}`);
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<h1>認証エラー</h1><p>認証に失敗しました: ${errorMsg}</p>`);
    
    // 該当する認証リクエストを拒否
    if (state && pendingAuthentications.has(state)) {
      const auth = pendingAuthentications.get(state)!;
      clearTimeout(auth.timeout);
      auth.reject(new Error(`OAuth error: ${error} - ${errorDescription}`));
      pendingAuthentications.delete(state);
    }
    return;
  }

  if (!code || !state) {
    console.error(`❌ Missing code or state`);
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>認証エラー</h1><p>認証コードまたは状態パラメータが不足しています。</p>');
    return;
  }

  // 保留中の認証を確認
  const pendingAuth = pendingAuthentications.get(state);
  if (!pendingAuth) {
    console.error(`❌ Unknown state: ${state}`);
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>認証エラー</h1><p>不明な認証状態です。認証を再開してください。</p>');
    return;
  }

  console.error(`✅ Valid callback received, exchanging code for tokens...`);
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<h1>認証完了</h1><p>認証が完了しました。このページを閉じてください。</p>');

  // タイムアウトをクリア
  clearTimeout(pendingAuth.timeout);
  pendingAuthentications.delete(state);

  // トークン交換を実行
  exchangeCodeForTokens(code, pendingAuth.codeVerifier)
    .then((tokens) => {
      console.error(`🎉 Token exchange successful!`);
      pendingAuth.resolve(tokens);
    })
    .catch((exchangeError) => {
      console.error(`❌ Token exchange failed:`, exchangeError);
      pendingAuth.reject(exchangeError);
    });
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
