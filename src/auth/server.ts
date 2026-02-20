import http from 'http';
import { URL } from 'url';
import net from 'net';
import { getConfig } from '../config.js';
import { TokenData } from './tokens.js';
import { exchangeCodeForTokens } from './oauth.js';

interface PendingAuthentication {
  codeVerifier: string;
  resolve: (tokens: TokenData) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

interface CliAuthHandler {
  resolve: (code: string) => void;
  reject: (error: Error) => void;
  codeVerifier: string;
}

/**
 * AuthenticationManager - manages pending authentication requests
 * Encapsulates authentication state that was previously global
 */
export class AuthenticationManager {
  private pendingAuthentications = new Map<string, PendingAuthentication>();
  private cliAuthHandlers = new Map<string, CliAuthHandler>();

  registerAuthentication(state: string, codeVerifier: string): void {
    console.error(`Registering authentication request with state: ${state.substring(0, 10)}...`);
    console.error(`Code verifier: ${codeVerifier.substring(0, 10)}...`);

    const timeout = setTimeout(() => {
      this.pendingAuthentications.delete(state);
      console.error(`Authentication timeout for state: ${state.substring(0, 10)}...`);
    }, getConfig().auth.timeoutMs);

    this.pendingAuthentications.set(state, {
      codeVerifier,
      resolve: (_tokens: TokenData) => {
        console.error('Authentication completed successfully!');
      },
      reject: (error: Error) => {
        console.error('Authentication failed:', error);
      },
      timeout
    });

    console.error(`Registration complete. Total pending: ${this.pendingAuthentications.size}`);
  }

  getPendingAuthentication(state: string): PendingAuthentication | undefined {
    return this.pendingAuthentications.get(state);
  }

  removePendingAuthentication(state: string): void {
    const auth = this.pendingAuthentications.get(state);
    if (auth) {
      clearTimeout(auth.timeout);
      this.pendingAuthentications.delete(state);
    }
  }

  clearAllPending(): void {
    for (const [_state, auth] of this.pendingAuthentications) {
      clearTimeout(auth.timeout);
      auth.reject(new Error('Server shutdown'));
    }
    this.pendingAuthentications.clear();
  }

  get pendingCount(): number {
    return this.pendingAuthentications.size;
  }

  // CLI auth handler methods
  registerCliAuthHandler(state: string, handler: CliAuthHandler): void {
    this.cliAuthHandlers.set(state, handler);
  }

  getCliAuthHandler(state: string): CliAuthHandler | undefined {
    return this.cliAuthHandlers.get(state);
  }

  removeCliAuthHandler(state: string): void {
    this.cliAuthHandlers.delete(state);
  }
}

/**
 * CallbackServer - manages the OAuth callback HTTP server
 * Encapsulates server state that was previously global
 */
class CallbackServer {
  private server: http.Server | null = null;
  private port: number | null = null;
  private authManager: AuthenticationManager;
  private autoStopTimeout: NodeJS.Timeout | null = null;

  constructor(authManager: AuthenticationManager) {
    this.authManager = authManager;
  }

  private clearAutoStopTimeout(): void {
    if (this.autoStopTimeout) {
      clearTimeout(this.autoStopTimeout);
      this.autoStopTimeout = null;
    }
  }

  /**
   * Schedule auto-stop after specified timeout
   */
  scheduleAutoStop(timeoutMs: number): void {
    this.clearAutoStopTimeout();
    this.autoStopTimeout = setTimeout(() => {
      console.error('OAuth callback server auto-stopping after timeout');
      this.stop();
    }, timeoutMs);
  }

  getRedirectUri(): string {
    if (this.port === null) {
      throw new Error('Callback server not started. Call start() first.');
    }
    return `http://127.0.0.1:${this.port}/callback`;
  }

  getPort(): number | null {
    return this.port;
  }

  isRunning(): boolean {
    return this.server !== null;
  }

