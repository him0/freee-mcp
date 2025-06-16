import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import crypto from 'crypto';
import open from 'open';
import { config } from '../config.js';
import { makeApiRequest } from '../api/client.js';
import { loadTokens, clearTokens } from '../auth/tokens.js';
import { generatePKCE, buildAuthUrl } from '../auth/oauth.js';
import { registerAuthenticationRequest } from '../auth/server.js';

export function addAuthenticationTools(server: McpServer): void {
  server.tool(
    'freee_current_user',
    'freee APIの現在のユーザー情報を取得します。認証状態、会社ID、ユーザー詳細が含まれます。',
    {},
    async () => {
      try {
        const companyId = config.freee.companyId;
        if (!companyId) {
          return {
            content: [
              {
                type: 'text',
                text: 'FREEE_COMPANY_ID環境変数が設定されていません。',
              },
            ],
          };
        }

        const userInfo = await makeApiRequest('GET', '/api/1/users/me');

        return {
          content: [
            {
              type: 'text',
              text: `現在のユーザー情報:\n` +
                    `設定されている会社ID: ${companyId}\n` +
                    `ユーザー詳細:\n${JSON.stringify(userInfo, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `ユーザー情報の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}\n\n` +
                    `以下を確認してください:\n` +
                    `1. 認証が完了しているか（freee_authenticate ツールを使用）\n` +
                    `2. FREEE_COMPANY_ID環境変数が正しく設定されているか\n` +
                    `3. ネットワーク接続が正常か`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    'freee_authenticate',
    'freee APIのOAuth認証を開始します。永続的なコールバックサーバーを利用して認証を行います。',
    {},
    async () => {
      try {
        if (!config.freee.clientId) {
          return {
            content: [
              {
                type: 'text',
                text: 'FREEE_CLIENT_ID環境変数が設定されていません。\n' +
                      'OAuth認証を行うには、freee developersでアプリケーションを作成し、\n' +
                      'クライアントIDを環境変数に設定してください。',
              },
            ],
          };
        }

        if (!config.freee.clientSecret) {
          return {
            content: [
              {
                type: 'text',
                text: 'FREEE_CLIENT_SECRET環境変数が設定されていません。\n' +
                      'OAuth認証を行うには、freee developersでアプリケーションを作成し、\n' +
                      'クライアントシークレットを環境変数に設定してください。',
              },
            ],
          };
        }

        const { codeVerifier, codeChallenge } = generatePKCE();
        const state = crypto.randomBytes(16).toString('hex');
        const authUrl = buildAuthUrl(codeChallenge, state, config.oauth.redirectUri);

        registerAuthenticationRequest(state, codeVerifier);

        console.error(`🌐 Opening browser for authentication: ${authUrl}`);
        open(authUrl).catch(() => {
          console.error('❌ Failed to open browser automatically. Please visit the URL manually:');
          console.error(authUrl);
        });

        return {
          content: [
            {
              type: 'text',
              text: `🚀 OAuth認証を開始しました！\n\n` +
                    `📱 ブラウザが自動で開きます。開かない場合は以下のURLを手動で開いてください:\n` +
                    `${authUrl}\n\n` +
                    `🔄 認証手順:\n` +
                    `1. ブラウザでfreeeにログインして会社を選択\n` +
                    `2. アプリケーションへのアクセスを許可\n` +
                    `3. 認証完了後、freee_auth_status で状態を確認\n` +
                    `⏰ この認証リクエストは5分後にタイムアウトします`
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `認証開始に失敗しました: ${error instanceof Error ? error.message : String(error)}\n\n` +
                    `以下を確認してください:\n` +
                    `1. FREEE_CLIENT_ID環境変数が設定されているか\n` +
                    `2. freee側でアプリケーション設定が正しいか\n` +
                    `3. コールバックサーバー（${config.oauth.callbackPort}ポート）が起動しているか`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    'freee_auth_status',
    'freee APIの認証状態を確認します。保存されているトークンの情報を表示します。',
    {},
    async () => {
      try {
        const tokens = await loadTokens();
        if (!tokens) {
          return {
            content: [
              {
                type: 'text',
                text: '認証されていません。freee_authenticate ツールを使用して認証を行ってください。',
              },
            ],
          };
        }

        const isValid = Date.now() < tokens.expires_at;
        const expiryDate = new Date(tokens.expires_at).toLocaleString();

        return {
          content: [
            {
              type: 'text',
              text: `認証状態: ${isValid ? '有効' : '期限切れ'}\n` +
                    `アクセストークン: ${tokens.access_token.substring(0, 20)}...\n` +
                    `有効期限: ${expiryDate}\n` +
                    `スコープ: ${tokens.scope}\n` +
                    `トークンタイプ: ${tokens.token_type}` +
                    (isValid ? '' : '\n\n次回API使用時に自動更新されます。'),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `認証状態の確認に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    'freee_clear_auth',
    'freee APIの認証情報をクリアします。保存されているトークンファイルを削除し、次回API使用時に再認証が必要になります。',
    {},
    async () => {
      try {
        await clearTokens();
        return {
          content: [
            {
              type: 'text',
              text: '認証情報がクリアされました。\n' +
                    '次回freee API使用時に再認証が必要です。\n' +
                    '再認証するには freee_authenticate ツールを使用してください。',
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `認証情報のクリアに失敗しました: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
}