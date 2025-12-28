import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MinimalSchema,
  MinimalPathItem,
  MinimalOperation,
} from './minimal-types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemasDir = path.resolve(__dirname, '../../openapi/minimal');

function loadSchema(filename: string): MinimalSchema {
  const filePath = path.join(schemasDir, filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as MinimalSchema;
}

export type ApiType = 'accounting' | 'hr' | 'invoice' | 'pm';

export interface ApiConfig {
  schema: MinimalSchema;
  baseUrl: string;
  prefix: string;
  name: string;
}

// Lazy-load schemas to avoid loading at module initialization
let _apiConfigs: Record<ApiType, ApiConfig> | null = null;

function getApiConfigs(): Record<ApiType, ApiConfig> {
  if (_apiConfigs === null) {
    _apiConfigs = {
      accounting: {
        schema: loadSchema('accounting.json'),
        baseUrl: 'https://api.freee.co.jp',
        prefix: 'accounting',
        name: 'freee会計 API',
      },
      hr: {
        schema: loadSchema('hr.json'),
        baseUrl: 'https://api.freee.co.jp/hr',
        prefix: 'hr',
        name: 'freee人事労務 API',
      },
      invoice: {
        schema: loadSchema('invoice.json'),
        baseUrl: 'https://api.freee.co.jp/iv',
        prefix: 'invoice',
        name: 'freee請求書 API',
      },
      pm: {
        schema: loadSchema('pm.json'),
        baseUrl: 'https://api.freee.co.jp/pm',
        prefix: 'pm',
        name: 'freee工数管理 API',
      },
    };
  }
  return _apiConfigs;
}

export const API_CONFIGS: Record<ApiType, ApiConfig> = new Proxy(
  {} as Record<ApiType, ApiConfig>,
  {
    get(_, prop: string): ApiConfig | undefined {
      return getApiConfigs()[prop as ApiType];
    },
    ownKeys(): string[] {
      return Object.keys(getApiConfigs());
    },
    getOwnPropertyDescriptor(_, prop: string): PropertyDescriptor | undefined {
      const configs = getApiConfigs();
      if (prop in configs) {
        return {
          enumerable: true,
          configurable: true,
          value: configs[prop as ApiType],
        };
      }
      return undefined;
    },
  }
);

export interface PathValidationResult {
  isValid: boolean;
  message: string;
  operation?: MinimalOperation;
  actualPath?: string;
  apiType?: ApiType;
  baseUrl?: string;
}

/**
 * Validates if a given path and method exist for a specific API service
 * Returns the validation result with base URL
 */
export function validatePathForService(
  method: string,
  path: string,
  service: ApiType
): PathValidationResult {
  const normalizedMethod = method.toLowerCase() as keyof MinimalPathItem;
  const config = API_CONFIGS[service];
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
        apiType: service,
        baseUrl: config.baseUrl,
      };
    }
  }

  // Try pattern matching for paths with parameters
  const pathKeys = Object.keys(paths);
  for (const schemaPath of pathKeys) {
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
          apiType: service,
          baseUrl: config.baseUrl,
        };
      }
    }
  }

  // Path not found in specified service
  return {
    isValid: false,
    message: `Path '${path}' not found in ${config.name} schema. Please check the path format or use freee_api_list_paths to see available endpoints.`,
  };
}

/**
 * Validates if a given path and method exist across all API schemas
 * Returns the matching API type and base URL
 * @deprecated Use validatePathForService() instead
 */
export function validatePathAcrossApis(method: string, path: string): PathValidationResult {
  const normalizedMethod = method.toLowerCase() as keyof MinimalPathItem;

  // Search across all API schemas
  for (const [apiType, config] of Object.entries(API_CONFIGS) as [ApiType, ApiConfig][]) {
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
    const pathKeys = Object.keys(paths);
    for (const schemaPath of pathKeys) {
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
