import crypto from 'node:crypto';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getDefaultAuthManager, startCallbackServerWithAutoStop } from '../auth/server.js';
import { AUTH_TIMEOUT_MS, PACKAGE_VERSION } from '../constants.js';
import { createTextResponse, formatErrorMessage } from '../utils/error.js';
import type { SignTokenContext } from './client.js';
import { makeSignApiRequest } from './client.js';
import { getSignCredentials } from './config.js';
import { buildSignAuthUrl, exchangeSignCodeForTokens } from './oauth.js';
import type { SignTokenStore } from './server/sign-redis-token-store.js';
import { clearSignTokens, isSignTokenValid, loadSignTokens } from './tokens.js';

type SignAuthExtra = { authInfo?: { extra?: Record<string, unknown> } };

function extractSignTokenContext(extra?: SignAuthExtra): SignTokenContext | undefined {
  const authExtra = extra?.authInfo?.extra;
  if (authExtra?.tokenStore && typeof authExtra.userId === 'string') {
    return {
      tokenStore: authExtra.tokenStore as SignTokenStore,
      userId: authExtra.userId,
    };
  }
  return undefined;
}

// Remote 時に tokenContext が取れない場合、local filesystem トークンへ fallback させると
// 他ユーザーの資格情報を共有する impersonation になるため、明示的に失敗させる
function resolveTokenContext(
  extra: SignAuthExtra | undefined,
  isRemote: boolean,
): SignTokenContext | undefined {
  const ctx = extractSignTokenContext(extra);
  if (isRemote && !ctx) {
    throw new Error(
      'Remote モードで認証コンテキストが取得できませんでした。MCP クライアントを再接続してください。',
    );
  }
  return ctx;
}

function addSignAuthTools(server: McpServer, options?: { remote?: boolean }): void {
  // sign_authenticate は CLI mode のみ（remote は MCP OAuth で認証する）
  if (!options?.remote) {
    server.registerTool(
      'sign_authenticate',
      {
        title: 'Sign OAuth認証',
        description: 'freee サイン OAuth認証を開始（初回のみ必要）',
        annotations: { destructiveHint: false },
      },
      async () => {
        try {
          const { clientId, callbackPort } = await getSignCredentials();

          await startCallbackServerWithAutoStop(AUTH_TIMEOUT_MS, callbackPort);

          const state = crypto.randomBytes(16).toString('hex');
          const redirectUri = `http://127.0.0.1:${callbackPort}/callback`;
          const authUrl = buildSignAuthUrl(state, redirectUri, clientId);

          // コールバック受信時にトークン交換を実行するハンドラを登録
          const authManager = getDefaultAuthManager();
          authManager.registerCliAuthHandler(state, {
            resolve: (code: string): void => {
              exchangeSignCodeForTokens(code, redirectUri)
                .then(() => {
                  console.error('Sign authentication completed successfully');
                })
                .catch((err) => {
                  console.error('Sign token exchange failed:', err);
                })
                .finally(() => {
                  authManager.removeCliAuthHandler(state);
                });
            },
            reject: (error: Error): void => {
              console.error('Sign authentication failed:', error);
              authManager.removeCliAuthHandler(state);
            },
            codeVerifier: '',
          });

          return createTextResponse(
            `認証URL: ${authUrl}\n\nブラウザで開いて認証してください。5分でタイムアウトします。`,
          );
        } catch (error) {
          return createTextResponse(`認証開始に失敗: ${formatErrorMessage(error)}`);
        }
      },
    );
  }

  server.registerTool(
    'sign_auth_status',
    {
      title: 'Sign 認証状態',
      description: 'freee サインの認証状態を確認',
      annotations: { readOnlyHint: true },
    },
    async (extra?: SignAuthExtra) => {
      try {
        const tokenContext = resolveTokenContext(extra, options?.remote ?? false);
        if (tokenContext) {
          const tokens = await tokenContext.tokenStore.loadTokens(tokenContext.userId);
          if (!tokens) {
            return createTextResponse('未認証です。MCP OAuth で認証を行ってください。');
          }
          if (isSignTokenValid(tokens)) {
            const expiresAt = new Date(tokens.expires_at).toLocaleString('ja-JP');
            return createTextResponse(`認証済み（有効）\n有効期限: ${expiresAt}`);
          }
          return createTextResponse(
            'トークンの有効期限が切れていますが、次回API使用時に自動更新されます。',
          );
        }
        const tokens = await loadSignTokens();
        if (!tokens) {
          return createTextResponse(
            '未認証です。sign_authenticate ツールを使用して認証を行ってください。',
          );
        }

        if (isSignTokenValid(tokens)) {
          const expiresAt = new Date(tokens.expires_at).toLocaleString('ja-JP');
          return createTextResponse(`認証済み（有効）\n有効期限: ${expiresAt}`);
        }

        return createTextResponse(
          'トークンの有効期限が切れていますが、次回API使用時に自動更新されます。\n' +
            '自動更新に失敗する場合は sign_authenticate ツールで再認証してください。',
        );
      } catch (error) {
        return createTextResponse(`認証状態の確認に失敗: ${formatErrorMessage(error)}`);
      }
    },
  );

  server.registerTool(
    'sign_clear_auth',
    {
      title: 'Sign 認証クリア',
      description: 'freee サインの認証情報をクリア',
      annotations: { destructiveHint: true },
    },
    async (extra?: SignAuthExtra) => {
      try {
        const tokenContext = resolveTokenContext(extra, options?.remote ?? false);
        if (tokenContext) {
          await tokenContext.tokenStore.clearTokens(tokenContext.userId);
          return createTextResponse('freee サインの認証情報をクリアしました。');
        }
        await clearSignTokens();
        return createTextResponse('freee サインの認証情報をクリアしました。');
      } catch (error) {
        return createTextResponse(`認証情報のクリアに失敗: ${formatErrorMessage(error)}`);
      }
    },
  );
}

