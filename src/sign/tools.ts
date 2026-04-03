import crypto from 'node:crypto';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  getDefaultAuthManager,
  startCallbackServerWithAutoStop,
} from '../auth/server.js';
import { AUTH_TIMEOUT_MS } from '../constants.js';
import { createTextResponse, formatErrorMessage } from '../utils/error.js';
import { makeSignApiRequest } from './client.js';
import { getSignCredentials } from './config.js';
import { buildSignAuthUrl, exchangeSignCodeForTokens } from './oauth.js';
import {
  clearSignTokens,
  isSignTokenValid,
  loadSignTokens,
} from './tokens.js';

function addSignAuthTools(server: McpServer): void {
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
            exchangeSignCodeForTokens(code, redirectUri).then(() => {
              console.error('Sign authentication completed successfully');
            }).catch((err) => {
              console.error('Sign token exchange failed:', err);
            }).finally(() => {
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

  server.registerTool(
    'sign_auth_status',
    {
      title: 'Sign 認証状態',
      description: 'freee サインの認証状態を確認',
      annotations: { readOnlyHint: true },
    },
    async () => {
      try {
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
          'トークンの有効期限が切れています。sign_authenticate ツールで再認証してください。',
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
    async () => {
      try {
        await clearSignTokens();
        return createTextResponse('freee サインの認証情報をクリアしました。');
      } catch (error) {
        return createTextResponse(`認証情報のクリアに失敗: ${formatErrorMessage(error)}`);
      }
    },
  );
}

export function addSignApiTools(server: McpServer): void {
  const methods = [
    { name: 'sign_api_get', method: 'GET', desc: 'freee サイン API GET' },
    { name: 'sign_api_post', method: 'POST', desc: 'freee サイン API POST' },
    { name: 'sign_api_put', method: 'PUT', desc: 'freee サイン API PUT' },
    { name: 'sign_api_patch', method: 'PATCH', desc: 'freee サイン API PATCH' },
    { name: 'sign_api_delete', method: 'DELETE', desc: 'freee サイン API DELETE' },
  ] as const;

  for (const { name, method, desc } of methods) {
    // サイン API の DELETE は user_id 等を body で要求するエンドポイントがある
    const hasBody = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
    const baseSchema = {
      path: z.string().describe('APIパス (例: /v1/documents)'),
      query: z.record(z.string(), z.unknown()).optional().describe('クエリパラメータ'),
    };
    const inputSchema = hasBody
      ? { ...baseSchema, body: z.record(z.string(), z.unknown()).optional().describe('リクエストボディ') }
      : baseSchema;

    server.registerTool(
      name,
      {
        title: desc,
        description: desc,
        inputSchema,
        annotations: { readOnlyHint: method === 'GET' },
      },
      async (args: { path: string; query?: Record<string, unknown>; body?: Record<string, unknown> }) => {
        try {
          const apiResponse = await makeSignApiRequest(method, args.path, args.query, args.body);
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

export function addSignAuthenticationTools(server: McpServer): void {
  addSignAuthTools(server);
}
