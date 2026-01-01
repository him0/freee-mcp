import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { makeApiRequest, BinaryFileResponse } from '../api/client.js';
import { validatePathForService, listAllAvailablePaths, ApiType } from './schema-loader.js';

/**
 * Check if result is a binary file response
 */
function isBinaryFileResponse(result: unknown): result is BinaryFileResponse {
  return (
    typeof result === 'object' &&
    result !== null &&
    'type' in result &&
    (result as BinaryFileResponse).type === 'binary'
  );
}

/**
 * Format binary file response for display
 */
function formatBinaryResponse(response: BinaryFileResponse): string {
  const sizeInKB = (response.size / 1024).toFixed(2);
  return (
    `ファイルをダウンロードしました\n\n` +
    `保存場所: ${response.filePath}\n` +
    `MIMEタイプ: ${response.mimeType}\n` +
    `サイズ: ${sizeInKB} KB`
  );
}

// 簡略化: 詳細はfreee_api_list_pathsで確認可能
const SERVICE_HINT = 'service: accounting/hr/invoice/pm/sm';

const serviceSchema = z.enum(['accounting', 'hr', 'invoice', 'pm', 'sm']).describe('対象のfreeeサービス');
const companyIdSchema = z.string().optional().describe('事業所ID（省略時はデフォルト事業所）');

/**
 * Creates a tool handler for a specific HTTP method
 */
function createMethodTool(method: string): (args: {
  service: ApiType;
  path: string;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  company_id?: string;
}) => Promise<{
  content: {
    type: 'text';
    text: string;
  }[];
}> {
  return async (args: {
    service: ApiType;
    path: string;
    query?: Record<string, unknown>;
    body?: Record<string, unknown>;
    company_id?: string;
  }) => {
    try {
      const { service, path, query, body, company_id } = args;

      // Validate path against the specified service's OpenAPI schema
      const validation = validatePathForService(method, path, service);
      if (!validation.isValid) {
        return {
          content: [
            {
              type: 'text' as const,
              text:
                `パス検証エラー: ${validation.message}\n\n` +
                `利用可能なパスを確認するには freee_api_list_paths ツールを使用してください。`,
            },
          ],
        };
      }

      // Make API request with the correct base URL and optional company_id
      const result = await makeApiRequest(method, validation.actualPath!, query, body, validation.baseUrl, company_id);

      // Handle binary file response
      if (isBinaryFileResponse(result)) {
        return {
          content: [
            {
              type: 'text' as const,
              text: formatBinaryResponse(result),
            },
          ],
        };
      }

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
            text: `APIリクエストエラー: ${error instanceof Error ? error.message : String(error)}`,
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
    `freee API GET。${SERVICE_HINT}`,
    {
      service: serviceSchema,
      path: z.string().describe('APIパス (例: /api/1/deals, /invoices)'),
      query: z.record(z.string(), z.unknown()).optional().describe('クエリパラメータ (オプション)'),
      company_id: companyIdSchema,
    },
    createMethodTool('GET')
  );

  // POST tool
  server.tool(
    'freee_api_post',
    `freee API POST。${SERVICE_HINT}`,
    {
      service: serviceSchema,
      path: z.string().describe('APIパス (例: /api/1/deals, /invoices)'),
      body: z.record(z.string(), z.unknown()).describe('リクエストボディ'),
      query: z.record(z.string(), z.unknown()).optional().describe('クエリパラメータ (オプション)'),
      company_id: companyIdSchema,
    },
    createMethodTool('POST')
  );

  // PUT tool
  server.tool(
    'freee_api_put',
    `freee API PUT。${SERVICE_HINT}`,
    {
      service: serviceSchema,
      path: z.string().describe('APIパス (例: /api/1/deals/123, /invoices/123)'),
      body: z.record(z.string(), z.unknown()).describe('リクエストボディ'),
      query: z.record(z.string(), z.unknown()).optional().describe('クエリパラメータ (オプション)'),
      company_id: companyIdSchema,
    },
    createMethodTool('PUT')
  );

  // DELETE tool
  server.tool(
    'freee_api_delete',
    `freee API DELETE。${SERVICE_HINT}`,
    {
      service: serviceSchema,
      path: z.string().describe('APIパス (例: /api/1/deals/123)'),
      query: z.record(z.string(), z.unknown()).optional().describe('クエリパラメータ (オプション)'),
      company_id: companyIdSchema,
    },
    createMethodTool('DELETE')
  );

  // PATCH tool
  server.tool(
    'freee_api_patch',
    `freee API PATCH。${SERVICE_HINT}`,
    {
      service: serviceSchema,
      path: z.string().describe('APIパス (例: /api/1/deals/123)'),
      body: z.record(z.string(), z.unknown()).describe('リクエストボディ'),
      query: z.record(z.string(), z.unknown()).optional().describe('クエリパラメータ (オプション)'),
      company_id: companyIdSchema,
    },
    createMethodTool('PATCH')
  );

  // Add helper tool to list available paths
  server.tool(
    'freee_api_list_paths',
    'freee API エンドポイント一覧。詳細なガイドはfreee-mcp skillを参照。',
    {},
    async () => {
      const pathsList = listAllAvailablePaths();
      return {
        content: [
          {
            type: 'text' as const,
            text:
              `# freee API 利用可能なエンドポイント一覧${pathsList}\n\n` +
              `使用例:\n` +
              `freee_api_get { "service": "accounting", "path": "/api/1/deals", "query": { "limit": 10 } }\n` +
              `freee_api_get { "service": "invoice", "path": "/invoices" }\n` +
              `freee_api_post { "service": "accounting", "path": "/api/1/deals", "body": { "issue_date": "2024-01-01", ... } }\n\n` +
              `注: company_id パラメータを省略するとデフォルト事業所が使用されます。\n` +
              `別の事業所を指定する場合は company_id パラメータを追加してください。`,
          },
        ],
      };
    }
  );
}
