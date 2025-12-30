import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { MinimalPathItem, MinimalOperation, MinimalParameter } from './minimal-types.js';
import { convertParameterToZodSchema, convertPathToToolName, sanitizePropertyName } from './schema.js';
import { makeApiRequest, BinaryFileResponse } from '../api/client.js';
import { getAllSchemas } from './schema-loader.js';

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

export function generateToolsFromOpenApi(server: McpServer): void {
  // Generate tools from all API schemas
  const allSchemas = getAllSchemas();

  allSchemas.forEach(({ config }) => {
    const paths = config.schema.paths;
    const prefix = config.prefix;
    const baseUrl = config.baseUrl;

    const orderedPathKeys = Object.keys(paths).sort();

    orderedPathKeys.forEach((pathKey) => {
      const pathItem: MinimalPathItem = paths[pathKey];
      Object.entries(pathItem).forEach(([method, operation]: [string, MinimalOperation | undefined]) => {
        if (!operation) return;

        // Add API prefix to tool name
        const toolName = `${prefix}_${method}_${convertPathToToolName(pathKey)}`;
        const description = `[${config.name}] ${operation.summary || operation.description || ''}`;

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

        const bodySchema = z.record(z.string(), z.unknown());
        if (method === 'post' || method === 'put') {
          if (operation.hasJsonBody) {
            parameterSchema['body'] = bodySchema.describe('Request body');
          }
        }

        server.tool(toolName, description, parameterSchema, async (params: Record<string, unknown>) => {
          try {
            let actualPath = pathKey as string;
            pathParams.forEach((param: MinimalParameter) => {
              const sanitizedName = sanitizePropertyName(param.name);
              actualPath = actualPath.replace(`{${param.name}}`, String(params[sanitizedName]));
            });

            const queryParameters: Record<string, unknown> = {};
            queryParams.forEach((param: MinimalParameter) => {
              const sanitizedName = sanitizePropertyName(param.name);
              if (params[sanitizedName] !== undefined) {
                queryParameters[param.name] = params[sanitizedName];
              }
            });

            const bodyParameters =
              method === 'post' || method === 'put' ? (params.body as Record<string, unknown> | undefined) : undefined;
            const result = await makeApiRequest(
              method.toUpperCase(),
              actualPath,
              queryParameters,
              bodyParameters,
              baseUrl, // Use the API-specific base URL
            );

            // Handle binary file response
            if (isBinaryFileResponse(result)) {
              return {
                content: [
                  {
                    type: 'text',
                    text: formatBinaryResponse(result),
                  },
                ],
              };
            }

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
  });
}