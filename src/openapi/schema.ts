import { z } from 'zod';
import { MinimalParameter } from './minimal-types.js';

export function convertParameterToZodSchema(parameter: MinimalParameter): z.ZodType {
  const { type, description, required } = parameter;

  let schema;

  switch (type) {
    case 'string':
      schema = z.string();
      break;
    case 'integer':
      schema = z.number().int();
      break;
    case 'number':
      schema = z.number();
      break;
    case 'boolean':
      schema = z.boolean();
      break;
    default:
      schema = z.any();
  }

  if (description) {
    schema = schema.describe(description);
  }

  if (!required) {
    schema = schema.optional();
  }

  return schema;
}

export function convertPathToToolName(path: string): string {
  let toolName = path
    .replace(/^\/api\/\d+\//, '')
    .replace(/\/{[^}]+}/g, '_by_id')
    .replace(/\//g, '_');

  if (toolName.length > 50) {
    toolName = toolName.substring(0, 50);
  }

  return toolName;
}

export function sanitizePropertyName(name: string): string {
  // MCP property names must match pattern '^[a-zA-Z0-9_.-]{1,64}$'
  const sanitized = name
    .replace(/[^a-zA-Z0-9_.-]/g, '_') // Replace invalid characters with underscore
    .substring(0, 64); // Limit to 64 characters

  // Ensure non-empty result (MCP requires at least 1 character)
  return sanitized || '_';
}