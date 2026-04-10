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
import { serializeErrorChain } from '../server/error-serializer.js';
import { getCurrentRecorder } from '../server/request-context.js';
import type { AuthExtra } from '../storage/context.js';
import { registerTracedTool } from '../telemetry/tool-tracer.js';
import { extractTokenContext, resolveCompanyId } from '../storage/context.js';
import { createTextResponse, formatErrorMessage } from '../utils/error.js';

export function addAuthenticationTools(server: McpServer, options?: { remote?: boolean }): void {
  registerTracedTool(server,
    'freee_current_user',
    {
      title: '現在のユーザー情報',
      description: '現在のユーザー情報を取得 (詳細ガイドはfreee-api-skill skillを参照)',
      annotations: { readOnlyHint: true },
    },
    async (extra: AuthExtra) => {
      const recorder = getCurrentRecorder();
      const toolStart = Date.now();
      try {
        const tokenContext = extractTokenContext(extra);
        const companyId = await resolveCompanyId(tokenContext);

        if (!companyId) {
          recorder?.recordToolCall({
            tool: 'freee_current_user',
            status: 'success',
            duration_ms: Date.now() - toolStart,
          });
          return createTextResponse(
            '会社IDが設定されていません。freee_set_current_company で設定してください。',
          );
        }

        const [companyInfo, userInfo] = await Promise.all([
          tokenContext.tokenStore.getCompanyInfo(tokenContext.userId, companyId),
          makeApiRequest('GET', '/api/1/users/me', undefined, undefined, undefined, tokenContext),
        ]);

        recorder?.recordToolCall({
          tool: 'freee_current_user',
          status: 'success',
          duration_ms: Date.now() - toolStart,
        });
        return createTextResponse(
          `現在のユーザー情報:\n` +
            `会社ID: ${companyId}\n` +
            `会社名: ${companyInfo?.name || 'Unknown'}\n` +
            `ユーザー詳細:\n${JSON.stringify(userInfo, null, 2)}`,
        );
      } catch (error) {
        recorder?.recordToolCall({
          tool: 'freee_current_user',
          status: 'error',
          duration_ms: Date.now() - toolStart,
        });
        recorder?.recordError({ source: 'tool_handler', chain: serializeErrorChain(error) });
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
        const recorder = getCurrentRecorder();
        const toolStart = Date.now();
        try {
          const { clientId, clientSecret } = getConfig().freee;

          if (!clientId) {
            recorder?.recordToolCall({
              tool: 'freee_authenticate',
              status: 'success',
              duration_ms: Date.now() - toolStart,
            });
            return createTextResponse(
              'クライアントIDが設定されていません。\n' +
                '`freee-mcp configure` を実行してセットアップしてください。',
            );
          }

          if (!clientSecret) {
            recorder?.recordToolCall({
              tool: 'freee_authenticate',
              status: 'success',
              duration_ms: Date.now() - toolStart,
            });
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

          recorder?.recordToolCall({
            tool: 'freee_authenticate',
            status: 'success',
            duration_ms: Date.now() - toolStart,
          });

          return createTextResponse(
            `認証URL: ${authUrl}\n\nブラウザで開いて認証してください。5分でタイムアウトします。`,
          );
        } catch (error) {
          recorder?.recordToolCall({
            tool: 'freee_authenticate',
            status: 'error',
            duration_ms: Date.now() - toolStart,
          });
          recorder?.recordError({ source: 'tool_handler', chain: serializeErrorChain(error) });
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
      const recorder = getCurrentRecorder();
      const toolStart = Date.now();
      try {
        const tokenContext = extractTokenContext(extra);
        const tokens = await tokenContext.tokenStore.loadTokens(tokenContext.userId);
        if (!tokens) {
          recorder?.recordToolCall({
            tool: 'freee_auth_status',
            status: 'success',
            duration_ms: Date.now() - toolStart,
          });
          return createTextResponse('未認証。freee_authenticate で認証してください。');
        }

        const isValid = Date.now() < tokens.expires_at;
        const expiryDate = new Date(tokens.expires_at).toLocaleString();

        recorder?.recordToolCall({
          tool: 'freee_auth_status',
          status: 'success',
          duration_ms: Date.now() - toolStart,
        });
        return createTextResponse(
          `認証状態: ${isValid ? '有効' : '期限切れ'}\n有効期限: ${expiryDate}` +
            (isValid ? '' : '\n次回API使用時に自動更新されます。'),
        );
      } catch (error) {
        recorder?.recordToolCall({
          tool: 'freee_auth_status',
          status: 'error',
          duration_ms: Date.now() - toolStart,
        });
        recorder?.recordError({ source: 'tool_handler', chain: serializeErrorChain(error) });
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
      const recorder = getCurrentRecorder();
      const toolStart = Date.now();
      try {
        const tokenContext = extractTokenContext(extra);
        await tokenContext.tokenStore.clearTokens(tokenContext.userId);
        recorder?.recordToolCall({
          tool: 'freee_clear_auth',
          status: 'success',
          duration_ms: Date.now() - toolStart,
        });
        return createTextResponse(
          '認証情報をクリアしました。再認証するには freee_authenticate を使用。',
        );
      } catch (error) {
        recorder?.recordToolCall({
          tool: 'freee_clear_auth',
          status: 'error',
          duration_ms: Date.now() - toolStart,
        });
        recorder?.recordError({ source: 'tool_handler', chain: serializeErrorChain(error) });
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
      const recorder = getCurrentRecorder();
      const toolStart = Date.now();
      try {
        const { company_id, name, description } = args;
        const tokenContext = extractTokenContext(extra);

        await tokenContext.tokenStore.setCurrentCompany(tokenContext.userId, company_id, name, description);

        const companyInfo = await tokenContext.tokenStore.getCompanyInfo(tokenContext.userId, company_id);

        recorder?.recordToolCall({
          tool: 'freee_set_current_company',
          status: 'success',
          duration_ms: Date.now() - toolStart,
        });
        return createTextResponse(`事業所を設定: ${companyInfo?.name || company_id}`);
      } catch (error) {
        recorder?.recordToolCall({
          tool: 'freee_set_current_company',
          status: 'error',
          duration_ms: Date.now() - toolStart,
        });
        recorder?.recordError({ source: 'tool_handler', chain: serializeErrorChain(error) });
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
      const recorder = getCurrentRecorder();
      const toolStart = Date.now();
      try {
        const tokenContext = extractTokenContext(extra);
        const companyId = await resolveCompanyId(tokenContext);
        const companyInfo = await tokenContext.tokenStore.getCompanyInfo(tokenContext.userId, companyId);

        recorder?.recordToolCall({
          tool: 'freee_get_current_company',
          status: 'success',
          duration_ms: Date.now() - toolStart,
        });
        if (!companyInfo) {
          return createTextResponse(`事業所ID: ${companyId} (詳細情報なし)`);
        }

        return createTextResponse(`事業所: ${companyInfo.name} (ID: ${companyInfo.id})`);
      } catch (error) {
        recorder?.recordToolCall({
          tool: 'freee_get_current_company',
          status: 'error',
          duration_ms: Date.now() - toolStart,
        });
        recorder?.recordError({ source: 'tool_handler', chain: serializeErrorChain(error) });
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
      const recorder = getCurrentRecorder();
      const toolStart = Date.now();
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
          recorder?.recordToolCall({
            tool: 'freee_list_companies',
            status: 'error',
            duration_ms: Date.now() - toolStart,
          });
          recorder?.recordError({
            source: 'tool_handler',
            error_type: 'schema_mismatch',
            chain: [{ name: 'ZodError', message: parseResult.error.message }],
          });
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
          recorder?.recordToolCall({
            tool: 'freee_list_companies',
            status: 'success',
            duration_ms: Date.now() - toolStart,
          });
          return createTextResponse('事業所情報を取得できませんでした。');
        }

        const companyList = apiCompanies.companies
          .map((company) => {
            const current = company.id === parseInt(currentCompanyId, 10) ? ' *' : '';
            return `${company.name ?? '(名称未設定)'} (${company.id})${current}`;
          })
          .join('\n');

        recorder?.recordToolCall({
          tool: 'freee_list_companies',
          status: 'success',
          duration_ms: Date.now() - toolStart,
        });
        return createTextResponse(`事業所一覧:\n${companyList}`);
      } catch (error) {
        recorder?.recordToolCall({
          tool: 'freee_list_companies',
          status: 'error',
          duration_ms: Date.now() - toolStart,
        });
        recorder?.recordError({ source: 'tool_handler', chain: serializeErrorChain(error) });
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
      const recorder = getCurrentRecorder();
      const toolStart = Date.now();
      const transport = options?.remote ? 'remote' : 'stdio';
      recorder?.recordToolCall({
        tool: 'freee_server_info',
        status: 'success',
        duration_ms: Date.now() - toolStart,
      });
      return createTextResponse(
        `freee-mcp server info:\n- version: ${PACKAGE_VERSION}\n- transport: ${transport}`,
      );
    },
  );
}
