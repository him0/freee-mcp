import crypto from 'node:crypto';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { makeApiRequest } from '../api/client.js';
import { buildAuthUrl, generatePKCE } from '../auth/oauth.js';
import {
  getActualRedirectUri,
  registerAuthenticationRequest,
  startCallbackServerWithAutoStop,
} from '../auth/server.js';
import { getConfig } from '../config.js';
import { AUTH_TIMEOUT_MS, PACKAGE_VERSION } from '../constants.js';
import { createChildLogger, getLogger } from '../server/logger.js';
import type { AuthExtra } from '../storage/context.js';
import { registerTracedTool } from '../telemetry/tool-tracer.js';
import { extractTokenContext, resolveCompanyId } from '../storage/context.js';
import { createTextResponse, createTextResponseWithSkillHint, formatErrorMessage } from '../utils/error.js';

export function addAuthenticationTools(server: McpServer, options?: { remote?: boolean }): void {
  const logs = {
    currentUser: createChildLogger({ component: 'tool', tool: 'freee_current_user' }),
    authenticate: createChildLogger({ component: 'tool', tool: 'freee_authenticate' }),
    authStatus: createChildLogger({ component: 'tool', tool: 'freee_auth_status' }),
    clearAuth: createChildLogger({ component: 'tool', tool: 'freee_clear_auth' }),
    setCompany: createChildLogger({ component: 'tool', tool: 'freee_set_current_company' }),
    getCompany: createChildLogger({ component: 'tool', tool: 'freee_get_current_company' }),
    listCompanies: createChildLogger({ component: 'tool', tool: 'freee_list_companies' }),
  };

  registerTracedTool(server,
    'freee_current_user',
    {
      title: '現在のユーザー情報',
      description: '現在のユーザー情報を取得 (詳細ガイドはfreee-api-skill skillを参照)',
      annotations: { readOnlyHint: true },
    },
    async (extra: AuthExtra) => {
      const log = logs.currentUser();
      try {
        const tokenContext = extractTokenContext(extra);
        const companyId = await resolveCompanyId(tokenContext);

        if (!companyId) {
          return createTextResponse(
            '会社IDが設定されていません。freee_set_current_company で設定してください。',
          );
        }

        const [companyInfo, userInfo] = await Promise.all([
          tokenContext.tokenStore.getCompanyInfo(tokenContext.userId, companyId),
          makeApiRequest('GET', '/api/1/users/me', undefined, undefined, undefined, tokenContext),
        ]);

        log.info({ company_id: companyId }, 'Tool call completed');
        return createTextResponse(
          `現在のユーザー情報:\n` +
            `会社ID: ${companyId}\n` +
            `会社名: ${companyInfo?.name || 'Unknown'}\n` +
            `ユーザー詳細:\n${JSON.stringify(userInfo, null, 2)}`,
        );
      } catch (error) {
        log.error({ err: error }, 'Tool call failed');
        return createTextResponse(`ユーザー情報の取得に失敗: ${formatErrorMessage(error)}`);
      }
    },
  );

  if (!options?.remote) {
    registerTracedTool(server,
      'freee_authenticate',
      {
        title: 'OAuth認証',
        description: 'OAuth認証を開始、初回のみ必要 (詳細ガイドはfreee-api-skill skillを参照)',
        annotations: { destructiveHint: false },
      },
      async () => {
        const log = logs.authenticate();
        try {
          const { clientId, clientSecret } = getConfig().freee;

          if (!clientId) {
            return createTextResponse(
              'クライアントIDが設定されていません。\n' +
                '`freee-mcp configure` を実行してセットアップしてください。',
            );
          }

          if (!clientSecret) {
            return createTextResponse(
              'クライアントシークレットが設定されていません。\n' +
                '`freee-mcp configure` を実行してセットアップしてください。',
            );
          }

          // Start callback server on-demand with auto-stop after timeout
          await startCallbackServerWithAutoStop(AUTH_TIMEOUT_MS);

          const { codeVerifier, codeChallenge } = generatePKCE();
          const state = crypto.randomBytes(16).toString('hex');
          const authUrl = buildAuthUrl(codeChallenge, state, getActualRedirectUri());

          registerAuthenticationRequest(state, codeVerifier);

          log.info('Authentication URL generated');

          return createTextResponse(
            `認証URL: ${authUrl}\n\nブラウザで開いて認証してください。5分でタイムアウトします。`,
          );
        } catch (error) {
          log.error({ err: error }, 'Tool call failed');
          return createTextResponse(`認証開始に失敗: ${formatErrorMessage(error)}`);
        }
      },
    );
  }

  registerTracedTool(server,
    'freee_auth_status',
    {
      title: '認証状態確認',
      description: '認証状態を確認 (詳細ガイドはfreee-api-skill skillを参照)',
      annotations: { readOnlyHint: true },
    },
    async (extra: AuthExtra) => {
      const log = logs.authStatus();
      try {
        const tokenContext = extractTokenContext(extra);
        const tokens = await tokenContext.tokenStore.loadTokens(tokenContext.userId);
        if (!tokens) {
          return createTextResponse('未認証。freee_authenticate で認証してください。');
        }

        const isValid = Date.now() < tokens.expires_at;
        const expiryDate = new Date(tokens.expires_at).toLocaleString();

        log.info('Tool call completed');
        return createTextResponseWithSkillHint(
          `認証状態: ${isValid ? '有効' : '期限切れ'}\n有効期限: ${expiryDate}` +
            (isValid ? '' : '\n次回API使用時に自動更新されます。'),
        );
      } catch (error) {
        log.error({ err: error }, 'Tool call failed');
        return createTextResponse(`認証状態の確認に失敗: ${formatErrorMessage(error)}`);
      }
    },
  );

  registerTracedTool(server,
    'freee_clear_auth',
    {
      title: '認証情報クリア',
      description: '認証情報をクリア (詳細ガイドはfreee-api-skill skillを参照)',
      annotations: { idempotentHint: true, openWorldHint: false },
    },
    async (extra: AuthExtra) => {
      const log = logs.clearAuth();
      try {
        const tokenContext = extractTokenContext(extra);
        await tokenContext.tokenStore.clearTokens(tokenContext.userId);
        log.info('Tool call completed');
        return createTextResponse(
          '認証情報をクリアしました。再認証するには freee_authenticate を使用。',
        );
      } catch (error) {
        log.error({ err: error }, 'Tool call failed');
        return createTextResponse(`認証情報のクリアに失敗: ${formatErrorMessage(error)}`);
      }
    },
  );

  // Company management tools
  registerTracedTool(server,
    'freee_set_current_company',
    {
      title: '事業所設定',
      description: '事業所を設定・切り替え (詳細ガイドはfreee-api-skill skillを参照)',
      inputSchema: {
        company_id: z.string().describe('事業所ID'),
        name: z.string().optional().describe('事業所名'),
        description: z.string().optional().describe('説明'),
      },
      annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (
      args: { company_id: string; name?: string; description?: string },
      extra?: AuthExtra,
    ) => {
      const log = logs.setCompany();
      try {
        const { company_id, name, description } = args;
        const tokenContext = extractTokenContext(extra);

        await tokenContext.tokenStore.setCurrentCompany(tokenContext.userId, company_id, name, description);

        const companyInfo = await tokenContext.tokenStore.getCompanyInfo(tokenContext.userId, company_id);

        log.info('Tool call completed');
        return createTextResponse(`事業所を設定: ${companyInfo?.name || company_id}`);
      } catch (error) {
        log.error({ err: error }, 'Tool call failed');
        return createTextResponse(`事業所の設定に失敗: ${formatErrorMessage(error)}`);
      }
    },
  );

  registerTracedTool(server,
    'freee_get_current_company',
    {
      title: '現在の事業所情報',
      description: '現在の事業所情報を表示 (詳細ガイドはfreee-api-skill skillを参照)',
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (extra: AuthExtra) => {
      const log = logs.getCompany();
      try {
        const tokenContext = extractTokenContext(extra);
        const companyId = await resolveCompanyId(tokenContext);
        const companyInfo = await tokenContext.tokenStore.getCompanyInfo(tokenContext.userId, companyId);

        log.info('Tool call completed');
        if (!companyInfo) {
          return createTextResponseWithSkillHint(`事業所ID: ${companyId} (詳細情報なし)`);
        }

        return createTextResponseWithSkillHint(`事業所: ${companyInfo.name} (ID: ${companyInfo.id})`);
      } catch (error) {
        log.error({ err: error }, 'Tool call failed');
        return createTextResponse(`事業所情報の取得に失敗: ${formatErrorMessage(error)}`);
      }
    },
  );

  registerTracedTool(server,
    'freee_list_companies',
    {
      title: '事業所一覧',
      description: '事業所一覧を表示 (詳細ガイドはfreee-api-skill skillを参照)',
      annotations: { readOnlyHint: true },
    },
    async (extra: AuthExtra) => {
      const log = logs.listCompanies();
      try {
        const tokenContext = extractTokenContext(extra);
        const CompanyResponseSchema = z.object({
          companies: z
            .array(
              z.object({
                id: z.number(),
                name: z.string().nullable(),
              }),
            )
            .optional(),
        });
        const rawResponse = await makeApiRequest(
          'GET',
          '/api/1/companies',
          undefined,
          undefined,
          undefined,
          tokenContext,
        );
        const parseResult = CompanyResponseSchema.safeParse(rawResponse);
        if (!parseResult.success) {
          return {
            content: [
              {
                type: 'text',
                text: `APIレスポンスの形式が不正です: ${parseResult.error.message}`,
              },
            ],
          };
        }
        const apiCompanies = parseResult.data;
        const currentCompanyId = await resolveCompanyId(tokenContext);

        if (!apiCompanies?.companies?.length) {
          return createTextResponse('事業所情報を取得できませんでした。');
        }

        const companyList = apiCompanies.companies
          .map((company) => {
            const current = company.id === parseInt(currentCompanyId, 10) ? ' *' : '';
            return `${company.name ?? '(名称未設定)'} (${company.id})${current}`;
          })
          .join('\n');

        log.info('Tool call completed');
        return createTextResponse(`事業所一覧:\n${companyList}`);
      } catch (error) {
        log.error({ err: error }, 'Tool call failed');
        return createTextResponse(`事業所一覧の取得に失敗: ${formatErrorMessage(error)}`);
      }
    },
  );

  registerTracedTool(server,
    'freee_server_info',
    {
      title: 'サーバー情報',
      description: 'freee-mcp サーバーの情報を取得（バージョンなど）',
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => {
      getLogger().info({ component: 'tool', tool: 'freee_server_info' }, 'Tool call completed');
      const transport = options?.remote ? 'remote' : 'stdio';
      return createTextResponse(
        `freee-mcp server info:\n- version: ${PACKAGE_VERSION}\n- transport: ${transport}`,
      );
    },
  );
}
