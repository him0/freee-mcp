import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { makeApiRequest } from '../api/client.js';
import { validatePathAcrossApis, listAllAvailablePaths } from './schema-loader.js';

/**
 * Creates a tool handler for a specific HTTP method
 */
function createMethodTool(method: string): (args: { path: string; query?: Record<string, unknown>; body?: Record<string, unknown> }) => Promise<{
  content: {
    type: 'text';
    text: string;
  }[];
}> {
  return async (args: { path: string; query?: Record<string, unknown>; body?: Record<string, unknown> }) => {
    try {
      const { path, query, body } = args;

      // Validate path against all OpenAPI schemas
      const validation = validatePathAcrossApis(method, path);
      if (!validation.isValid) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `❌ パス検証エラー: ${validation.message}\n\n` +
                    `💡 利用可能なパスを確認するには freee_api_list_paths ツールを使用してください。`,
            },
          ],
        };
      }

      // Make API request with the correct base URL
      const result = await makeApiRequest(
        method,
        validation.actualPath!,
        query,
        body,
        validation.baseUrl,
      );

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `❌ APIリクエストエラー: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  };
}

/**
 * Generates API client tools as sub-commands per HTTP method
 */
export function generateClientModeTool(server: McpServer): void {
  // GET tool
  server.tool(
    'freee_api_get',
    'freee APIへのGETリクエスト。データの取得に使用します。パスはOpenAPIスキーマに対して検証されます。',
    {
      path: z.string().describe('APIパス (例: /api/1/deals, /api/1/deals/123)'),
      query: z.record(z.unknown()).optional().describe('クエリパラメータ (オプション)'),
    },
    createMethodTool('GET')
  );

  // POST tool
  server.tool(
    'freee_api_post',
    'freee APIへのPOSTリクエスト。新規データの作成に使用します。パスはOpenAPIスキーマに対して検証されます。',
    {
      path: z.string().describe('APIパス (例: /api/1/deals)'),
      body: z.record(z.unknown()).describe('リクエストボディ'),
      query: z.record(z.unknown()).optional().describe('クエリパラメータ (オプション)'),
    },
    createMethodTool('POST')
  );

  // PUT tool
  server.tool(
    'freee_api_put',
    'freee APIへのPUTリクエスト。既存データの更新に使用します。パスはOpenAPIスキーマに対して検証されます。',
    {
      path: z.string().describe('APIパス (例: /api/1/deals/123)'),
      body: z.record(z.unknown()).describe('リクエストボディ'),
      query: z.record(z.unknown()).optional().describe('クエリパラメータ (オプション)'),
    },
    createMethodTool('PUT')
  );

  // DELETE tool
  server.tool(
    'freee_api_delete',
    'freee APIへのDELETEリクエスト。データの削除に使用します。パスはOpenAPIスキーマに対して検証されます。',
    {
      path: z.string().describe('APIパス (例: /api/1/deals/123)'),
      query: z.record(z.unknown()).optional().describe('クエリパラメータ (オプション)'),
    },
    createMethodTool('DELETE')
  );

  // PATCH tool
  server.tool(
    'freee_api_patch',
    'freee APIへのPATCHリクエスト。既存データの部分更新に使用します。パスはOpenAPIスキーマに対して検証されます。',
    {
      path: z.string().describe('APIパス (例: /api/1/deals/123)'),
      body: z.record(z.unknown()).describe('リクエストボディ'),
      query: z.record(z.unknown()).optional().describe('クエリパラメータ (オプション)'),
    },
    createMethodTool('PATCH')
  );

  // Add helper tool to list available paths
  server.tool(
    'freee_api_list_paths',
    'freee APIで利用可能なすべてのエンドポイントパスとHTTPメソッドの一覧を表示します。会計、人事労務、請求書、工数管理の全APIに対応しています。',
    {},
    async () => {
      const pathsList = listAllAvailablePaths();
      return {
        content: [
          {
            type: 'text' as const,
            text: `# freee API 利用可能なエンドポイント一覧${pathsList}\n\n` +
                  `💡 使用例:\n` +
                  `freee_api_get { "path": "/api/1/deals", "query": { "limit": 10 } }\n` +
                  `freee_api_post { "path": "/api/1/deals", "body": { "issue_date": "2024-01-01", ... } }`,
          },
        ],
      };
    }
  );
}
