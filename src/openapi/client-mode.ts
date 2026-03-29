import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { isBinaryFileResponse, makeApiRequest } from '../api/client.js';
import type { AuthExtra } from '../storage/context.js';
import { extractTokenContext } from '../storage/context.js';
import { createTextResponse, formatErrorMessage } from '../utils/error.js';
import { type ApiType, listAllAvailablePaths, validatePathForService } from './schema-loader.js';

const SUPPORTED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

const SERVICE_HINT = 'service: accounting/hr/invoice/pm/sm';
const SKILL_HINT = '詳細ガイドはfreee-api-skill skillを参照';

const serviceSchema = z
  .enum(['accounting', 'hr', 'invoice', 'pm', 'sm'])
  .describe('対象のfreeeサービス');

/**
 * Creates a tool handler for a specific HTTP method
 */
function createMethodTool(method: string) {
  return async (
    args: {
      service: ApiType;
      path: string;
      query?: Record<string, unknown>;
      body?: Record<string, unknown>;
    },
    extra?: AuthExtra,
  ) => {
    try {
      const { service, path, query, body } = args;
      const { tokenStore, userId } = extractTokenContext(extra);

      const validation = validatePathForService(method, path, service);
      if (!validation.isValid) {
        return createTextResponse(
          `パス検証エラー: ${validation.message}\n\n` +
            `利用可能なパスを確認するには freee_api_list_paths ツールを使用してください。`,
        );
      }

      const actualPath = validation.actualPath ?? path;
      const result = await makeApiRequest(
        method,
        actualPath,
        query,
        body,
        validation.baseUrl,
        { tokenStore, userId },
      );

      if (isBinaryFileResponse(result)) {
        const baseMimeType = result.mimeType.split(';')[0].trim();

        if (SUPPORTED_IMAGE_MIME_TYPES.has(baseMimeType)) {
          return {
            content: [{ type: 'image', data: result.data.toString('base64'), mimeType: baseMimeType }],
          };
        }

        if (baseMimeType === 'application/pdf') {
          return {
            content: [
              {
                type: 'resource',
                resource: {
                  uri: `freee://api${actualPath}`,
                  mimeType: baseMimeType,
                  blob: result.data.toString('base64'),
                },
              },
            ],
          };
        }

        if (baseMimeType === 'text/csv') {
          return createTextResponse(result.data.toString('utf-8'));
        }

        return createTextResponse(
          `バイナリファイルを受信しました。このファイル形式（${baseMimeType}）は表示できません。\n\n` +
            `Content-Type: ${result.mimeType}\n` +
            `ファイルサイズ: ${result.size} bytes\n\n` +
            `このファイルを取得するには、freee Webアプリから直接ダウンロードしてください。`,
        );
      }

      if (result === null) {
        return createTextResponse('リクエストが正常に完了しました。');
      }

      return createTextResponse(JSON.stringify(result, null, 2));
    } catch (error) {
      return createTextResponse(`APIリクエストエラー: ${formatErrorMessage(error)}`);
    }
  };
}

/**
 * Generates API client tools as sub-commands per HTTP method
 */
export function generateClientModeTool(server: McpServer): void {
  // GET tool
  server.registerTool(
    'freee_api_get',
    {
      title: 'freee API GET リクエスト',
      description: `freee API GET - ${SERVICE_HINT} (${SKILL_HINT})`,
      inputSchema: {
        service: serviceSchema,
        path: z.string().describe('APIパス (例: /api/1/deals)'),
        query: z.record(z.string(), z.unknown()).optional().describe('クエリパラメータ (オプション)'),
      },
      annotations: { readOnlyHint: true },
    },
    createMethodTool('GET'),
  );

  // POST tool
  server.registerTool(
    'freee_api_post',
    {
      title: 'freee API POST リクエスト',
      description: `freee API POST - ${SERVICE_HINT} (${SKILL_HINT})`,
      inputSchema: {
        service: serviceSchema,
        path: z.string().describe('APIパス (例: /api/1/deals)'),
        body: z.record(z.string(), z.unknown()).describe('リクエストボディ'),
        query: z.record(z.string(), z.unknown()).optional().describe('クエリパラメータ (オプション)'),
      },
      annotations: { destructiveHint: false },
    },
    createMethodTool('POST'),
  );

  // PUT tool
  server.registerTool(
    'freee_api_put',
    {
      title: 'freee API PUT リクエスト',
      description: `freee API PUT - ${SERVICE_HINT} (${SKILL_HINT})`,
      inputSchema: {
        service: serviceSchema,
        path: z.string().describe('APIパス (例: /api/1/deals/123)'),
        body: z.record(z.string(), z.unknown()).describe('リクエストボディ'),
        query: z.record(z.string(), z.unknown()).optional().describe('クエリパラメータ (オプション)'),
      },
      annotations: { destructiveHint: false, idempotentHint: true },
    },
    createMethodTool('PUT'),
  );

  // DELETE tool
  server.registerTool(
    'freee_api_delete',
    {
      title: 'freee API DELETE リクエスト',
      description: `freee API DELETE - ${SERVICE_HINT} (${SKILL_HINT})`,
      inputSchema: {
        service: serviceSchema,
        path: z.string().describe('APIパス (例: /api/1/deals/123)'),
        query: z.record(z.string(), z.unknown()).optional().describe('クエリパラメータ (オプション)'),
      },
      annotations: { idempotentHint: true },
    },
    createMethodTool('DELETE'),
  );

  // PATCH tool
  server.registerTool(
    'freee_api_patch',
    {
      title: 'freee API PATCH リクエスト',
      description: `freee API PATCH - ${SERVICE_HINT} (${SKILL_HINT})`,
      inputSchema: {
        service: serviceSchema,
        path: z.string().describe('APIパス (例: /api/1/deals/123)'),
        body: z.record(z.string(), z.unknown()).describe('リクエストボディ'),
        query: z.record(z.string(), z.unknown()).optional().describe('クエリパラメータ (オプション)'),
      },
      annotations: { destructiveHint: false },
    },
    createMethodTool('PATCH'),
  );

  // Add helper tool to list available paths
  server.registerTool(
    'freee_api_list_paths',
    {
      title: 'API エンドポイント一覧',
      description: 'freee API エンドポイント一覧 (詳細ガイドはfreee-api-skill skillを参照)',
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => {
      const pathsList = listAllAvailablePaths();
      return createTextResponse(
        `# freee API 利用可能なエンドポイント一覧${pathsList}\n\n` +
          `使用例:\n` +
          `freee_api_get { "service": "accounting", "path": "/api/1/deals", "query": { "limit": 10 } }\n` +
          `freee_api_get { "service": "accounting", "path": "/api/1/deals", "query": { "type": "income", "limit": 5 } }\n` +
          `freee_api_post { "service": "accounting", "path": "/api/1/deals", "body": { "issue_date": "2024-01-01", ... } }`,
      );
    },
  );
}