export function addSignApiTools(server: McpServer, options?: { remote?: boolean }): void {
  const methods = [
    { name: 'sign_api_get', method: 'GET', desc: 'freee サイン API GET' },
    { name: 'sign_api_post', method: 'POST', desc: 'freee サイン API POST' },
    { name: 'sign_api_put', method: 'PUT', desc: 'freee サイン API PUT' },
    { name: 'sign_api_patch', method: 'PATCH', desc: 'freee サイン API PATCH' },
    { name: 'sign_api_delete', method: 'DELETE', desc: 'freee サイン API DELETE' },
  ] as const;

  for (const { name, method, desc } of methods) {
    // サイン API の DELETE は user_id 等を body で要求するエンドポイントがある
    const hasBody =
      method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
    const baseSchema = {
      // 絶対 URL や protocol-relative URL を受け付けると new URL(path, base) が
      // base を無視して外部ホストに Bearer トークンを送出してしまうため /v1/ 始まりに制限。
      // `..` / `%2e%2e` は new URL の normalize で /v1/ 外に逸脱するため Zod で事前拒否
      path: z
        .string()
        .regex(/^\/v1\//, 'path は /v1/ から始まる相対パスを指定してください')
        .refine((p) => !/(\.\.|%2e%2e)/i.test(p), {
          message: 'path に path traversal (.. / %2e%2e) を含めることはできません',
        })
        .describe('APIパス (例: /v1/documents)'),
      query: z.record(z.string(), z.unknown()).optional().describe('クエリパラメータ'),
    };
    const inputSchema = hasBody
      ? {
          ...baseSchema,
          body: z.record(z.string(), z.unknown()).optional().describe('リクエストボディ'),
        }
      : baseSchema;

    server.registerTool(
      name,
      {
        title: desc,
        description: desc,
        inputSchema,
        annotations: { readOnlyHint: method === 'GET' },
      },
      async (
        args: { path: string; query?: Record<string, unknown>; body?: Record<string, unknown> },
        extra?: SignAuthExtra,
      ) => {
        try {
          const tokenContext = resolveTokenContext(extra, options?.remote ?? false);
          const apiResponse = await makeSignApiRequest(
            method,
            args.path,
            args.query,
            args.body,
            tokenContext,
          );
          if (apiResponse === null) {
            return createTextResponse('操作が完了しました（レスポンスなし）。');
          }
          return createTextResponse(JSON.stringify(apiResponse, null, 2));
        } catch (error) {
          return createTextResponse(formatErrorMessage(error));
        }
      },
    );
  }
}

export function addSignAuthenticationTools(
  server: McpServer,
  options?: { remote?: boolean },
): void {
  addSignAuthTools(server, options);

  const transport = options?.remote ? 'remote' : 'stdio';
  server.registerTool(
    'sign_server_info',
    {
      title: 'Sign サーバー情報',
      description: 'freee-sign-mcp サーバーの情報を取得',
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => {
      return createTextResponse(
        `freee-sign-mcp server info:\n- version: ${PACKAGE_VERSION}\n- transport: ${transport}`,
      );
    },
  );
}
