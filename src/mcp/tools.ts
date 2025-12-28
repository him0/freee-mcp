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
  getCompanyInfo
} from '../config/companies.js';

export function addAuthenticationTools(server: McpServer): void {
  server.tool(
    'freee_current_user',
    '現在のユーザー情報を取得。詳細ガイドはfreee-mcp skillを参照。',
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
                text: '会社IDが設定されていません。freee_set_company で設定してください。',
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
                    `会社ID: ${companyId}\n` +
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
              text: `ユーザー情報の取得に失敗: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    'freee_authenticate',
    'OAuth認証を開始。初回のみ必要。',
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
              text: `認証URL: ${authUrl}\n\nブラウザで開いて認証してください。5分でタイムアウトします。`
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `認証開始に失敗: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    'freee_auth_status',
    '認証状態を確認。',
    {},
    async () => {
      try {
        const tokens = await loadTokens();
        if (!tokens) {
          return {
            content: [
              {
                type: 'text',
                text: '未認証。freee_authenticate で認証してください。',
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
              text: `認証状態: ${isValid ? '有効' : '期限切れ'}\n有効期限: ${expiryDate}` +
                    (isValid ? '' : '\n次回API使用時に自動更新されます。'),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `認証状態の確認に失敗: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    'freee_clear_auth',
    '認証情報をクリア。',
    {},
    async () => {
      try {
        await clearTokens();
        return {
          content: [
            {
              type: 'text',
              text: '認証情報をクリアしました。再認証するには freee_authenticate を使用。',
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `認証情報のクリアに失敗: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );

  // Company management tools
  server.tool(
    'freee_set_company',
    '事業所を設定・切り替え。',
    {
      company_id: z.string().describe('事業所ID'),
      name: z.string().optional().describe('事業所名'),
      description: z.string().optional().describe('説明'),
    },
    async (args: { company_id: string; name?: string; description?: string }) => {
      try {
        const { company_id, name, description } = args;

        await setCurrentCompany(company_id, name, description);

        const companyInfo = await getCompanyInfo(company_id);

        return {
          content: [
            {
              type: 'text',
              text: `事業所を設定: ${companyInfo?.name || company_id}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `事業所の設定に失敗: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    'freee_get_current_company',
    '現在の事業所情報を表示。',
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
                text: `事業所ID: ${companyId} (詳細情報なし)`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `事業所: ${companyInfo.name} (ID: ${companyInfo.id})`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `事業所情報の取得に失敗: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    'freee_list_companies',
    '事業所一覧を表示。',
    {},
    async () => {
      try {
        interface CompanyResponse {
          companies?: Array<{
            id: number;
            name: string;
          }>;
        }
        const apiCompanies = await makeApiRequest('GET', '/api/1/companies') as CompanyResponse;
        const currentCompanyId = await getCurrentCompanyId();

        if (!apiCompanies?.companies?.length) {
          return {
            content: [
              {
                type: 'text',
                text: '事業所情報を取得できませんでした。',
              },
            ],
          };
        }

        const companyList = apiCompanies.companies
          .map((company) => {
            const current = company.id === parseInt(currentCompanyId) ? ' *' : '';
            return `${company.name} (${company.id})${current}`;
          })
          .join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `事業所一覧:\n${companyList}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `事業所一覧の取得に失敗: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );

}
