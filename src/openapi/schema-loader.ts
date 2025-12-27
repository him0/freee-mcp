import accountingSchema from '../../openapi/minimal/accounting.json';
import hrSchema from '../../openapi/minimal/hr.json';
import invoiceSchema from '../../openapi/minimal/invoice.json';
import pmSchema from '../../openapi/minimal/pm.json';
import {
  MinimalSchema,
  MinimalPathItem,
  MinimalOperation,
} from './minimal-types.js';

export type ApiType = 'accounting' | 'hr' | 'invoice' | 'pm';

export interface ApiConfig {
  schema: MinimalSchema;
  baseUrl: string;
  prefix: string;
  name: string;
}

export const API_CONFIGS: Record<ApiType, ApiConfig> = {
  accounting: {
    schema: accountingSchema as MinimalSchema,
    baseUrl: 'https://api.freee.co.jp',
    prefix: 'accounting',
    name: 'freee会計 API',
  },
  hr: {
    schema: hrSchema as MinimalSchema,
    baseUrl: 'https://api.freee.co.jp/hr',
    prefix: 'hr',
    name: 'freee人事労務 API',
  },
  invoice: {
    schema: invoiceSchema as MinimalSchema,
    baseUrl: 'https://api.freee.co.jp/iv',
    prefix: 'invoice',
    name: 'freee請求書 API',
  },
  pm: {
    schema: pmSchema as MinimalSchema,
    baseUrl: 'https://api.freee.co.jp/pm',
    prefix: 'pm',
    name: 'freee工数管理 API',
  },
};

export interface PathValidationResult {
  isValid: boolean;
  message: string;
  operation?: MinimalOperation;
  actualPath?: string;
  apiType?: ApiType;
  baseUrl?: string;
}

/**
 * Internal helper to find a path and method in a specific API schema
 * Returns PathValidationResult if found, null otherwise
 */
function findPathInSchema(
  normalizedMethod: keyof MinimalPathItem,
  path: string,
  apiType: ApiType,
  config: ApiConfig
): PathValidationResult | null {
  const paths = config.schema.paths;

  // Try exact match first
  if (path in paths) {
    const pathItem = paths[path];
    if (normalizedMethod in pathItem) {
      return {
        isValid: true,
        message: 'Valid path and method',
        operation: pathItem[normalizedMethod],
        actualPath: path,
        apiType,
        baseUrl: config.baseUrl,
      };
    }
  }

  // Try pattern matching for paths with parameters
  for (const schemaPath of Object.keys(paths)) {
    // Convert OpenAPI path pattern to regex
    const pattern = schemaPath.replace(/\{[^}]+\}/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);

    if (regex.test(path)) {
      const pathItem = paths[schemaPath];
      if (normalizedMethod in pathItem) {
        return {
          isValid: true,
          message: 'Valid path and method',
          operation: pathItem[normalizedMethod],
          actualPath: path,
          apiType,
          baseUrl: config.baseUrl,
        };
      }
    }
  }

  return null;
}

/**
 * Validates if a given path and method exist for a specific API service or across all APIs
 * When service is provided, validates only against that service's schema
 * When service is omitted, searches across all API schemas
 * Returns the validation result with base URL
 */
export function validatePathForService(
  method: string,
  path: string,
  service?: ApiType
): PathValidationResult {
  const normalizedMethod = method.toLowerCase() as keyof MinimalPathItem;

  if (service !== undefined) {
    // Validate against specific service
    const config = API_CONFIGS[service];
    const result = findPathInSchema(normalizedMethod, path, service, config);
    if (result) {
      return result;
    }
    return {
      isValid: false,
      message: `Path '${path}' not found in ${config.name} schema. Please check the path format or use freee_api_list_paths to see available endpoints.`,
    };
  }

  // Search across all API schemas
  for (const [apiType, config] of Object.entries(API_CONFIGS) as [ApiType, ApiConfig][]) {
    const result = findPathInSchema(normalizedMethod, path, apiType, config);
    if (result) {
      return result;
    }
  }

  // Path not found in any API
  return {
    isValid: false,
    message: `Path '${path}' not found in any freee API schema. Please check the path format or use freee_api_list_paths to see available endpoints.`,
  };
}

/**
 * Lists all available paths across all API schemas, grouped by API type
 */
export function listAllAvailablePaths(): string {
  const sections: string[] = [];

  for (const [, config] of Object.entries(API_CONFIGS) as [ApiType, ApiConfig][]) {
    const paths = config.schema.paths;
    const pathList: string[] = [];

    Object.entries(paths).forEach(([path, pathItem]) => {
      const methods = Object.keys(pathItem as MinimalPathItem)
        .filter((m) => ['get', 'post', 'put', 'delete', 'patch'].includes(m))
        .map((m) => m.toUpperCase());

      if (methods.length > 0) {
        pathList.push(`  ${methods.join('|')} ${path}`);
      }
    });

    if (pathList.length > 0) {
      sections.push(`\n## ${config.name} (${config.baseUrl})\n${pathList.sort().join('\n')}`);
    }
  }

  return sections.join('\n');
}

/**
 * Get all schemas for API mode tool generation
 */
export function getAllSchemas(): Array<{ apiType: ApiType; config: ApiConfig }> {
  return Object.entries(API_CONFIGS).map(([apiType, config]) => ({
    apiType: apiType as ApiType,
    config,
  }));
}
