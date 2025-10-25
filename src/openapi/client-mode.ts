import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import freeeApiSchema from '../data/freee-api-schema.json';
import { OpenAPIOperation, OpenAPIPathItem } from '../api/types.js';
import { makeApiRequest } from '../api/client.js';

interface PathValidationResult {
  isValid: boolean;
  message: string;
  operation?: OpenAPIOperation;
  actualPath?: string;
}

/**
 * Validates if a given path and method exist in the OpenAPI schema
 * Supports path parameters like /api/1/deals/{id}
 */
export function validatePath(method: string, path: string): PathValidationResult {
  const paths = freeeApiSchema.paths;
  const normalizedMethod = method.toLowerCase();

  // Try exact match first
  if (path in paths) {
    const pathItem = paths[path as keyof typeof paths] as OpenAPIPathItem;
    if (normalizedMethod in pathItem) {
      return {
        isValid: true,
        message: 'Valid path and method',
        operation: pathItem[normalizedMethod as keyof OpenAPIPathItem] as OpenAPIOperation,
        actualPath: path,
      };
    }
  }

  // Try pattern matching for paths with parameters
  const pathKeys = Object.keys(paths);
  for (const schemaPath of pathKeys) {
    // Convert OpenAPI path pattern to regex
    // /api/1/deals/{id} -> /api/1/deals/[^/]+
    const pattern = schemaPath.replace(/\{[^}]+\}/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);

    if (regex.test(path)) {
      const pathItem = paths[schemaPath as keyof typeof paths] as OpenAPIPathItem;
      if (normalizedMethod in pathItem) {
        return {
          isValid: true,
          message: 'Valid path and method',
          operation: pathItem[normalizedMethod as keyof OpenAPIPathItem] as OpenAPIOperation,
          actualPath: path,
        };
      }
    }
  }

  // Path not found, provide helpful error
  const availableMethods = Object.keys(paths)
    .filter((p) => {
      const pattern = p.replace(/\{[^}]+\}/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(path);
    })
    .flatMap((p) => {
      const pathItem = paths[p as keyof typeof paths] as OpenAPIPathItem;
      return Object.keys(pathItem).filter((m) =>
        ['get', 'post', 'put', 'delete', 'patch'].includes(m)
      );
    });

  if (availableMethods.length > 0) {
    return {
      isValid: false,
      message: `Method '${method}' not found for path '${path}'. Available methods: ${availableMethods.join(', ')}`,
    };
  }

  return {
    isValid: false,
    message: `Path '${path}' not found in OpenAPI schema. Please check the path format.`,
  };
}

/**
 * Lists all available paths in the OpenAPI schema
 */
export function listAvailablePaths(): string {
  const paths = freeeApiSchema.paths;
  const pathList: string[] = [];

  Object.entries(paths).forEach(([path, pathItem]) => {
    const methods = Object.keys(pathItem as OpenAPIPathItem)
      .filter((m) => ['get', 'post', 'put', 'delete', 'patch'].includes(m))
      .map((m) => m.toUpperCase());

    if (methods.length > 0) {
      pathList.push(`${methods.join('|')} ${path}`);
    }
  });

  return pathList.sort().join('\n');
}

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

      // Validate path against OpenAPI schema
      const validation = validatePath(method, path);
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

      // Make API request
      const result = await makeApiRequest(
        method,
        validation.actualPath!,
        query,
        body,
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
    'freee APIで利用可能なすべてのエンドポイントパスとHTTPメソッドの一覧を表示します。',
    {},
    async () => {
      const pathsList = listAvailablePaths();
      return {
        content: [
          {
            type: 'text' as const,
            text: `# freee API 利用可能なエンドポイント一覧\n\n${pathsList}\n\n` +
                  `💡 使用例:\n` +
                  `freee_api_get { "path": "/api/1/deals", "query": { "limit": 10 } }\n` +
                  `freee_api_post { "path": "/api/1/deals", "body": { "issue_date": "2024-01-01", ... } }`,
          },
        ],
      };
    }
  );
}
