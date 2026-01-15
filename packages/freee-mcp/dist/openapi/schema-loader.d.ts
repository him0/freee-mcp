import { MinimalSchema, MinimalOperation } from './minimal-types.js';
export type ApiType = 'accounting' | 'hr' | 'invoice' | 'pm' | 'sm';
export interface ApiConfig {
    schema: MinimalSchema;
    baseUrl: string;
    prefix: string;
    name: string;
}
export declare const API_CONFIGS: Record<ApiType, ApiConfig>;
export interface PathValidationResult {
    isValid: boolean;
    message: string;
    operation?: MinimalOperation;
    actualPath?: string;
    apiType?: ApiType;
    baseUrl?: string;
}
/**
 * Validates if a given path and method exist for a specific API service or across all APIs
 * When service is provided, validates only against that service's schema
 * When service is omitted, searches across all API schemas
 * Returns the validation result with base URL
 */
export declare function validatePathForService(method: string, path: string, service?: ApiType): PathValidationResult;
/**
 * Lists all available paths across all API schemas, grouped by API type
 */
export declare function listAllAvailablePaths(): string;
