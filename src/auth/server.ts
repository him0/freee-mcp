import http from 'http';
import { URL } from 'url';
import net from 'net';
import { config } from '../config.js';
import { TokenData } from './tokens.js';
import { exchangeCodeForTokens } from './oauth.js';

let globalCallbackServer: http.Server | null = null;
let actualCallbackPort: number | null = null;
let pendingAuthentications = new Map<string, {
  codeVerifier: string;
  resolve: (tokens: TokenData) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}>();

async function checkPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, '127.0.0.1', () => {
      server.close(() => {
        resolve(true);
      });
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}

async function findAvailablePort(startPort: number, maxTries: number = 50): Promise<number> {
  for (let port = startPort; port < startPort + maxTries; port++) {
    if (await checkPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found after checking ${maxTries} ports starting from ${startPort}`);
}

export function getActualRedirectUri(): string {
  if (actualCallbackPort === null) {
    throw new Error('Callback server not started. Call startCallbackServer() first.');
  }
  return `http://127.0.0.1:${actualCallbackPort}/callback`;
}

export function getActualCallbackPort(): number | null {
  return actualCallbackPort;
}

export async function startCallbackServer(): Promise<void> {
  if (globalCallbackServer) {
    return;
  }

  const preferredPort = config.oauth.callbackPort;
  const port = await findAvailablePort(preferredPort);
  actualCallbackPort = port;
  
  if (port !== preferredPort) {
    console.error(`⚠️ Port ${preferredPort} is in use. Using fallback port ${port} for OAuth callback server.`);
  }

  return new Promise((resolve, reject) => {
    globalCallbackServer = http.createServer((req, res) => {
      console.error(`📥 Callback request: ${req.method} ${req.url}`);
      const url = new URL(req.url!, `http://127.0.0.1:${port}`);

      if (url.pathname === '/callback') {
        handleCallback(url, res);
      } else if (url.pathname === '/') {
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

export function registerAuthenticationRequest(state: string, codeVerifier: string): void {
  console.error(`🔐 Registering authentication request with state: ${state.substring(0, 10)}...`);
  console.error(`🔐 Code verifier: ${codeVerifier.substring(0, 10)}...`);
  
  const timeout = setTimeout(() => {
    pendingAuthentications.delete(state);
    console.error(`⏰ Authentication timeout for state: ${state.substring(0, 10)}...`);
  }, config.auth.timeoutMs);

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
  
  console.error(`📝 Registration complete. Total pending: ${pendingAuthentications.size}`);
}

export function stopCallbackServer(): void {
  if (globalCallbackServer) {
    for (const [state, auth] of pendingAuthentications) {
      clearTimeout(auth.timeout);
      auth.reject(new Error('Server shutdown'));
    }
    pendingAuthentications.clear();

    globalCallbackServer.close(() => {
      console.error('🔴 OAuth callback server stopped');
    });
    globalCallbackServer = null;
    actualCallbackPort = null;
  }
}

function handleCallback(url: URL, res: http.ServerResponse): void {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  console.error(`🔍 Callback received - URL: ${url.toString()}`);
  console.error(`🔍 Callback parameters:`, {
    code: code ? `${code.substring(0, 10)}...` : null,
    state: state ? `${state.substring(0, 10)}...` : null,
    error,
    errorDescription
  });
  console.error(`🔍 Pending authentications count: ${pendingAuthentications.size}`);

  if (error) {
    const errorMsg = errorDescription || error;
    console.error(`❌ OAuth error: ${error} - ${errorDescription}`);
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<h1>認証エラー</h1><p>認証に失敗しました: ${errorMsg}</p>`);
    
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

  clearTimeout(pendingAuth.timeout);
  pendingAuthentications.delete(state);

  exchangeCodeForTokens(code, pendingAuth.codeVerifier, getActualRedirectUri())
    .then((tokens) => {
      console.error(`🎉 Token exchange successful!`);
      pendingAuth.resolve(tokens);
    })
    .catch((exchangeError) => {
      console.error(`❌ Token exchange failed:`, exchangeError);
      pendingAuth.reject(exchangeError);
    });
}