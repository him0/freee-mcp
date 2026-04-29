import {
  InvalidGrantError,
  InvalidTokenError,
} from '@modelcontextprotocol/sdk/server/auth/errors.js';
import type { AuthorizationParams } from '@modelcontextprotocol/sdk/server/auth/provider.js';
import type { OAuthClientInformationFull } from '@modelcontextprotocol/sdk/shared/auth.js';
import { SignJWT } from 'jose';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { initRemoteConfig } from '../config.js';
import type { TokenStore } from '../storage/token-store.js';
import type { RedisClientStore } from './client-store.js';
import type { FreeeOAuthProviderDeps } from './oauth-provider.js';
import { FreeeOAuthProvider } from './oauth-provider.js';
import type { AuthCodeData, OAuthStateStore, RefreshTokenData } from './oauth-store.js';
import { RequestRecorder, withRequestRecorder } from './request-context.js';

const TEST_SECRET = 'test-jwt-secret-long-enough-for-hmac-signing';
const TEST_ISSUER = 'https://mcp.example.com';

const mockClient: OAuthClientInformationFull = {
  client_id: 'test-client-id',
  redirect_uris: ['https://claude.ai/api/mcp/auth_callback'],
  token_endpoint_auth_method: 'none',
};

function createMockOAuthStore(): OAuthStateStore {
  return {
    saveSession: vi.fn(async () => {}),
    consumeSession: vi.fn(async () => null),
    saveAuthCode: vi.fn(async () => {}),
    getAuthCode: vi.fn(async () => null),
    consumeAuthCode: vi.fn(async () => null),
    saveRefreshToken: vi.fn(async () => {}),
    getRefreshToken: vi.fn(async () => null),
    consumeRefreshToken: vi.fn(async () => null),
    revokeRefreshToken: vi.fn(async () => {}),
  } as unknown as OAuthStateStore;
}

