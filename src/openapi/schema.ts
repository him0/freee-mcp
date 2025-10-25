import { z } from 'zod';
import { OpenAPIParameter } from '../api/types.js';

interface OpenAPISchema {
  type?: string;
  properties?: Record<string, OpenAPISchema>;
  items?: OpenAPISchema;
  required?: string[];
  description?: string;
  $ref?: string;
}

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

export function sanitizePropertyName(name: string): string {
  // MCP property names must match pattern '^[a-zA-Z0-9_.-]{1,64}$'
  const sanitized = name
    .replace(/[^a-zA-Z0-9_.-]/g, '_') // Replace invalid characters with underscore
    .substring(0, 64); // Limit to 64 characters

  // Ensure non-empty result (MCP requires at least 1 character)
  return sanitized || '_';
}

export function convertOpenApiSchemaToZodSchema(schema: OpenAPISchema | undefined): z.ZodType {
  if (!schema) {
    return z.any();
  }

  // Handle $ref - for now, return z.any() as we don't resolve references
  if (schema.$ref) {
    return z.any();
  }

  switch (schema.type) {
    case 'string':
      return schema.description ? z.string().describe(schema.description) : z.string();
    
    case 'number':
      return schema.description ? z.number().describe(schema.description) : z.number();
    
    case 'integer':
      return schema.description ? z.number().int().describe(schema.description) : z.number().int();
    
    case 'boolean':
      return schema.description ? z.boolean().describe(schema.description) : z.boolean();
    
    case 'array':
      const itemSchema = convertOpenApiSchemaToZodSchema(schema.items);
      return schema.description ? z.array(itemSchema).describe(schema.description) : z.array(itemSchema);
    
    case 'object':
      if (!schema.properties) {
        return schema.description ? z.any().describe(schema.description) : z.any();
      }

      const zodProperties: Record<string, z.ZodType> = {};
      const requiredFields = schema.required || [];

      for (const [propertyName, propertySchema] of Object.entries(schema.properties)) {
        const sanitizedName = sanitizePropertyName(propertyName);
        let propertyZodSchema = convertOpenApiSchemaToZodSchema(propertySchema);
        
        // Make optional if not in required array
        if (!requiredFields.includes(propertyName)) {
          propertyZodSchema = propertyZodSchema.optional();
        }
        
        zodProperties[sanitizedName] = propertyZodSchema;
      }

      const objectSchema = z.object(zodProperties);
      return schema.description ? objectSchema.describe(schema.description) : objectSchema;
    
    default:
      return schema.description ? z.any().describe(schema.description) : z.any();
  }
}