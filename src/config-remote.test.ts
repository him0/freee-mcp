import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('loadRemoteServerConfig', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    // Set required env vars
    process.env.ISSUER_URL = 'https://mcp.example.com';
    process.env.JWT_SECRET = 'a-test-secret-that-is-at-least-32-characters-long';
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
      issuerUrl: 'https://mcp.example.com',
      jwtSecret: 'a-test-secret-that-is-at-least-32-characters-long',
      freeeClientId: 'test-client-id',
      freeeClientSecret: 'test-client-secret',
      freeeAuthorizationEndpoint: 'https://accounts.secure.freee.co.jp/public_api/authorize',
      freeeTokenEndpoint: 'https://accounts.secure.freee.co.jp/public_api/token',
      freeeScope: 'read write',
      freeeApiUrl: 'https://api.freee.co.jp',
      redisUrl: 'redis://localhost:6379',
      corsAllowedOrigins: undefined,
      rateLimitEnabled: false,
      logLevel: 'info',
      allowInsecureLocalhostCimd: false,
    });
  });

  it('should opt in to allowInsecureLocalhostCimd when env var is "true"', async () => {
    process.env.FREEE_MCP_ALLOW_INSECURE_LOCALHOST_CIMD = 'true';
    const { loadRemoteServerConfig } = await import('./config.js');
    const config = loadRemoteServerConfig();

    expect(config.allowInsecureLocalhostCimd).toBe(true);
  });

  it('should refuse allowInsecureLocalhostCimd when NODE_ENV=production', async () => {
    process.env.FREEE_MCP_ALLOW_INSECURE_LOCALHOST_CIMD = 'true';
    process.env.NODE_ENV = 'production';
    const { loadRemoteServerConfig } = await import('./config.js');

    expect(() => loadRemoteServerConfig()).toThrow('NODE_ENV=production');
  });

  it('should throw when ISSUER_URL is missing', async () => {
    delete process.env.ISSUER_URL;
    const { loadRemoteServerConfig } = await import('./config.js');

    expect(() => loadRemoteServerConfig()).toThrow('ISSUER_URL');
  });

  it('should throw when JWT_SECRET is missing', async () => {
    delete process.env.JWT_SECRET;
    const { loadRemoteServerConfig } = await import('./config.js');

    expect(() => loadRemoteServerConfig()).toThrow('JWT_SECRET');
  });

  it('should throw when JWT_SECRET is too short', async () => {
    process.env.JWT_SECRET = 'short';
    const { loadRemoteServerConfig } = await import('./config.js');

    expect(() => loadRemoteServerConfig()).toThrow('at least 32 characters');
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

  it('should use custom FREEE_API_BASE_URL', async () => {
    process.env.FREEE_API_BASE_URL = 'https://staging.example.com';
    const { loadRemoteServerConfig } = await import('./config.js');
    const config = loadRemoteServerConfig();

    expect(config.freeeApiUrl).toBe('https://staging.example.com');
  });

  it('should strip trailing slashes from FREEE_API_BASE_URL', async () => {
    process.env.FREEE_API_BASE_URL = 'https://staging.example.com///';
    const { loadRemoteServerConfig } = await import('./config.js');
    const config = loadRemoteServerConfig();

    expect(config.freeeApiUrl).toBe('https://staging.example.com');
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
      issuerUrl: 'https://mcp.example.com',
      jwtSecret: 'a-test-secret-that-is-at-least-32-characters-long',
      freeeClientId: 'cid',
      freeeClientSecret: 'csec',
      freeeAuthorizationEndpoint: 'https://accounts.secure.freee.co.jp/public_api/authorize',
      freeeTokenEndpoint: 'https://test.freee.co.jp/token',
      freeeScope: 'read write',
      freeeApiUrl: 'https://api.freee.co.jp',
      redisUrl: 'redis://localhost:6379',
    });

    const config = getConfig();
    expect(config.freee.clientId).toBe('cid');
    expect(config.freee.clientSecret).toBe('csec');
    expect(config.freee.apiUrl).toBe('https://api.freee.co.jp');
    expect(config.oauth.tokenEndpoint).toBe('https://test.freee.co.jp/token');
    expect(config.oauth.authorizationEndpoint).toBe(
      'https://accounts.secure.freee.co.jp/public_api/authorize',
    );
    expect(config.server.name).toBe('freee');
  });

  it('should reflect custom freeeApiUrl in config', async () => {
    const { initRemoteConfig, getConfig } = await import('./config.js');

    initRemoteConfig({
      port: 3000,
      issuerUrl: 'https://mcp.example.com',
      jwtSecret: 'a-test-secret-that-is-at-least-32-characters-long',
      freeeClientId: 'cid',
      freeeClientSecret: 'csec',
      freeeAuthorizationEndpoint: 'https://accounts.secure.freee.co.jp/public_api/authorize',
      freeeTokenEndpoint: 'https://accounts.secure.freee.co.jp/public_api/token',
      freeeScope: 'read write',
      freeeApiUrl: 'https://staging.example.com',
      redisUrl: 'redis://localhost:6379',
    });

    const config = getConfig();
    expect(config.freee.apiUrl).toBe('https://staging.example.com');
  });
});