function createMockClientStore(): RedisClientStore {
  return {
    getClient: vi.fn(async () => mockClient),
    registerClient: vi.fn(async (c: OAuthClientInformationFull) => c),
  } as unknown as RedisClientStore;
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

function createProvider(overrides?: Partial<FreeeOAuthProviderDeps>): {
  provider: FreeeOAuthProvider;
  oauthStore: OAuthStateStore;
  clientStore: RedisClientStore;
  tokenStore: TokenStore;
} {
  const oauthStore = createMockOAuthStore();
  const clientStore = createMockClientStore();
  const tokenStore = createMockTokenStore();

  const provider = new FreeeOAuthProvider({
    clientStore,
    oauthStore,
    tokenStore,
    jwtSecret: TEST_SECRET,
    issuerUrl: TEST_ISSUER,
    freeeClientId: 'freee-app-id',
    freeeAuthorizationEndpoint: 'https://accounts.secure.freee.co.jp/public_api/authorize',
    freeeScope: 'read write',
    callbackBaseUrl: TEST_ISSUER,
    ...overrides,
  });

  return { provider, oauthStore, clientStore, tokenStore };
}

describe('FreeeOAuthProvider', () => {
  // verifyAccessToken / issueTokens read getConfig().mcp for audience handling.
  beforeAll(() => {
    initRemoteConfig({
      port: 3000,
      issuerUrl: TEST_ISSUER,
      jwtSecret: TEST_SECRET,
      jwtAudience: undefined,
      jwtAudienceEnforce: false,
      freeeClientId: 'freee-app-id',
      freeeClientSecret: 'freee-app-secret',
      freeeAuthorizationEndpoint: 'https://accounts.secure.freee.co.jp/public_api/authorize',
      freeeTokenEndpoint: 'https://accounts.secure.freee.co.jp/public_api/token',
      freeeScope: 'read write',
      freeeApiUrl: 'https://api.freee.co.jp',
      redisUrl: 'redis://localhost:6379',
      rateLimitEnabled: false,
      logLevel: 'info',
    });
  });

  describe('clientsStore', () => {
    it('returns the client store', () => {
      const { provider, clientStore } = createProvider();
      expect(provider.clientsStore).toBe(clientStore);
    });
  });

  describe('authorize', () => {
    it('saves session and redirects to freee', async () => {
      const { provider, oauthStore } = createProvider();
      const res = { redirect: vi.fn() } as never;

      const params: AuthorizationParams = {
        state: 'client-state',
        scopes: ['mcp:read', 'mcp:write'],
        codeChallenge: 'mcp-challenge-xyz',
        redirectUri: 'https://claude.ai/api/mcp/auth_callback',
      };

      await provider.authorize(mockClient, params, res);

      // Session saved
      expect(oauthStore.saveSession).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          clientId: 'test-client-id',
          redirectUri: 'https://claude.ai/api/mcp/auth_callback',
          codeChallenge: 'mcp-challenge-xyz',
          state: 'client-state',
          scopes: ['mcp:read', 'mcp:write'],
          freeePkceVerifier: expect.any(String),
        }),
      );

      // Redirected to freee
      expect((res as { redirect: ReturnType<typeof vi.fn> }).redirect).toHaveBeenCalledWith(
        302,
        expect.stringContaining('accounts.secure.freee.co.jp'),
      );

      const redirectUrl = (res as { redirect: ReturnType<typeof vi.fn> }).redirect.mock
        .calls[0][1] as string;
      expect(redirectUrl).toContain('client_id=freee-app-id');
      expect(redirectUrl).toContain('code_challenge_method=S256');
      expect(redirectUrl).toContain('redirect_uri=');
    });
  });

  describe('challengeForAuthorizationCode', () => {
    it('returns the stored code challenge', async () => {
      const { provider, oauthStore } = createProvider();
      const codeData: AuthCodeData = {
        userId: 'user-1',
        clientId: 'test-client-id',
        codeChallenge: 'stored-challenge',
        scopes: ['mcp:read'],
        redirectUri: 'https://example.com/callback',
      };
      vi.mocked(oauthStore.getAuthCode).mockResolvedValueOnce(codeData);

      const challenge = await provider.challengeForAuthorizationCode(mockClient, 'auth-code-1');
      expect(challenge).toBe('stored-challenge');
    });

    it('throws InvalidGrantError when code not found', async () => {
      const { provider } = createProvider();

      await expect(provider.challengeForAuthorizationCode(mockClient, 'bad-code')).rejects.toThrow(
        InvalidGrantError,
      );
    });
  });

  describe('exchangeAuthorizationCode', () => {
    it('returns JWT access token and refresh token', async () => {
      const { provider, oauthStore } = createProvider();
      const codeData: AuthCodeData = {
        userId: 'user-42',
        clientId: 'test-client-id',
        codeChallenge: 'challenge',
        scopes: ['mcp:read', 'mcp:write'],
        redirectUri: 'https://example.com/callback',
      };
      vi.mocked(oauthStore.consumeAuthCode).mockResolvedValueOnce(codeData);

      const tokens = await provider.exchangeAuthorizationCode(mockClient, 'auth-code-1');

      expect(tokens.token_type).toBe('bearer');
      expect(tokens.expires_in).toBe(3600);
      expect(tokens.scope).toBe('mcp:read mcp:write');
      expect(tokens.access_token).toBeTruthy();
      expect(tokens.refresh_token).toBeTruthy();

      // Refresh token saved
      expect(oauthStore.saveRefreshToken).toHaveBeenCalledWith(
        tokens.refresh_token,
        expect.objectContaining({ userId: 'user-42', clientId: 'test-client-id' }),
      );
    });

    it('throws when code is already consumed', async () => {
      const { provider } = createProvider();

      await expect(provider.exchangeAuthorizationCode(mockClient, 'used-code')).rejects.toThrow(
        InvalidGrantError,
      );
    });

    it('throws when code was issued to a different client', async () => {
      const { provider, oauthStore } = createProvider();
      vi.mocked(oauthStore.consumeAuthCode).mockResolvedValueOnce({
        userId: 'user-42',
        clientId: 'different-client-id',
        codeChallenge: 'ch',
        scopes: ['mcp:read'],
        redirectUri: 'https://example.com/cb',
      });

      await expect(provider.exchangeAuthorizationCode(mockClient, 'stolen-code')).rejects.toThrow(
        InvalidGrantError,
      );
    });
  });

  describe('exchangeRefreshToken', () => {
    it('rotates refresh token and returns new JWT', async () => {
      const { provider, oauthStore } = createProvider();
      const refreshData: RefreshTokenData = {
        userId: 'user-42',
        clientId: 'test-client-id',
        scopes: ['mcp:read', 'mcp:write'],
      };
      vi.mocked(oauthStore.getRefreshToken).mockResolvedValueOnce(refreshData);
      vi.mocked(oauthStore.consumeRefreshToken).mockResolvedValueOnce(refreshData);

      const tokens = await provider.exchangeRefreshToken(mockClient, 'old-refresh-token');

      expect(tokens.access_token).toBeTruthy();
      expect(tokens.refresh_token).toBeTruthy();
      expect(tokens.refresh_token).not.toBe('old-refresh-token'); // rotated

      // New refresh token saved
      expect(oauthStore.saveRefreshToken).toHaveBeenCalled();
    });

    it('throws when refresh token belongs to different client (without consuming)', async () => {
      const { provider, oauthStore } = createProvider();
      vi.mocked(oauthStore.getRefreshToken).mockResolvedValueOnce({
        userId: 'user-42',
        clientId: 'different-client',
        scopes: ['mcp:read'],
      });

      await expect(provider.exchangeRefreshToken(mockClient, 'stolen-token')).rejects.toThrow(
        InvalidGrantError,
      );

      // Token NOT consumed — legitimate owner can still use it
      expect(oauthStore.consumeRefreshToken).not.toHaveBeenCalled();
    });

    it('throws when requested scopes exceed granted scopes', async () => {
      const { provider, oauthStore } = createProvider();
      vi.mocked(oauthStore.getRefreshToken).mockResolvedValueOnce({
        userId: 'user-42',
        clientId: 'test-client-id',
        scopes: ['mcp:read'],
      });

      await expect(
        provider.exchangeRefreshToken(mockClient, 'rt-1', ['mcp:read', 'admin:write']),
      ).rejects.toThrow(InvalidGrantError);

      expect(oauthStore.consumeRefreshToken).not.toHaveBeenCalled();
    });

    it('throws when refresh token is invalid', async () => {
      const { provider } = createProvider();

      await expect(provider.exchangeRefreshToken(mockClient, 'bad-token')).rejects.toThrow(
        InvalidGrantError,
      );
    });
  });

  describe('verifyAccessToken', () => {
    it('returns AuthInfo with userId and tokenStore in extra', async () => {
      const { provider, oauthStore, tokenStore } = createProvider();

      // First, get a valid token via exchange
      vi.mocked(oauthStore.consumeAuthCode).mockResolvedValueOnce({
        userId: 'user-99',
        clientId: 'test-client-id',
        codeChallenge: 'ch',
        scopes: ['mcp:read', 'mcp:write'],
        redirectUri: 'https://example.com/cb',
      });
      const tokens = await provider.exchangeAuthorizationCode(mockClient, 'code-1');

      // Now verify it
      const authInfo = await provider.verifyAccessToken(tokens.access_token);

      expect(authInfo.token).toBe(tokens.access_token);
      expect(authInfo.clientId).toBe('test-client-id');
      expect(authInfo.scopes).toEqual(['mcp:read', 'mcp:write']);
      expect(authInfo.expiresAt).toBeTypeOf('number');
      expect(authInfo.extra?.userId).toBe('user-99');
      expect(authInfo.extra?.tokenStore).toBe(tokenStore);
    });

    it('rejects a malformed (non-JWT) token as InvalidTokenError', async () => {
      const { provider } = createProvider();

      await expect(provider.verifyAccessToken('invalid-jwt')).rejects.toThrow(InvalidTokenError);
    });

    it('maps jose JWTExpired to InvalidTokenError("Token has expired")', async () => {
      const { provider } = createProvider();
      const pastTime = Math.floor(Date.now() / 1000) - 7200;
      const expiredToken = await new SignJWT({ scope: 'mcp:read', client_id: 'test-client-id' })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject('user-1')
        .setIssuer(TEST_ISSUER)
        .setIssuedAt(pastTime)
        .setExpirationTime(pastTime + 3600)
        .sign(new TextEncoder().encode(TEST_SECRET));

      await expect(provider.verifyAccessToken(expiredToken)).rejects.toThrow(
        new InvalidTokenError('Token has expired'),
      );
    });

    it('maps jose JWSSignatureVerificationFailed to InvalidTokenError', async () => {
      const { provider } = createProvider();
      const foreignToken = await new SignJWT({ scope: 'mcp:read', client_id: 'test-client-id' })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject('user-1')
        .setIssuer(TEST_ISSUER)
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(new TextEncoder().encode('different-jwt-secret-long-enough-for-hmac-signing'));

      await expect(provider.verifyAccessToken(foreignToken)).rejects.toThrow(
        new InvalidTokenError('Invalid token signature'),
      );
    });

    it('maps jose JWTClaimValidationFailed (wrong issuer) to InvalidTokenError', async () => {
      const { provider } = createProvider();
      const wrongIssuerToken = await new SignJWT({ scope: 'mcp:read', client_id: 'test-client-id' })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject('user-1')
        .setIssuer('https://wrong.example.com')
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(new TextEncoder().encode(TEST_SECRET));

      await expect(provider.verifyAccessToken(wrongIssuerToken)).rejects.toThrowError(
        InvalidTokenError,
      );
    });

    it('records auth error to the current RequestRecorder on expired token', async () => {
      const { provider } = createProvider();
      const pastTime = Math.floor(Date.now() / 1000) - 7200;
      const expiredToken = await new SignJWT({ scope: 'mcp:read', client_id: 'test-client-id' })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject('user-1')
        .setIssuer(TEST_ISSUER)
        .setIssuedAt(pastTime)
        .setExpirationTime(pastTime + 3600)
        .sign(new TextEncoder().encode(TEST_SECRET));

      const recorder = new RequestRecorder({
        request_id: 'req-1',
        source_ip: '127.0.0.1',
        method: 'POST',
        path: '/mcp',
      });

      await withRequestRecorder(recorder, async () => {
        await expect(provider.verifyAccessToken(expiredToken)).rejects.toThrow(InvalidTokenError);
      });

      const payload = recorder.buildPayload({ status: 401, duration_ms: 1 });
      expect(payload.errors).toHaveLength(1);
      expect(payload.errors[0]).toMatchObject({
        source: 'auth',
        status_code: 401,
        error_type: 'invalid_token',
      });
      expect(payload.errors[0]?.chain[0]).toMatchObject({
        name: 'JWTExpired',
        message: 'Token has expired',
      });
    });
  });

  describe('revokeToken', () => {
    it('revokes a refresh token', async () => {
      const { provider, oauthStore } = createProvider();

      await provider.revokeToken(mockClient, { token: 'rt-to-revoke' });
      expect(oauthStore.revokeRefreshToken).toHaveBeenCalledWith('rt-to-revoke');
    });
  });
});
