import { z } from 'zod';

/**
 * Minimal OpenAPI schema types
 * These types represent the minimized schema structure used for reduced memory consumption
 */

export const MinimalParameterSchema = z.object({
  name: z.string(),
  in: z.enum(['path', 'query']),
  required: z.boolean().optional(),
  description: z.string().optional(),
  type: z.string(),
});

export interface MinimalParameter {
  name: string;
  in: 'path' | 'query';
  required?: boolean;
  description?: string;
  type: string;
}

export const MinimalOperationSchema = z.object({
  summary: z.string().optional(),
  description: z.string().optional(),
  parameters: z.array(MinimalParameterSchema).optional(),
  hasJsonBody: z.boolean().optional(),
});

export interface MinimalOperation {
  summary?: string;
  description?: string;
  parameters?: MinimalParameter[];
  hasJsonBody?: boolean;
}

export const MinimalPathItemSchema = z.object({
  get: MinimalOperationSchema.optional(),
  post: MinimalOperationSchema.optional(),
  put: MinimalOperationSchema.optional(),
  delete: MinimalOperationSchema.optional(),
  patch: MinimalOperationSchema.optional(),
});

export interface MinimalPathItem {
  get?: MinimalOperation;
  post?: MinimalOperation;
  put?: MinimalOperation;
  delete?: MinimalOperation;
  patch?: MinimalOperation;
}

export const MinimalSchemaSchema = z.object({
  paths: z.record(z.string(), MinimalPathItemSchema),
});

export interface MinimalSchema {
  paths: Record<string, MinimalPathItem>;
}
