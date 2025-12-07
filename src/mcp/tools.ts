import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import crypto from 'crypto';
import { z } from 'zod';
import { config } from '../config.js';
import { makeApiRequest } from '../api/client.js';
import { loadTokens, clearTokens } from '../auth/tokens.js';
import { generatePKCE, buildAuthUrl } from '../auth/oauth.js';
import { registerAuthenticationRequest, getActualRedirectUri } from '../auth/server.js';
import {
  getCurrentCompanyId,
  setCurrentCompany,
  getCompanyList,
  getCompanyInfo
} from '../config/companies.js';

export function addAuthenticationTools(server: McpServer): void {
  server.tool(
    'freee_current_user',
    'freee APIの現在のユーザー情報を取得します。認証状態、事業所ID、ユーザー詳細が含まれます。【認証テスト用・API動作確認に最適】',
    {},
    async () => {
      try {
        const companyId = await getCurrentCompanyId();
        const companyInfo = await getCompanyInfo(companyId);

        if (!companyId) {
          return {
            content: [
              {
                type: 'text',
                text: '会社IDが設定されていません。freee_set_company ツールを使用して会社を設定してください。',
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
                    `現在の会社ID: ${companyId}\n` +
                    `会社名: ${companyInfo?.name || 'Unknown'}\n` +
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
                    `🔧 解決手順:\n` +
                    `1. freee_status - 現在の状態を確認\n` +
                    `2. freee_authenticate - 認証を実行\n` +
                    `3. freee_get_current_company - 事業所設定を確認\n\n` +
                    `🆘 初めての場合: freee_getting_started`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    'freee_authenticate',
    'freee APIのOAuth認証を開始します。永続的なコールバックサーバーを利用して認証を行います。【ユーザーごとに一度の認証が必要】一度認証すると全事業所にアクセス可能です。',
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
        const authUrl = buildAuthUrl(codeChallenge, state, getActualRedirectUri());

        registerAuthenticationRequest(state, codeVerifier);

        console.error(`🌐 Authentication URL: ${authUrl}`);

        return {
          content: [
            {
              type: 'text',
              text: `🚀 OAuth認証を開始しました！\n\n` +
                    `📱 認証URLを生成しました。ブラウザで以下のURLを開いて認証を完了してください:\n` +
                    `${authUrl}\n\n` +
                    `🔄 認証手順:\n` +
                    `1. 認証URLをコピーしてブラウザで開く\n` +
                    `2. freeeにログインして会社を選択\n` +
                    `3. アプリケーションへのアクセスを許可\n` +
                    `4. 認証完了後、freee_auth_status で状態を確認\n` +
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
                    `🔧 解決手順:\n` +
                    `1. freee_status - 環境変数の状態を確認\n` +
                    `2. freee_getting_started - 初期設定ガイドを確認\n` +
                    `3. リダイレクトURI設定: http://127.0.0.1:${config.oauth.callbackPort}/callback\n\n` +
                    `🆘 初めての場合: freee_help`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    'freee_auth_status',
    'freee APIの認証状態を確認します。保存されているトークンの情報を表示します。【認証トラブル時の確認用】',
    {},
    async () => {
      try {
        const tokens = await loadTokens();
        if (!tokens) {
          return {
            content: [
              {
                type: 'text',
                text: '認証されていません。\n\n💡 次のステップ:\n1. freee_authenticate - 認証を実行\n2. freee_status - 状態を確認\n\n🆘 初めての場合: freee_getting_started',
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
              text: `認証状態の確認に失敗しました: ${error instanceof Error ? error.message : String(error)}\n\n🔧 解決手順:\n1. freee_status - 全体的な状態を確認\n2. freee_getting_started - 初期設定ガイド`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    'freee_clear_auth',
    'freee APIの認証情報をクリアします。保存されているトークンファイルを削除し、次回API使用時に再認証が必要になります。【認証エラー時のリセット用】',
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
              text: `認証情報のクリアに失敗しました: ${error instanceof Error ? error.message : String(error)}\n\n🔧 代替手順:\n1. freee_status - 状態を確認\n2. 手動でファイル削除: ~/.config/freee-mcp/tokens.json`,
            },
          ],
        };
      }
    }
  );

  // Company management tools
  // @ts-expect-error - Zod 3.25+ type inference issue with MCP SDK
  server.tool(
    'freee_set_company',
    '事業所を設定・切り替えます。新しい事業所の場合は自動的に追加されます。認証済みの場合はそのまま使用できます。',
    {
      company_id: z.string().describe('事業所ID（必須）'),
      name: z.string().optional().describe('事業所名（オプション、新規追加時に設定）'),
      description: z.string().optional().describe('事業所の説明（オプション）'),
    },
    async (args) => {
      try {
        const { company_id, name, description } = args;

        await setCurrentCompany(company_id, name, description);

        const companyInfo = await getCompanyInfo(company_id);

        return {
          content: [
            {
              type: 'text',
              text: `事業所を切り替えました:\\n` +
                    `事業所ID: ${company_id}\\n` +
                    `事業所名: ${companyInfo?.name || 'Unknown'}\\n` +
                    `説明: ${companyInfo?.description || 'なし'}\\n\\n` +
                    `🚀 この事業所ですぐにAPIを使用できます（認証済みの場合）。\n\n💡 次のステップ:\n・ 認証済みの場合: freee_current_user でテスト\n・ 未認証の場合: freee_authenticate で認証`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `事業所の設定に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    'freee_get_current_company',
    '現在設定されている事業所の情報を表示します。【現在の作業対象事業所の確認用】',
    {},
    async () => {
      try {
        const companyId = await getCurrentCompanyId();
        const companyInfo = await getCompanyInfo(companyId);

        if (!companyInfo) {
          return {
            content: [
              {
                type: 'text',
                text: `現在の事業所ID: ${companyId}\\n事業所情報が見つかりません。`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `現在の事業所情報:\\n` +
                    `事業所ID: ${companyInfo.id}\\n` +
                    `事業所名: ${companyInfo.name}\\n` +
                    `説明: ${companyInfo.description || 'なし'}\\n` +
                    `追加日時: ${new Date(companyInfo.addedAt).toLocaleString()}\\n` +
                    `最終使用: ${companyInfo.lastUsed ? new Date(companyInfo.lastUsed).toLocaleString() : 'なし'}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `事業所情報の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    'freee_list_companies',
    '設定済みの事業所一覧を表示します。内部的にget_companiesを呼び出してfreee APIから最新の事業所情報を取得します。【事業所切り替え前の確認用】',
    {},
    async () => {
      try {
        // 内部的にget_companiesを呼び出す
        interface CompanyResponse {
          companies?: Array<{
            id: number;
            name: string;
            description?: string;
          }>;
        }
        const apiCompanies = await makeApiRequest('GET', '/api/1/companies') as CompanyResponse;

        // 設定ファイルから保存済みの事業所一覧も取得
        const localCompanies = await getCompanyList();
        const currentCompanyId = await getCurrentCompanyId();

        if (!apiCompanies || !apiCompanies.companies || apiCompanies.companies.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'freee APIから事業所情報を取得できませんでした。認証状態を確認してください。\n\n💡 次のステップ:\n1. freee_auth_status - 認証状態を確認\n2. freee_authenticate - 認証を実行',
              },
            ],
          };
        }

        const companyList = apiCompanies.companies
          .map((company) => {
            const current = company.id === parseInt(currentCompanyId) ? ' (現在選択中)' : '';
            const localInfo = localCompanies.find(c => c.id === company.id.toString());
            const lastUsed = localInfo?.lastUsed
              ? `最終使用: ${new Date(localInfo.lastUsed).toLocaleString()}`
              : '未使用';

            return `• ${company.name} (ID: ${company.id})${current}\\n` +
                   `  説明: ${company.description || 'なし'}\\n` +
                   `  ${lastUsed}`;
          })
          .join('\\n\\n');

        return {
          content: [
            {
              type: 'text',
              text: `freee API事業所一覧 (${apiCompanies.companies.length}件):\\n\\n${companyList}`,
            },
          ],
        };
      } catch (error) {
        // API呼び出しが失敗した場合は、ローカルの設定情報を表示
        try {
          const localCompanies = await getCompanyList();
          const currentCompanyId = await getCurrentCompanyId();

          if (localCompanies.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: `API呼び出しに失敗しました: ${error instanceof Error ? error.message : String(error)}\n\n設定済みの事業所もありません。freee_set_company ツールを使用して事業所を追加してください。`,
                },
              ],
            };
          }

          const companyList = localCompanies
            .map((company) => {
              const current = company.id === currentCompanyId ? ' (現在選択中)' : '';
              const lastUsed = company.lastUsed
                ? `最終使用: ${new Date(company.lastUsed).toLocaleString()}`
                : '未使用';

              return `• ${company.name} (ID: ${company.id})${current}\\n` +
                     `  説明: ${company.description || 'なし'}\\n` +
                     `  ${lastUsed}`;
            })
            .join('\\n\\n');

          return {
            content: [
              {
                type: 'text',
                text: `API呼び出しに失敗しました: ${error instanceof Error ? error.message : String(error)}\n\nローカル設定済み事業所一覧 (${localCompanies.length}件):\\n\\n${companyList}\n\n💡 API接続を復旧するには:\n1. freee_auth_status - 認証状態を確認\n2. freee_authenticate - 認証を実行`,
              },
            ],
          };
        } catch (localError) {
          return {
            content: [
              {
                type: 'text',
                text: `事業所一覧の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}\n\nローカル設定の読み込みも失敗: ${localError instanceof Error ? localError.message : String(localError)}`,
              },
            ],
          };
        }
      }
    }
  );

  // Help and guidance tools
  server.tool(
    'freee_help',
    'freee MCP サーバーの使い方とワークフローガイドを表示します。初めて使用する場合は最初にこのツールを実行してください。',
    {},
    async () => {
      return {
        content: [
          {
            type: 'text',
            text: `# freee MCP サーバー 使い方ガイド

## 📋 基本的なワークフロー

### 1️⃣ 初回セットアップ
\`freee_getting_started\` - 詳細な初期設定ガイド

### 2️⃣ 事業所管理
- \`freee_set_company [事業所ID] [名前] [説明]\` - 事業所を追加・切り替え
- \`freee_get_current_company\` - 現在の事業所情報を確認
- \`freee_list_companies\` - 設定済み事業所一覧

### 3️⃣ 認証
- \`freee_authenticate\` - OAuth認証（ユーザーごとに一度必要）
- \`freee_auth_status\` - 認証状態を確認
- \`freee_clear_auth\` - 認証情報をクリア

### 4️⃣ API使用
- \`freee_current_user\` - ユーザー情報とテスト
- \`get_*\`, \`post_*\`, \`put_*\`, \`delete_*\` - freee API

### 5️⃣ 状態確認
- \`freee_status\` - 現在の状態と次のアクション提案

## 🚀 典型的な使用例

### 新規事業所の追加
\`\`\`
freee_set_company 12345 "本社" "メイン事業所"
freee_authenticate
freee_current_user
\`\`\`

### 事業所の切り替え
\`\`\`
freee_list_companies
freee_set_company 67890
freee_current_user
\`\`\`

## ⚠️ 重要なポイント

1. **ユーザー認証**: 初回に一度認証が必要（全事業所で共通）
2. **環境変数**: FREEE_CLIENT_ID, FREEE_CLIENT_SECRET, FREEE_DEFAULT_COMPANY_ID（デフォルト用）
3. **ファイル保存場所**: ~/.config/freee-mcp/

## 🆘 困ったときは
- \`freee_getting_started\` - 初期設定ガイド
- \`freee_status\` - 現在の状態確認
- \`freee_help\` - このガイド（再表示）

詳しくは各ツールの説明を参照してください。`,
          },
        ],
      };
    }
  );

  server.tool(
    'freee_getting_started',
    '初回セットアップの詳細ガイドを表示します。freee MCP サーバーを初めて使用する際に実行してください。',
    {},
    async () => {
      try {
        const currentCompanyId = await getCurrentCompanyId();
        const companyInfo = await getCompanyInfo(currentCompanyId);
        const tokens = await loadTokens();

        let setupStatus = '';
        let nextSteps = '';

        if (!currentCompanyId || currentCompanyId === '0') {
          setupStatus = '❌ 事業所が設定されていません';
          nextSteps = '1. freee_set_company [事業所ID] で事業所を設定してください';
        } else if (!companyInfo) {
          setupStatus = '⚠️ 事業所情報が不完全です';
          nextSteps = '1. freee_set_company で事業所情報を再設定してください';
        } else if (!tokens) {
          setupStatus = '⚠️ 認証が必要です';
          nextSteps = '1. freee_authenticate で認証を行ってください';
        } else {
          setupStatus = '✅ セットアップ完了';
          nextSteps = '1. freee_current_user でテストしてください\\n2. get_deals などのAPIツールが使用可能です';
        }

        return {
          content: [
            {
              type: 'text',
              text: `# freee MCP サーバー 初回セットアップガイド

## 🔧 現在の状態
${setupStatus}

## 📋 セットアップ手順

### 1. 環境変数の確認
以下の環境変数が設定されている必要があります：
- \`FREEE_CLIENT_ID\`: freee開発者アプリのクライアントID
- \`FREEE_CLIENT_SECRET\`: freee開発者アプリのクライアントシークレット
- \`FREEE_DEFAULT_COMPANY_ID\`: デフォルト事業所ID

### 2. 事業所の設定
\`\`\`
freee_set_company [事業所ID] "[事業所名]" "[説明]"
\`\`\`
例: \`freee_set_company 12345 "株式会社サンプル" "本社"\`

### 3. 認証の実行
\`\`\`
freee_authenticate
\`\`\`
- ブラウザが開いて認証画面が表示されます
- freeeにログインして認証を完了してください

### 4. 動作確認
\`\`\`
freee_current_user
\`\`\`

## 📍 次にすべきこと
${nextSteps}

## 🏢 複数事業所を使用する場合

### 追加の事業所設定
\`\`\`
freee_set_company [別の事業所ID] "[名前]" "[説明]"
freee_authenticate  # ユーザー認証（全事業所共通）
\`\`\`

### 事業所の切り替え
\`\`\`
freee_list_companies        # 一覧表示
freee_set_company [事業所ID]  # 切り替え
\`\`\`

## 🔍 状態確認ツール
- \`freee_status\` - 現在の状態と推奨アクション
- \`freee_auth_status\` - 認証状態の詳細
- \`freee_get_current_company\` - 現在の事業所情報

## ❓ トラブルシューティング

### 認証エラーの場合
1. 環境変数（CLIENT_ID, CLIENT_SECRET）を確認
2. freee開発者画面でリダイレクトURI設定を確認: \`http://127.0.0.1:54321/callback\`
3. \`freee_clear_auth\` で認証情報をクリアして再認証

### 事業所IDが分からない場合
1. freee画面のURLから確認（例: /companies/12345/...）
2. 既存の認証があれば \`freee_current_user\` で確認可能`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `初回セットアップガイドの表示中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}\\n\\nまずは環境変数の設定から始めてください。`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    'freee_status',
    '現在のfreee MCP サーバーの状態を確認し、次に実行すべきアクションを提案します。',
    {},
    async () => {
      try {
        const currentCompanyId = await getCurrentCompanyId();
        const companyInfo = await getCompanyInfo(currentCompanyId);
        const tokens = await loadTokens();
        const companies = await getCompanyList();

        let status = '';
        let recommendations = '';
        let warnings = '';

        // 事業所設定の確認
        if (!currentCompanyId || currentCompanyId === '0') {
          status += '❌ **事業所**: 未設定\\n';
          recommendations += '• freee_set_company [事業所ID] で事業所を設定\\n';
        } else if (!companyInfo) {
          status += '⚠️ **事業所**: 設定不完全\\n';
          recommendations += '• freee_set_company で事業所情報を再設定\\n';
        } else {
          status += `✅ **事業所**: ${companyInfo.name} (ID: ${companyInfo.id})\\n`;
        }

        // 認証状態の確認
        if (!tokens) {
          status += '❌ **認証**: 未認証\\n';
          recommendations += '• freee_authenticate で認証を実行\\n';
        } else {
          const isValid = Date.now() < tokens.expires_at;
          const expiryDate = new Date(tokens.expires_at).toLocaleString();

          if (isValid) {
            status += `✅ **認証**: 有効 (期限: ${expiryDate})\\n`;
            recommendations += '• freee_current_user でテスト実行\\n• get_deals, get_companies などのAPIツールが使用可能\\n';
          } else {
            status += `⚠️ **認証**: 期限切れ (${expiryDate})\\n`;
            recommendations += '• 次回API実行時に自動更新されます\\n• 手動更新: freee_authenticate\\n';
          }
        }

        // 複数事業所の状況
        status += `📊 **登録事業所数**: ${companies.length}件\\n`;

        if (companies.length > 1) {
          recommendations += '• freee_list_companies で事業所一覧を確認\\n• freee_set_company [ID] で事業所切り替え\\n';
        } else if (companies.length === 1) {
          recommendations += '• freee_set_company [新しいID] で追加事業所を登録可能\\n';
        }

        // 環境変数の確認
        if (!config.freee.clientId || !config.freee.clientSecret) {
          warnings += '⚠️ **環境変数**: FREEE_CLIENT_ID または FREEE_CLIENT_SECRET が未設定\\n';
        }

        // 推奨アクションの判定
        if (currentCompanyId && companyInfo && tokens && Date.now() < tokens.expires_at) {
          recommendations += '\\n🚀 **すぐに使用可能**: freee APIツールが利用できます\\n';
          recommendations += '**例**: get_deals, get_companies, get_users, など';
        }

        return {
          content: [
            {
              type: 'text',
              text: `# freee MCP サーバー 状態確認

## 📊 現在の状態
${status}
${warnings ? '\\n## ⚠️ 警告\\n' + warnings : ''}

## 📋 推奨アクション
${recommendations}

## 🆘 ヘルプ
- \`freee_help\` - 全体的な使い方ガイド
- \`freee_getting_started\` - 初回セットアップガイド
- \`freee_list_companies\` - 事業所一覧
- \`freee_auth_status\` - 認証状態の詳細`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `状態確認中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}\\n\\n基本的なセットアップから始めてください:\\n1. freee_getting_started\\n2. freee_set_company [事業所ID]\\n3. freee_authenticate`,
            },
          ],
        };
      }
    }
  );
}
