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
 * Generates a single generic API client tool
 */
export function generateClientModeTool(server: McpServer): void {
  server.tool(
    'freee_api_client',
    'freee APIへの汎用クライアント。任意のAPIエンドポイントにリクエストを送信します。パスはOpenAPIスキーマに対して検証されます。',
    {
      method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).describe('HTTPメソッド'),
      path: z.string().describe('APIパス (例: /api/1/deals, /api/1/deals/123)'),
      query: z.record(z.unknown()).optional().describe('クエリパラメータ (オプション)'),
      body: z.record(z.unknown()).optional().describe('リクエストボディ (POST/PUT/PATCHの場合)'),
    },
    async (args) => {
      try {
        const { method, path, query, body } = args;

        // Validate path against OpenAPI schema
        const validation = validatePath(method, path);
        if (!validation.isValid) {
          return {
            content: [
              {
                type: 'text',
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
          query as Record<string, unknown> | undefined,
          body as Record<string, unknown> | undefined,
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ APIリクエストエラー: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
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
            type: 'text',
            text: `# freee API 利用可能なエンドポイント一覧\n\n${pathsList}\n\n` +
                  `💡 使用例:\n` +
                  `freee_api_client { "method": "GET", "path": "/api/1/deals", "query": { "limit": 10 } }`,
          },
        ],
      };
    }
  );
}
