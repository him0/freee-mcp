import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from './config.js';
import { AUTH_TIMEOUT_MS } from './constants.js';

describe('config', () => {
  it('should have correct OAuth configuration', async () => {
    const config = await loadConfig();
    expect(config.oauth.redirectUri).toContain(`http://127.0.0.1:${config.oauth.callbackPort}/callback`);
    expect(config.oauth.authorizationEndpoint).toBe('https://accounts.secure.freee.co.jp/public_api/authorize');
    expect(config.oauth.tokenEndpoint).toBe('https://accounts.secure.freee.co.jp/public_api/token');
    expect(config.oauth.scope).toBe('read write');
  });

  it('should have correct server configuration', async () => {
    const config = await loadConfig();
    expect(config.server.name).toBe('freee');
    expect(config.server.version).toBe('1.0.0');
  });

  it('should have correct auth timeout', async () => {
    const config = await loadConfig();
    expect(config.auth.timeoutMs).toBe(AUTH_TIMEOUT_MS);
  });

});