import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { config } from './config.js';

describe('config', () => {
  it('should have correct OAuth configuration', () => {
    expect(config.oauth.redirectUri).toContain(`http://127.0.0.1:${config.oauth.callbackPort}/callback`);
    expect(config.oauth.authorizationEndpoint).toBe('https://accounts.secure.freee.co.jp/public_api/authorize');
    expect(config.oauth.tokenEndpoint).toBe('https://accounts.secure.freee.co.jp/public_api/token');
    expect(config.oauth.scope).toBe('read write');
  });

  it('should have correct server configuration', () => {
    expect(config.server.name).toBe('freee');
    expect(config.server.version).toBe('1.0.0');
  });

  it('should have correct auth timeout', () => {
    expect(config.auth.timeoutMs).toBe(5 * 60 * 1000);
  });

});