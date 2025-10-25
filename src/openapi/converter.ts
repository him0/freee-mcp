import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import freeeApiSchema from '../data/freee-api-schema.json';
import { OpenAPIOperation, OpenAPIPathItem, OpenAPIParameter } from '../api/types.js';
import { convertParameterToZodSchema, convertPathToToolName, sanitizePropertyName } from './schema.js';
import { makeApiRequest } from '../api/client.js';

export function generateToolsFromOpenApi(server: McpServer): void {
  const paths = freeeApiSchema.paths;

  const orderedPathKeys = Object.keys(paths).sort() as (keyof typeof paths)[];

  orderedPathKeys.forEach((pathKey) => {
    const pathItem: OpenAPIPathItem = paths[pathKey];
    Object.entries(pathItem).forEach(([method, operation]: [string, OpenAPIOperation]) => {
      const toolName = `${method}_${convertPathToToolName(pathKey)}`;
      const description = operation.summary || operation.description || '';

      const parameterSchema: Record<string, z.ZodType> = {};

      const pathParams = operation.parameters?.filter((p) => p.in === 'path') || [];
      pathParams.forEach((param) => {
        parameterSchema[sanitizePropertyName(param.name)] = convertParameterToZodSchema(param);
      });

      const queryParams = operation.parameters?.filter((p) => p.in === 'query') || [];
      queryParams.forEach((param) => {
        let schema = convertParameterToZodSchema(param);
        if (param.name === 'company_id') {
          schema = schema.optional();
        }
        parameterSchema[sanitizePropertyName(param.name)] = schema;
      });

      let bodySchema = z.any();
      if (method === 'post' || method === 'put') {
        const requestBody = operation.requestBody?.content?.['application/json']?.schema;
        if (requestBody) {
          parameterSchema['body'] = bodySchema.describe('Request body');
        }
      }

      server.tool(toolName, description, parameterSchema, async (params) => {
        try {
          let actualPath = pathKey as string;
          pathParams.forEach((param: OpenAPIParameter) => {
            const sanitizedName = sanitizePropertyName(param.name);
            actualPath = actualPath.replace(`{${param.name}}`, String(params[sanitizedName]));
          });

          const queryParameters: Record<string, unknown> = {};
          queryParams.forEach((param: OpenAPIParameter) => {
            const sanitizedName = sanitizePropertyName(param.name);
            if (params[sanitizedName] !== undefined) {
              queryParameters[param.name] = params[sanitizedName];
            }
          });

          const bodyParameters =
            method === 'post' || method === 'put' ? params.body : undefined;
          const result = await makeApiRequest(
            method.toUpperCase(),
            actualPath,
            queryParameters,
            bodyParameters,
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
                text: `Error: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      });
    });
  });
}

export function addApiClientTool(server: McpServer): void {
  server.tool(
    'freee_api_client',
    'freee APIの汎用クライアント。Method、Path、Bodyを指定してAPIリクエストを実行します。Pathは事前にOpenAPI定義で検証されます。【OAuth以外の全APIエンドポイント対応】',
    {
      method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).describe('HTTPメソッド（GET, POST, PUT, DELETE, PATCH）'),
      path: z.string().describe('APIパス（例: /api/1/deals）'),
      body: z.any().optional().describe('リクエストボディ（POST, PUT時のみ必要）'),
      query_parameters: z.record(z.any()).optional().describe('クエリパラメータ（オプション）'),
    },
    async (params) => {
      try {
        const { method, path, body, query_parameters } = params;
        
        // Validate that the path exists in the OpenAPI schema
        if (!validateApiPath(method, path)) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: Path '${method} ${path}' is not defined in the freee API schema.\n\nAvailable paths for ${method}:\n${getAvailablePathsForMethod(method).join('\n')}`,
              },
            ],
          };
        }

        // Get path and query parameters from the schema
        const { pathParams, queryParams } = extractParametersFromSchema(method, path);
        
        // Process path parameters
        let actualPath = path;
        pathParams.forEach((param: OpenAPIParameter) => {
          if (query_parameters && query_parameters[param.name] !== undefined) {
            actualPath = actualPath.replace(`{${param.name}}`, String(query_parameters[param.name]));
          }
        });

        // Process query parameters
        const queryParameters: Record<string, unknown> = {};
        if (query_parameters) {
          queryParams.forEach((param: OpenAPIParameter) => {
            if (query_parameters[param.name] !== undefined) {
              queryParameters[param.name] = query_parameters[param.name];
            }
          });
        }

        const result = await makeApiRequest(
          method.toUpperCase(),
          actualPath,
          queryParameters,
          body,
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
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
}

function validateApiPath(method: string, path: string): boolean {
  const paths = freeeApiSchema.paths;
  const pathItem: OpenAPIPathItem | undefined = paths[path as keyof typeof paths];
  
  if (!pathItem) {
    return false;
  }
  
  const operation = pathItem[method.toLowerCase() as keyof OpenAPIPathItem];
  return operation !== undefined;
}

function getAvailablePathsForMethod(method: string): string[] {
  const paths = freeeApiSchema.paths;
  const availablePaths: string[] = [];
  
  Object.keys(paths).forEach((pathKey) => {
    const pathItem: OpenAPIPathItem = paths[pathKey as keyof typeof paths];
    if (pathItem[method.toLowerCase() as keyof OpenAPIPathItem]) {
      availablePaths.push(pathKey);
    }
  });
  
  return availablePaths.sort();
}

function extractParametersFromSchema(method: string, path: string): {
  pathParams: OpenAPIParameter[];
  queryParams: OpenAPIParameter[];
} {
  const paths = freeeApiSchema.paths;
  const pathItem: OpenAPIPathItem = paths[path as keyof typeof paths];
  const operation = pathItem[method.toLowerCase() as keyof OpenAPIPathItem] as OpenAPIOperation;
  
  if (!operation || !operation.parameters) {
    return { pathParams: [], queryParams: [] };
  }
  
  const pathParams = operation.parameters.filter((p) => p.in === 'path');
  const queryParams = operation.parameters.filter((p) => p.in === 'query');
  
  return { pathParams, queryParams };
}