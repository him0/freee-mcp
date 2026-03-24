import { describe, expect, it, vi } from 'vitest';
import { loadConfig, parsePort } from './config.js';
import { AUTH_TIMEOUT_MS, DEFAULT_CALLBACK_PORT } from './constants.js';

describe('parsePort', () => {
  it('should return default port when value is undefined', () => {
    expect(parsePort(undefined, DEFAULT_CALLBACK_PORT)).toBe(DEFAULT_CALLBACK_PORT);
  });

  it('should parse valid string port', () => {
    expect(parsePort('8080', DEFAULT_CALLBACK_PORT)).toBe(8080);
  });

  it('should return valid number port as-is', () => {
    expect(parsePort(3000, DEFAULT_CALLBACK_PORT)).toBe(3000);
  });

  it('should accept port 1 (minimum)', () => {
    expect(parsePort(1, DEFAULT_CALLBACK_PORT)).toBe(1);
  });

  it('should accept port 65535 (maximum)', () => {
    expect(parsePort(65535, DEFAULT_CALLBACK_PORT)).toBe(65535);
  });

  it('should fallback to default for NaN string', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(parsePort('not-a-number', DEFAULT_CALLBACK_PORT)).toBe(DEFAULT_CALLBACK_PORT);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('ポートの値が不正です'));
    spy.mockRestore();
  });

  it('should fallback to default for empty string', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(parsePort('', DEFAULT_CALLBACK_PORT)).toBe(DEFAULT_CALLBACK_PORT);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should fallback to default for port 0', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(parsePort(0, DEFAULT_CALLBACK_PORT)).toBe(DEFAULT_CALLBACK_PORT);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should fallback to default for negative port', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(parsePort(-1, DEFAULT_CALLBACK_PORT)).toBe(DEFAULT_CALLBACK_PORT);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should fallback to default for port exceeding 65535', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(parsePort(70000, DEFAULT_CALLBACK_PORT)).toBe(DEFAULT_CALLBACK_PORT);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should fallback to default for floating point number', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(parsePort(3000.5, DEFAULT_CALLBACK_PORT)).toBe(DEFAULT_CALLBACK_PORT);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should use custom default port', () => {
    expect(parsePort(undefined, 3000)).toBe(3000);
  });
});

describe('config', () => {
  it('should have correct OAuth configuration', async () => {
    const config = await loadConfig();
    expect(config.oauth.redirectUri).toContain(
      `http://127.0.0.1:${config.oauth.callbackPort}/callback`,
    );
    expect(config.oauth.authorizationEndpoint).toBe(
      'https://accounts.secure.freee.co.jp/public_api/authorize',
    );
    expect(config.oauth.tokenEndpoint).toBe('https://accounts.secure.freee.co.jp/public_api/token');
    expect(config.oauth.scope).toBe('read write');
  });

  it('should have correct server configuration', async () => {
    const config = await loadConfig();
    expect(config.server.name).toBe('freee');
    expect(config.server.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('should have correct auth timeout', async () => {
    const config = await loadConfig();
    expect(config.auth.timeoutMs).toBe(AUTH_TIMEOUT_MS);
  });
});

describe('loadConfig - partial env var validation', () => {
  const originalClientId = process.env.FREEE_CLIENT_ID;
  const originalClientSecret = process.env.FREEE_CLIENT_SECRET;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original env vars
    process.env.FREEE_CLIENT_ID = originalClientId;
    process.env.FREEE_CLIENT_SECRET = originalClientSecret;
  });

  it('should throw error when only FREEE_CLIENT_ID is set', async () => {
    process.env.FREEE_CLIENT_ID = 'test-id';
    delete process.env.FREEE_CLIENT_SECRET;

    const { loadConfig: freshLoadConfig } = await import('./config.js');
    await expect(freshLoadConfig()).rejects.toThrow('FREEE_CLIENT_SECRET が設定されていません');
  });

  it('should throw error when only FREEE_CLIENT_SECRET is set', async () => {
    delete process.env.FREEE_CLIENT_ID;
    process.env.FREEE_CLIENT_SECRET = 'test-secret';

    const { loadConfig: freshLoadConfig } = await import('./config.js');
    await expect(freshLoadConfig()).rejects.toThrow('FREEE_CLIENT_ID が設定されていません');
  });

  it('should work when both env vars are set', async () => {
    process.env.FREEE_CLIENT_ID = 'test-id';
    process.env.FREEE_CLIENT_SECRET = 'test-secret';

    const { loadConfig: freshLoadConfig } = await import('./config.js');
    const config = await freshLoadConfig();
    expect(config.freee.clientId).toBe('test-id');
    expect(config.freee.clientSecret).toBe('test-secret');
  });
});
