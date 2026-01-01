/**
 * E2E tests for built dist files
 * Validates that dynamic file loading works correctly with dist-only files
 */

import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Use lib.esm.js which exports internal functions without starting the server
const distPath = path.resolve(__dirname, '../../dist/lib.esm.js');

describe('E2E: Dist Schema Loading', () => {
  it('should dynamically import dist/lib.esm.js', async () => {
    const module = await import(distPath);
    expect(module).toBeDefined();
  });

  it('should export expected functions from lib', async () => {
    const module = await import(distPath);

    expect(module.API_CONFIGS).toBeDefined();
    expect(module.validatePathForService).toBeDefined();
    expect(module.listAllAvailablePaths).toBeDefined();
    expect(module.generateClientModeTool).toBeDefined();
  });

  it('should successfully validate paths using dist bundle', async () => {
    const { validatePathForService, API_CONFIGS } = await import(distPath);

    // Test that API_CONFIGS is accessible (lazy loaded)
    expect(API_CONFIGS).toBeDefined();

    // Access accounting API config - this triggers schema loading
    const accountingConfig = API_CONFIGS['accounting'];
    expect(accountingConfig).toBeDefined();
    expect(accountingConfig.baseUrl).toBe('https://api.freee.co.jp');
    expect(accountingConfig.name).toBe('freee会計 API');

    // The schema should be loaded
    expect(accountingConfig.schema).toBeDefined();
    expect(accountingConfig.schema.paths).toBeDefined();
  });

  it('should load all 5 API schemas from dist', async () => {
    const { API_CONFIGS } = await import(distPath);

    const apiTypes = ['accounting', 'hr', 'invoice', 'pm', 'sm'] as const;

    for (const apiType of apiTypes) {
      const config = API_CONFIGS[apiType];
      expect(config, `${apiType} config should exist`).toBeDefined();
      expect(config.schema, `${apiType} schema should be loaded`).toBeDefined();
      expect(config.schema.paths, `${apiType} paths should exist`).toBeDefined();
      expect(Object.keys(config.schema.paths).length, `${apiType} should have paths`).toBeGreaterThan(0);
    }
  });

  it('should validate accounting API paths correctly', async () => {
    const { validatePathForService } = await import(distPath);

    // Valid path
    const validResult = validatePathForService('GET', '/api/1/deals', 'accounting');
    expect(validResult.isValid).toBe(true);
    expect(validResult.baseUrl).toBe('https://api.freee.co.jp');

    // Invalid path
    const invalidResult = validatePathForService('GET', '/invalid/path', 'accounting');
    expect(invalidResult.isValid).toBe(false);
  });

  it('should validate HR API paths correctly', async () => {
    const { validatePathForService } = await import(distPath);

    // Valid HR path
    const result = validatePathForService('GET', '/api/v1/employees', 'hr');
    expect(result.isValid).toBe(true);
    expect(result.baseUrl).toBe('https://api.freee.co.jp/hr');
  });

  it('should list all available paths from dist', async () => {
    const { listAllAvailablePaths } = await import(distPath);

    const pathsList = listAllAvailablePaths();

    // Should contain paths from all APIs
    expect(pathsList).toContain('freee会計 API');
    expect(pathsList).toContain('freee人事労務 API');
    expect(pathsList).toContain('freee請求書 API');
    expect(pathsList).toContain('freee工数管理 API');
    expect(pathsList).toContain('freee販売 API');
  });
});
