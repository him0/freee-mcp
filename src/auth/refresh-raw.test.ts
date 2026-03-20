import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { refreshFreeeTokenRaw } from './tokens.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const testOAuthConfig = {
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  tokenEndpoint: 'https://test.freee.co.jp/token',
  scope: 'read write',
};

describe('refreshFreeeTokenRaw', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should refresh token without side effects', async () => {
    const refreshResponse = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      expires_in: 3600,
      token_type: 'Bearer',
      scope: 'read write',
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(refreshResponse),
    });

    const result = await refreshFreeeTokenRaw('old-refresh-token', testOAuthConfig);

    expect(result.access_token).toBe('new-access-token');
    expect(result.refresh_token).toBe('new-refresh-token');
    expect(result.token_type).toBe('Bearer');
    expect(result.scope).toBe('read write');
    expect(result.expires_at).toBeGreaterThan(Date.now());

    expect(mockFetch).toHaveBeenCalledWith('https://test.freee.co.jp/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': expect.stringMatching(/^freee-mcp\//),
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: 'old-refresh-token',
        client_id: 'test-client-id',
        client_secret: 'test-client-secret',
      }),
    });
  });

  it('should fall back to old refresh token when response does not include one', async () => {
    const refreshResponse = {
      access_token: 'new-access-token',
      expires_in: 3600,
      token_type: 'Bearer',
      scope: 'read write',
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(refreshResponse),
    });

    const result = await refreshFreeeTokenRaw('old-refresh-token', {
      clientId: 'cid',
      clientSecret: 'csec',
      tokenEndpoint: 'https://test.freee.co.jp/token',
      scope: 'read write',
    });

    expect(result.access_token).toBe('new-access-token');
    expect(result.refresh_token).toBe('old-refresh-token');
  });

  it('should throw on HTTP error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'invalid_grant' }),
    });

    await expect(
      refreshFreeeTokenRaw('bad-token', {
        clientId: 'cid',
        clientSecret: 'csec',
        tokenEndpoint: 'https://test.freee.co.jp/token',
        scope: 'read write',
      }),
    ).rejects.toThrow('Token refresh failed: 401');
  });

  it('should throw on invalid response format', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ invalid: 'response' }),
    });

    await expect(
      refreshFreeeTokenRaw('token', {
        clientId: 'cid',
        clientSecret: 'csec',
        tokenEndpoint: 'https://test.freee.co.jp/token',
        scope: 'read write',
      }),
    ).rejects.toThrow('Invalid token response format');
  });
});
