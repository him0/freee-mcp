import { z } from 'zod';
import { OpenAPIParameter } from '../api/types.js';

export function convertParameterToZodSchema(parameter: OpenAPIParameter): z.ZodType {
  const { type } = parameter.schema || parameter;
  const { description, required } = parameter;

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