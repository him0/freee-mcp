import { afterEach, describe, expect, it, vi } from 'vitest';

describe('logger', () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('should create a logger with default level', async () => {
    const { initLogger } = await import('./logger.js');
    const logger = initLogger();
    expect(logger).toBeDefined();
    expect(logger.level).toBe('info');
  });

  it('should create a logger with custom level (string)', async () => {
    const { initLogger } = await import('./logger.js');
    const logger = initLogger('debug');
    expect(logger).toBeDefined();
    expect(logger.level).toBe('debug');
  });

  it('should create a logger with LoggerOptions', async () => {
    const { initLogger } = await import('./logger.js');
    const logger = initLogger({ level: 'warn', transportMode: 'remote' });
    expect(logger).toBeDefined();
    expect(logger.level).toBe('warn');
  });

  it('getLogger returns singleton', async () => {
    const { initLogger, getLogger } = await import('./logger.js');
    const logger1 = initLogger('warn');
    const logger2 = getLogger();
    expect(logger1).toBe(logger2);
  });

  it('getLogger creates logger lazily if not initialized', async () => {
    const { getLogger } = await import('./logger.js');
    const logger = getLogger();
    expect(logger).toBeDefined();
    expect(logger.level).toBe('info');
  });
});

describe('sanitizePath', () => {
  it('should strip query string', async () => {
    const { sanitizePath } = await import('./logger.js');
    expect(sanitizePath('/api/1/deals?limit=5&offset=0')).toBe('/api/:id/deals');
  });

  it('should replace numeric segments with :id', async () => {
    const { sanitizePath } = await import('./logger.js');
    expect(sanitizePath('/api/1/deals/12345')).toBe('/api/:id/deals/:id');
  });

  it('should preserve non-numeric segments', async () => {
    const { sanitizePath } = await import('./logger.js');
    expect(sanitizePath('/api/1/companies')).toBe('/api/:id/companies');
  });

  it('should handle HR API paths', async () => {
    const { sanitizePath } = await import('./logger.js');
    // v1 is a version identifier, not a numeric ID - only standalone numeric segments are replaced
    expect(sanitizePath('/hr/api/v1/employees/99')).toBe('/hr/api/v1/employees/:id');
  });

  it('should handle path without numeric segments', async () => {
    const { sanitizePath } = await import('./logger.js');
    expect(sanitizePath('/health')).toBe('/health');
  });

  it('should handle path with query string and numeric ID', async () => {
    const { sanitizePath } = await import('./logger.js');
    expect(sanitizePath('/api/1/deals/999?company_id=123')).toBe('/api/:id/deals/:id');
  });
});
