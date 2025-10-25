import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { OpenAPIOperation, OpenAPIPathItem, OpenAPIParameter } from '../api/types.js';
import { convertParameterToZodSchema, convertPathToToolName, sanitizePropertyName } from './schema.js';
import { makeApiRequest } from '../api/client.js';
import { getAllSchemas } from './schema-loader.js';

export function generateToolsFromOpenApi(server: McpServer): void {
  // Generate tools from all API schemas
  const allSchemas = getAllSchemas();

  allSchemas.forEach(({ apiType, config }) => {
    const paths = config.schema.paths;
    const prefix = config.prefix;
    const baseUrl = config.baseUrl;

    const orderedPathKeys = Object.keys(paths).sort();

    orderedPathKeys.forEach((pathKey) => {
      const pathItem: OpenAPIPathItem = paths[pathKey];
      Object.entries(pathItem).forEach(([method, operation]: [string, OpenAPIOperation]) => {
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
              baseUrl, // Use the API-specific base URL
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
  });
}