  async start(): Promise<void> {
    if (this.server) {
      console.error('OAuth callback server is already running. If authentication is not working, try restarting the MCP server.');
      return;
    }

    const port = getConfig().oauth.callbackPort;
    const isAvailable = await this.checkPortAvailable(port);

    if (!isAvailable) {
      const redirectUri = `http://127.0.0.1:${port}/callback`;
      throw new Error(
        `ポート ${port} は既に使用されています。\n\n` +
        `freee アプリにコールバックURL (${redirectUri}) を登録している場合、` +
        `ポートを変更すると認証が失敗します。\n\n` +
        `解決方法:\n` +
        `  1. ポート ${port} を使用しているプロセスを終了する\n` +
        `     (例: lsof -i :${port} でプロセスを確認)\n` +
        `  2. または、設定でポートを変更し、freee アプリのコールバックURLも更新する\n` +
        `     (freee-mcp configure を実行して再設定)`
      );
    }

    this.port = port;

    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        console.error(`Callback request: ${req.method} ${req.url}`);
        const url = new URL(req.url!, `http://127.0.0.1:${port}`);

        if (url.pathname === '/callback') {
          this.handleCallback(url, res);
        } else if (url.pathname === '/') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<h1>freee MCP OAuth Server</h1><p>コールバックサーバーが稼働中です。</p>');
        } else {
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<h1>404 Not Found</h1><p>このパスは存在しません。</p>');
        }
      });

      this.server.on('error', (error) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`OAuth callback server failed to start: ${message}`);
        this.server = null;
        this.port = null;
        reject(new Error(`Failed to start OAuth callback server: ${message}`));
      });

      this.server.listen(port, '127.0.0.1', () => {
        console.error(`OAuth callback server listening on http://127.0.0.1:${port} (callback URL: http://127.0.0.1:${port}/callback)`);
        resolve();
      });
    });
  }

  stop(): void {
    this.clearAutoStopTimeout();

    if (this.server) {
      this.authManager.clearAllPending();

      this.server.close(() => {
        console.error('OAuth callback server stopped');
      });
      this.server = null;
      this.port = null;
    }
  }

  private async checkPortAvailable(port: number): Promise<boolean> {
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

  private async handleCallback(url: URL, res: http.ServerResponse): Promise<void> {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    console.error(`Callback received - URL: ${url.toString()}`);
    console.error(`Callback parameters:`, {
      code: code ? `${code.substring(0, 10)}...` : null,
      state: state ? `${state.substring(0, 10)}...` : null,
      error,
      errorDescription
    });
    console.error(`Pending authentications count: ${this.authManager.pendingCount}`);

    const cliHandler = state ? this.authManager.getCliAuthHandler(state) : undefined;

    if (error) {
      const errorMsg = errorDescription || error;
      console.error(`OAuth error: ${error} - ${errorDescription}`);
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h1>認証エラー</h1><p>認証に失敗しました: ${errorMsg}</p>`);

      if (cliHandler) {
        cliHandler.reject(new Error(`OAuth error: ${error} - ${errorDescription}`));
      } else if (state) {
        const pendingAuth = this.authManager.getPendingAuthentication(state);
        if (pendingAuth) {
          clearTimeout(pendingAuth.timeout);
          pendingAuth.reject(new Error(`OAuth error: ${error} - ${errorDescription}`));
          this.authManager.removePendingAuthentication(state);
        }
      }
      return;
    }

    if (!code || !state) {
      console.error(`Missing code or state`);
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>認証エラー</h1><p>認証コードまたは状態パラメータが不足しています。</p>');
      return;
    }

    // Handle CLI authentication
    if (cliHandler) {
      console.error(`Valid CLI callback received`);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>認証完了</h1><p>認証が完了しました。このページを閉じてターミナルに戻ってください。</p>');

      cliHandler.resolve(code);
      return;
    }

    const pendingAuth = this.authManager.getPendingAuthentication(state);
    if (!pendingAuth) {
      console.error(`Unknown state: ${state}`);
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>認証エラー</h1><p>不明な認証状態です。認証を再開してください。</p>');
      return;
    }

    console.error(`Valid callback received, exchanging code for tokens...`);

    // トークン交換を待ってから、結果に応じてブラウザに応答を返す
    try {
      const tokens = await exchangeCodeForTokens(code, pendingAuth.codeVerifier, this.getRedirectUri());
      console.error(`Token exchange successful!`);
      pendingAuth.resolve(tokens);

      // 成功時のみ「認証完了」を表示
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>認証完了</h1><p>認証が完了しました。このページを閉じてください。</p>');
    } catch (exchangeError) {
      console.error(`Token exchange failed:`, exchangeError);
      pendingAuth.reject(exchangeError as Error);

      // エラー時は「認証エラー」を表示
      const errorMessage = exchangeError instanceof Error ? exchangeError.message : String(exchangeError);
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h1>認証エラー</h1><p>トークン交換に失敗しました: ${errorMessage}</p>`);
    } finally {
      this.authManager.removePendingAuthentication(state);
    }
  }
}

// Default instances for backward compatibility
const defaultAuthManager = new AuthenticationManager();
const defaultCallbackServer = new CallbackServer(defaultAuthManager);

// Export backward-compatible functions that delegate to the default instances
export function getActualRedirectUri(): string {
  return defaultCallbackServer.getRedirectUri();
}

export async function startCallbackServer(): Promise<void> {
  return defaultCallbackServer.start();
}

export async function startCallbackServerWithAutoStop(timeoutMs: number): Promise<void> {
  await defaultCallbackServer.start();
  defaultCallbackServer.scheduleAutoStop(timeoutMs);
}

export function registerAuthenticationRequest(state: string, codeVerifier: string): void {
  defaultAuthManager.registerAuthentication(state, codeVerifier);
}

export function stopCallbackServer(): void {
  defaultCallbackServer.stop();
}

// Export authentication manager for CLI usage
export function getDefaultAuthManager(): AuthenticationManager {
  return defaultAuthManager;
}
