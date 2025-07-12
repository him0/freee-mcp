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
            actualPath = actualPath.replace(`{${param.name}}`, String(params[param.name]));
          });

          const queryParameters: Record<string, unknown> = {};
          queryParams.forEach((param: OpenAPIParameter) => {
            if (params[param.name] !== undefined) {
              queryParameters[param.name] = params[param.name];
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