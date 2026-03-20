import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('loadRemoteServerConfig', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    // Set required env vars
    process.env.API_BEARER_TOKEN = 'test-bearer';
    process.env.FREEE_CLIENT_ID = 'test-client-id';
    process.env.FREEE_CLIENT_SECRET = 'test-client-secret';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should load config from environment variables', async () => {
    const { loadRemoteServerConfig } = await import('./config.js');
    const config = loadRemoteServerConfig();

    expect(config).toEqual({
      port: 3000,
      bearerToken: 'test-bearer',
      freeeClientId: 'test-client-id',
      freeeClientSecret: 'test-client-secret',
      tokenEndpoint: 'https://accounts.secure.freee.co.jp/public_api/token',
      scope: 'read write',
      redisUrl: 'redis://localhost:6379',
    });
  });

  it('should throw when API_BEARER_TOKEN is missing', async () => {
    delete process.env.API_BEARER_TOKEN;
    const { loadRemoteServerConfig } = await import('./config.js');

    expect(() => loadRemoteServerConfig()).toThrow('API_BEARER_TOKEN');
  });

  it('should throw when FREEE_CLIENT_ID and FREEE_CLIENT_SECRET are missing', async () => {
    delete process.env.FREEE_CLIENT_ID;
    delete process.env.FREEE_CLIENT_SECRET;
    const { loadRemoteServerConfig } = await import('./config.js');

    expect(() => loadRemoteServerConfig()).toThrow('FREEE_CLIENT_ID');
  });


  it('should use custom PORT', async () => {
    process.env.PORT = '8080';
    const { loadRemoteServerConfig } = await import('./config.js');
    const config = loadRemoteServerConfig();

    expect(config.port).toBe(8080);
  });

  it('should use custom REDIS_URL', async () => {
    process.env.REDIS_URL = 'redis://custom:6380';
    const { loadRemoteServerConfig } = await import('./config.js');
    const config = loadRemoteServerConfig();

    expect(config.redisUrl).toBe('redis://custom:6380');
  });
});

describe('initRemoteConfig', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should set cached config so getConfig works', async () => {
    const { initRemoteConfig, getConfig } = await import('./config.js');

    initRemoteConfig({
      port: 3000,
      bearerToken: 'test',
      freeeClientId: 'cid',
      freeeClientSecret: 'csec',
      tokenEndpoint: 'https://test.freee.co.jp/token',
      scope: 'read write',
      redisUrl: 'redis://localhost:6379',
    });

    const config = getConfig();
    expect(config.freee.clientId).toBe('cid');
    expect(config.freee.clientSecret).toBe('csec');
    expect(config.oauth.tokenEndpoint).toBe('https://test.freee.co.jp/token');
    expect(config.server.name).toBe('freee');
  });
});
