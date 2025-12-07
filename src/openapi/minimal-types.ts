/**
 * Minimal OpenAPI schema types
 * These types represent the minimized schema structure used for reduced memory consumption
 */

export interface MinimalParameter {
  name: string;
  in: 'path' | 'query';
  required?: boolean;
  description?: string;
  type: string;
}

export interface MinimalOperation {
  summary?: string;
  description?: string;
  parameters?: MinimalParameter[];
  hasJsonBody?: boolean;
}

export interface MinimalPathItem {
  get?: MinimalOperation;
  post?: MinimalOperation;
  put?: MinimalOperation;
  delete?: MinimalOperation;
  patch?: MinimalOperation;
}

export interface MinimalSchema {
  paths: Record<string, MinimalPathItem>;
}
