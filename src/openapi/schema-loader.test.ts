import { describe, it, expect } from 'vitest';
import {
  API_CONFIGS,
  ApiType,
  validatePathForService,
  listAllAvailablePaths,
} from './schema-loader.js';

describe('schema-loader', () => {
  describe('API_CONFIGS', () => {
    const apiTypes: ApiType[] = ['accounting', 'hr', 'invoice', 'pm', 'sm'];

    it.each(apiTypes)('should return config for %s API', (apiType) => {
      const config = API_CONFIGS[apiType];

      expect(config).toBeDefined();
      expect(config.schema).toBeDefined();
      expect(config.schema.paths).toBeDefined();
      expect(config.baseUrl).toMatch(/^https:\/\/api\.freee\.co\.jp/);
      expect(config.prefix).toBe(apiType);
      expect(config.name).toContain('freee');
    });

    it('should return undefined for unknown API type', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const config = (API_CONFIGS as any)['unknown'];
      expect(config).toBeUndefined();
    });

    it('should enumerate all API types with Object.keys', () => {
      const keys = Object.keys(API_CONFIGS);
      expect(keys).toEqual(expect.arrayContaining(apiTypes));
      expect(keys.length).toBe(apiTypes.length);
    });
  });

  describe('validatePathForService', () => {
    it('should validate existing path in accounting API', () => {
      const result = validatePathForService('GET', '/api/1/deals', 'accounting');

      expect(result.isValid).toBe(true);
      expect(result.apiType).toBe('accounting');
      expect(result.baseUrl).toBe('https://api.freee.co.jp');
    });

    it('should validate path with parameters', () => {
      const result = validatePathForService('GET', '/api/1/deals/123', 'accounting');

      expect(result.isValid).toBe(true);
      expect(result.actualPath).toBe('/api/1/deals/123');
    });

    it('should return invalid for non-existent path', () => {
      const result = validatePathForService('GET', '/api/1/nonexistent', 'accounting');

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should search across all APIs when service is not specified', () => {
      const result = validatePathForService('GET', '/api/1/deals');

      expect(result.isValid).toBe(true);
      expect(result.apiType).toBe('accounting');
    });

    it('should validate HR API paths', () => {
      const result = validatePathForService('GET', '/api/v1/employees', 'hr');

      expect(result.isValid).toBe(true);
      expect(result.apiType).toBe('hr');
      expect(result.baseUrl).toBe('https://api.freee.co.jp/hr');
    });

    it('should be case-insensitive for HTTP methods', () => {
      const result = validatePathForService('get', '/api/1/deals', 'accounting');

      expect(result.isValid).toBe(true);
    });
  });

  describe('listAllAvailablePaths', () => {
    it('should return paths for all APIs', () => {
      const paths = listAllAvailablePaths();

      expect(paths).toContain('freee会計 API');
      expect(paths).toContain('freee人事労務 API');
      expect(paths).toContain('freee請求書 API');
      expect(paths).toContain('freee工数管理 API');
      expect(paths).toContain('freee販売 API');
    });

    it('should include HTTP methods', () => {
      const paths = listAllAvailablePaths();

      expect(paths).toMatch(/GET|POST|PUT|DELETE|PATCH/);
    });

    it('should include API paths', () => {
      const paths = listAllAvailablePaths();

      expect(paths).toContain('/api/1/deals');
    });
  });
});
