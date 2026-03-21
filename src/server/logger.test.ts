import { describe, it, expect, vi, afterEach } from 'vitest';

describe('logger', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('should create a logger with default level', async () => {
    const { initLogger } = await import('./logger.js');
    const logger = initLogger();
    expect(logger).toBeDefined();
    expect(logger.level).toBe('info');
  });

  it('should create a logger with custom level', async () => {
    const { initLogger } = await import('./logger.js');
    const logger = initLogger('debug');
    expect(logger).toBeDefined();
    expect(logger.level).toBe('debug');
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
