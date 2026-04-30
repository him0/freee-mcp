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
    // Pin a deterministic baseline for env-detection tests. vitest defaults
    // NODE_ENV to "test", but we want each test to opt in explicitly.
    process.env.NODE_ENV = 'production';
    delete process.env.KUBERNETES_SERVICE_HOST;
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
      jwtAudience: undefined,
      jwtAudienceEnforce: false,
      freeeClientId: 'test-client-id',
      freeeClientSecret: 'test-client-secret',
      freeeAuthorizationEndpoint: 'https://accounts.secure.freee.co.jp/public_api/authorize',
      freeeTokenEndpoint: 'https://accounts.secure.freee.co.jp/public_api/token',
      freeeScope: 'read write',
      freeeApiUrl: 'https://api.freee.co.jp',
      redisUrl: 'redis://localhost:6379',
      corsAllowedOrigins: undefined,
      rateLimitEnabled: true,
      logLevel: 'info',
      allowInsecureLocalhostCimd: false,
    });
  });

  describe('allowInsecureLocalhostCimd environment detection', () => {
    it('enables when NODE_ENV=development and not in Kubernetes', async () => {
      process.env.NODE_ENV = 'development';
      const { loadRemoteServerConfig } = await import('./config.js');
      expect(loadRemoteServerConfig().allowInsecureLocalhostCimd).toBe(true);
    });

    it('enables when NODE_ENV=test and not in Kubernetes', async () => {
      process.env.NODE_ENV = 'test';
      const { loadRemoteServerConfig } = await import('./config.js');
      expect(loadRemoteServerConfig().allowInsecureLocalhostCimd).toBe(true);
    });

    it('disables when NODE_ENV is unset (fail-safe)', async () => {
      delete process.env.NODE_ENV;
      const { loadRemoteServerConfig } = await import('./config.js');
      expect(loadRemoteServerConfig().allowInsecureLocalhostCimd).toBe(false);
    });

    it('disables when NODE_ENV=production', async () => {
      process.env.NODE_ENV = 'production';
      const { loadRemoteServerConfig } = await import('./config.js');
      expect(loadRemoteServerConfig().allowInsecureLocalhostCimd).toBe(false);
    });

    it('disables when running inside Kubernetes even if NODE_ENV=development', async () => {
      process.env.NODE_ENV = 'development';
      process.env.KUBERNETES_SERVICE_HOST = '10.0.0.1';
      const { loadRemoteServerConfig } = await import('./config.js');
      expect(loadRemoteServerConfig().allowInsecureLocalhostCimd).toBe(false);
    });

    it('disables when NODE_ENV is misspelled (whitelist semantics)', async () => {
      process.env.NODE_ENV = 'Development';
      const { loadRemoteServerConfig } = await import('./config.js');
      expect(loadRemoteServerConfig().allowInsecureLocalhostCimd).toBe(false);
    });

    it('warns at startup when NODE_ENV is unset outside Kubernetes', async () => {
      delete process.env.NODE_ENV;
      const stderr = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { loadRemoteServerConfig } = await import('./config.js');
      loadRemoteServerConfig();

      expect(stderr).toHaveBeenCalledWith(
        expect.stringContaining('NODE_ENV is unset outside Kubernetes'),
      );
      stderr.mockRestore();
    });

    it('warns at startup when the localhost bypass is active', async () => {
      process.env.NODE_ENV = 'development';
      const stderr = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { loadRemoteServerConfig } = await import('./config.js');
      loadRemoteServerConfig();

      expect(stderr).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost CIMD URLs are accepted'),
      );
      stderr.mockRestore();
    });
  });

  it('should default RATE_LIMIT_ENABLED to true when unset (secure-by-default)', async () => {
    delete process.env.RATE_LIMIT_ENABLED;
    const { loadRemoteServerConfig } = await import('./config.js');
    const config = loadRemoteServerConfig();

    expect(config.rateLimitEnabled).toBe(true);
  });

  it('should allow opting out via RATE_LIMIT_ENABLED=false', async () => {
    process.env.RATE_LIMIT_ENABLED = 'false';
    const { loadRemoteServerConfig } = await import('./config.js');
    const config = loadRemoteServerConfig();

    expect(config.rateLimitEnabled).toBe(false);
  });

  it('should accept boolean aliases for RATE_LIMIT_ENABLED (NO/0/off)', async () => {
    process.env.RATE_LIMIT_ENABLED = 'NO';
    const { loadRemoteServerConfig } = await import('./config.js');
    const config = loadRemoteServerConfig();

    expect(config.rateLimitEnabled).toBe(false);
  });

  it('should throw when RATE_LIMIT_ENABLED has an invalid value', async () => {
    process.env.RATE_LIMIT_ENABLED = 'maybe';
    const { loadRemoteServerConfig } = await import('./config.js');

    expect(() => loadRemoteServerConfig()).toThrow('RATE_LIMIT_ENABLED');
  });

  it('should throw when ISSUER_URL is not a valid URL', async () => {
    process.env.ISSUER_URL = 'not-a-url';
    const { loadRemoteServerConfig } = await import('./config.js');

    expect(() => loadRemoteServerConfig()).toThrow('ISSUER_URL');
  });

  it('should throw when FREEE_API_BASE_URL is not a valid URL', async () => {
    process.env.FREEE_API_BASE_URL = 'not-a-url';
    const { loadRemoteServerConfig } = await import('./config.js');

    expect(() => loadRemoteServerConfig()).toThrow('FREEE_API_BASE_URL');
  });

  it('should throw when LOG_LEVEL is not a recognised pino level', async () => {
    process.env.LOG_LEVEL = 'verbose';
    const { loadRemoteServerConfig } = await import('./config.js');

    expect(() => loadRemoteServerConfig()).toThrow('LOG_LEVEL');
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

describe('summarizeRemoteServerConfig', () => {
  it('should mask jwtSecret and freeeClientSecret in the summary', async () => {
    const { summarizeRemoteServerConfig } = await import('./config.js');
    const summary = summarizeRemoteServerConfig({
      port: 3000,
      issuerUrl: 'https://mcp.example.com',
      jwtSecret: 'a-test-secret-that-is-at-least-32-characters-long',
      freeeClientId: 'cid',
      freeeClientSecret: 'csec',
      freeeAuthorizationEndpoint: 'https://accounts.secure.freee.co.jp/public_api/authorize',
      freeeTokenEndpoint: 'https://accounts.secure.freee.co.jp/public_api/token',
      freeeScope: 'read write',
      freeeApiUrl: 'https://api.freee.co.jp',
      redisUrl: 'redis://localhost:6379',
      rateLimitEnabled: true,
      logLevel: 'info',
    });

    expect(summary.jwtSecret).toBe('<redacted>');
    expect(summary.freeeClientSecret).toBe('<redacted>');
    expect(summary.freeeClientId).toBe('cid');
    expect(summary.rateLimitEnabled).toBe(true);
  });
});

describe('parseBooleanEnv', () => {
  it.each([
    ['true', true],
    ['TRUE', true],
    ['1', true],
    ['yes', true],
    ['on', true],
    ['false', false],
    ['FALSE', false],
    ['0', false],
    ['no', false],
    ['off', false],
  ])('parses %s as %s', async (input, expected) => {
    const { parseBooleanEnv } = await import('./config.js');
    expect(parseBooleanEnv('FOO', input, !expected)).toBe(expected);
  });

  it('returns the default when value is undefined', async () => {
    const { parseBooleanEnv } = await import('./config.js');
    expect(parseBooleanEnv('FOO', undefined, true)).toBe(true);
    expect(parseBooleanEnv('FOO', undefined, false)).toBe(false);
  });

  it('returns the default when value is empty', async () => {
    const { parseBooleanEnv } = await import('./config.js');
    expect(parseBooleanEnv('FOO', '', true)).toBe(true);
  });

  it('throws on unrecognised values', async () => {
    const { parseBooleanEnv } = await import('./config.js');
    expect(() => parseBooleanEnv('FOO', 'maybe', false)).toThrow('FOO');
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
      jwtAudience: undefined,
      jwtAudienceEnforce: false,
      freeeClientId: 'cid',
      freeeClientSecret: 'csec',
      freeeAuthorizationEndpoint: 'https://accounts.secure.freee.co.jp/public_api/authorize',
      freeeTokenEndpoint: 'https://test.freee.co.jp/token',
      freeeScope: 'read write',
      freeeApiUrl: 'https://api.freee.co.jp',
      redisUrl: 'redis://localhost:6379',
      rateLimitEnabled: false,
      logLevel: 'info',
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
      jwtAudience: undefined,
      jwtAudienceEnforce: false,
      freeeClientId: 'cid',
      freeeClientSecret: 'csec',
      freeeAuthorizationEndpoint: 'https://accounts.secure.freee.co.jp/public_api/authorize',
      freeeTokenEndpoint: 'https://accounts.secure.freee.co.jp/public_api/token',
      freeeScope: 'read write',
      freeeApiUrl: 'https://staging.example.com',
      redisUrl: 'redis://localhost:6379',
      rateLimitEnabled: false,
      logLevel: 'info',
    });

    const config = getConfig();
    expect(config.freee.apiUrl).toBe('https://staging.example.com');
  });
});
