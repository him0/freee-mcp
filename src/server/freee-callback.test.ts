import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFreeeCallbackHandler } from './freee-callback.js';
import type { OAuthStateStore, OAuthSessionData } from './oauth-store.js';
import type { TokenStore } from '../storage/token-store.js';
import type { Request, Response } from 'express';

const mockSession: OAuthSessionData = {
  clientId: 'test-client',
  redirectUri: 'https://claude.ai/api/mcp/auth_callback',
  codeChallenge: 'challenge-abc',
  state: 'original-state-xyz',
  scopes: ['mcp:read', 'mcp:write'],
  freeePkceVerifier: 'freee-pkce-verifier-123',
  resource: 'https://mcp.example.com',
};

function createMockOAuthStore(session: OAuthSessionData | null = mockSession): OAuthStateStore {
  return {
    consumeSession: vi.fn(async () => session),
    saveAuthCode: vi.fn(async () => {}),
    saveSession: vi.fn(async () => {}),
    getAuthCode: vi.fn(async () => null),
    consumeAuthCode: vi.fn(async () => null),
    saveRefreshToken: vi.fn(async () => {}),
    consumeRefreshToken: vi.fn(async () => null),
    revokeRefreshToken: vi.fn(async () => {}),
  } as unknown as OAuthStateStore;
}

function createMockTokenStore(): TokenStore {
  return {
    saveTokens: vi.fn(async () => {}),
    loadTokens: vi.fn(async () => null),
    clearTokens: vi.fn(async () => {}),
    getValidAccessToken: vi.fn(async () => null),
    getCurrentCompanyId: vi.fn(async () => '0'),
    setCurrentCompany: vi.fn(async () => {}),
    getCompanyInfo: vi.fn(async () => null),
  };
}

function createMockReqRes(query: Record<string, string> = {}) {
  const req = { query } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    redirect: vi.fn(),
    headersSent: false,
  } as unknown as Response;
  return { req, res };
}

const freeeTokenResponse = {
  access_token: 'freee-access-token',
  refresh_token: 'freee-refresh-token',
  expires_in: 86400,
  token_type: 'Bearer',
  scope: 'read write',
};

const freeeUserResponse = {
  user: { id: 42, email: 'test@example.com' },
};

describe('createFreeeCallbackHandler', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('completes full OAuth callback flow', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => freeeTokenResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => freeeUserResponse,
      }) as unknown as typeof fetch;

    const oauthStore = createMockOAuthStore();
    const tokenStore = createMockTokenStore();

    const handler = createFreeeCallbackHandler({
      oauthStore,
      tokenStore,
      freeeClientId: 'freee-client-id',
      freeeClientSecret: 'freee-client-secret',
      freeeTokenEndpoint: 'https://accounts.secure.freee.co.jp/public_api/token',
      freeeScope: 'read write',
      callbackBaseUrl: 'https://mcp.example.com',
    });

    const { req, res } = createMockReqRes({ code: 'freee-auth-code', state: 'session-id' });
    handler(req, res);

    // Wait for async handler to complete
    await vi.waitFor(() => {
      expect(res.redirect).toHaveBeenCalled();
    });

    // Verify session consumed
    expect(oauthStore.consumeSession).toHaveBeenCalledWith('session-id');

    // Verify freee token exchange
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);

    // Verify tokens saved to Redis
    expect(tokenStore.saveTokens).toHaveBeenCalledWith(
      '42',
      expect.objectContaining({
        access_token: 'freee-access-token',
        refresh_token: 'freee-refresh-token',
      }),
    );

    // Verify MCP auth code saved
    expect(oauthStore.saveAuthCode).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        userId: '42',
        clientId: 'test-client',
        codeChallenge: 'challenge-abc',
      }),
    );

    // Verify redirect to AI client
    const redirectUrl = (res.redirect as ReturnType<typeof vi.fn>).mock.calls[0][1] as string;
    const parsed = new URL(redirectUrl);
    expect(parsed.origin + parsed.pathname).toBe('https://claude.ai/api/mcp/auth_callback');
    expect(parsed.searchParams.get('code')).toBeTruthy();
    expect(parsed.searchParams.get('state')).toBe('original-state-xyz');
  });

  it('returns 400 when code or state is missing', async () => {
    const handler = createFreeeCallbackHandler({
      oauthStore: createMockOAuthStore(),
      tokenStore: createMockTokenStore(),
      freeeClientId: 'id',
      freeeClientSecret: 'secret',
      freeeTokenEndpoint: 'https://token.example.com',
      freeeScope: 'read write',
      callbackBaseUrl: 'https://mcp.example.com',
    });

    const { req, res } = createMockReqRes({}); // no code or state
    handler(req, res);

    await vi.waitFor(() => {
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  it('returns 400 when session is expired', async () => {
    const handler = createFreeeCallbackHandler({
      oauthStore: createMockOAuthStore(null),
      tokenStore: createMockTokenStore(),
      freeeClientId: 'id',
      freeeClientSecret: 'secret',
      freeeTokenEndpoint: 'https://token.example.com',
      freeeScope: 'read write',
      callbackBaseUrl: 'https://mcp.example.com',
    });

    const { req, res } = createMockReqRes({ code: 'abc', state: 'expired-session' });
    handler(req, res);

    await vi.waitFor(() => {
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  it('redirects with error when freee token exchange fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'Bad Request',
    }) as unknown as typeof fetch;

    const oauthStore = createMockOAuthStore();
    const handler = createFreeeCallbackHandler({
      oauthStore,
      tokenStore: createMockTokenStore(),
      freeeClientId: 'id',
      freeeClientSecret: 'secret',
      freeeTokenEndpoint: 'https://token.example.com',
      freeeScope: 'read write',
      callbackBaseUrl: 'https://mcp.example.com',
    });

    const { req, res } = createMockReqRes({ code: 'bad-code', state: 'session-id' });
    handler(req, res);

    await vi.waitFor(() => {
      expect(res.redirect).toHaveBeenCalled();
    });

    const redirectUrl = (res.redirect as ReturnType<typeof vi.fn>).mock.calls[0][1] as string;
    const parsed = new URL(redirectUrl);
    expect(parsed.searchParams.get('error')).toBe('server_error');
    expect(parsed.searchParams.get('state')).toBe('original-state-xyz');
  });
});
