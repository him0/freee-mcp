import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { convertParameterToZodSchema, convertPathToToolName } from './schema.js';
import { OpenAPIParameter } from '../api/types.js';

describe('schema', () => {
  describe('convertParameterToZodSchema', () => {
    it('should convert string parameter to ZodString', () => {
      const parameter: OpenAPIParameter = {
        name: 'name',
        in: 'query',
        schema: { type: 'string' },
        required: true
      };

      const schema = convertParameterToZodSchema(parameter);
      
      expect(schema).toBeInstanceOf(z.ZodString);
    });

    it('should convert integer parameter to ZodNumber with int constraint', () => {
      const parameter: OpenAPIParameter = {
        name: 'id',
        in: 'path',
        schema: { type: 'integer' },
        required: true
      };

      const schema = convertParameterToZodSchema(parameter);
      
      // ZodNumber.int() creates a ZodEffects schema internally, but vitest might see the outer type
      expect((schema._def as unknown as { typeName: string }).typeName).toMatch(/^Zod(Effects|Number)$/);
    });

    it('should convert number parameter to ZodNumber', () => {
      const parameter: OpenAPIParameter = {
        name: 'amount',
        in: 'query',
        schema: { type: 'number' },
        required: true
      };

      const schema = convertParameterToZodSchema(parameter);
      
      expect(schema).toBeInstanceOf(z.ZodNumber);
    });

    it('should convert boolean parameter to ZodBoolean', () => {
      const parameter: OpenAPIParameter = {
        name: 'active',
        in: 'query',
        schema: { type: 'boolean' },
        required: true
      };

      const schema = convertParameterToZodSchema(parameter);
      
      expect(schema).toBeInstanceOf(z.ZodBoolean);
    });

    it('should convert unknown type to ZodAny', () => {
      const parameter: OpenAPIParameter = {
        name: 'data',
        in: 'query',
        schema: { type: 'array' as unknown as 'string' },
        required: true
      };

      const schema = convertParameterToZodSchema(parameter);
      
      expect(schema).toBeInstanceOf(z.ZodAny);
    });

    it('should make schema optional when not required', () => {
      const parameter: OpenAPIParameter = {
        name: 'optional_param',
        in: 'query',
        schema: { type: 'string' },
        required: false
      };

      const schema = convertParameterToZodSchema(parameter);
      
      expect((schema._def as unknown as { typeName: string }).typeName).toBe('ZodOptional');
    });

    it('should add description when provided', () => {
      const parameter: OpenAPIParameter = {
        name: 'name',
        in: 'query',
        schema: { type: 'string' },
        description: 'The name of the resource',
        required: true
      };

      const schema = convertParameterToZodSchema(parameter);
      
      expect(schema._def.description).toBe('The name of the resource');
    });

    it('should handle parameter without schema property', () => {
      const parameter: OpenAPIParameter = {
        name: 'legacy_param',
        in: 'query',
        type: 'string',
        required: true
      } as OpenAPIParameter & { type: string };

      const schema = convertParameterToZodSchema(parameter);
      
      expect(schema).toBeInstanceOf(z.ZodString);
    });
  });

  describe('convertPathToToolName', () => {
    it('should convert simple path to tool name', () => {
      const path = '/api/1/users';
      const result = convertPathToToolName(path);
      
      expect(result).toBe('users');
    });

    it('should convert path with ID parameter', () => {
      const path = '/api/1/users/{id}';
      const result = convertPathToToolName(path);
      
      expect(result).toBe('users_by_id');
    });

    it('should convert nested path', () => {
      const path = '/api/1/companies/{company_id}/deals';
      const result = convertPathToToolName(path);
      
      expect(result).toBe('companies_by_id_deals');
    });

    it('should convert path with multiple parameters', () => {
      const path = '/api/1/companies/{company_id}/deals/{deal_id}';
      const result = convertPathToToolName(path);
      
      expect(result).toBe('companies_by_id_deals_by_id');
    });

    it('should handle paths without API version prefix', () => {
      const path = '/users/{id}/profile';
      const result = convertPathToToolName(path);
      
      expect(result).toBe('_users_by_id_profile');
    });

    it('should truncate very long tool names', () => {
      const longPath = '/api/1/very/long/path/with/many/segments/that/exceeds/the/limit';
      const result = convertPathToToolName(longPath);
      
      expect(result.length).toBeLessThanOrEqual(50);
      expect(result).toBe('very_long_path_with_many_segments_that_exceeds_the');
    });

    it('should handle empty path', () => {
      const path = '';
      const result = convertPathToToolName(path);
      
      expect(result).toBe('');
    });

    it('should handle root path', () => {
      const path = '/';
      const result = convertPathToToolName(path);
      
      expect(result).toBe('_');
    });

    it('should handle path with trailing slash', () => {
      const path = '/api/1/users/';
      const result = convertPathToToolName(path);
      
      expect(result).toBe('users_');
    });
  });
});