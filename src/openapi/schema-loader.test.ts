import { describe, it, expect, afterEach } from 'vitest';
import {
  API_CONFIGS,
  type ApiType,
  validatePathForService,
  listAllAvailablePaths,
  _resetApiConfigs,
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
      // biome-ignore lint/suspicious/noExplicitAny: testing access with unknown key
      const config = (API_CONFIGS as any).unknown;
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

  describe('resolveBaseUrl (env var overrides)', () => {
    const envVarNames = [
      'FREEE_API_BASE_URL_ACCOUNTING',
      'FREEE_API_BASE_URL_HR',
      'FREEE_API_BASE_URL_INVOICE',
      'FREEE_API_BASE_URL_PM',
      'FREEE_API_BASE_URL_SM',
    ];

    afterEach(() => {
      for (const name of envVarNames) {
        delete process.env[name];
      }
      _resetApiConfigs();
    });

    it('should use default base URL when no env vars are set', () => {
      _resetApiConfigs();
      expect(API_CONFIGS.accounting.baseUrl).toBe('https://api.freee.co.jp');
      expect(API_CONFIGS.hr.baseUrl).toBe('https://api.freee.co.jp/hr');
      expect(API_CONFIGS.invoice.baseUrl).toBe('https://api.freee.co.jp/iv');
      expect(API_CONFIGS.pm.baseUrl).toBe('https://api.freee.co.jp/pm');
      expect(API_CONFIGS.sm.baseUrl).toBe('https://api.freee.co.jp/sm');
    });

    it('should override with per-service env var', () => {
      process.env.FREEE_API_BASE_URL_HR = 'https://staging.example.com/hr';
      _resetApiConfigs();
      expect(API_CONFIGS.hr.baseUrl).toBe('https://staging.example.com/hr');
    });

    it('should not affect other services when one is overridden', () => {
      process.env.FREEE_API_BASE_URL_HR = 'https://staging.example.com/hr';
      _resetApiConfigs();
      expect(API_CONFIGS.accounting.baseUrl).toBe('https://api.freee.co.jp');
      expect(API_CONFIGS.invoice.baseUrl).toBe('https://api.freee.co.jp/iv');
      expect(API_CONFIGS.pm.baseUrl).toBe('https://api.freee.co.jp/pm');
      expect(API_CONFIGS.sm.baseUrl).toBe('https://api.freee.co.jp/sm');
    });

    it('should strip trailing slashes from env var values', () => {
      process.env.FREEE_API_BASE_URL_ACCOUNTING = 'https://staging.example.com/';
      _resetApiConfigs();
      expect(API_CONFIGS.accounting.baseUrl).toBe('https://staging.example.com');
    });

    it('should propagate overridden baseUrl through validatePathForService', () => {
      process.env.FREEE_API_BASE_URL_ACCOUNTING = 'https://staging.example.com';
      _resetApiConfigs();
      const result = validatePathForService('GET', '/api/1/deals', 'accounting');
      expect(result.isValid).toBe(true);
      expect(result.baseUrl).toBe('https://staging.example.com');
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
