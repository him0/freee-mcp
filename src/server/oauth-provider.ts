import { randomUUID } from 'node:crypto';
import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import {
  InvalidGrantError,
  InvalidTokenError,
} from '@modelcontextprotocol/sdk/server/auth/errors.js';
import type {
  AuthorizationParams,
  OAuthServerProvider,
} from '@modelcontextprotocol/sdk/server/auth/provider.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import type {
  OAuthClientInformationFull,
  OAuthTokenRevocationRequest,
  OAuthTokens,
} from '@modelcontextprotocol/sdk/shared/auth.js';
import type { Response } from 'express';
import { generatePKCE } from '../auth/oauth.js';
import { FREEE_CALLBACK_PATH } from '../constants.js';
import type { TokenStore } from '../storage/token-store.js';
import type { RedisClientStore } from './client-store.js';
import { makeErrorChain } from './error-serializer.js';
import { joseErrors, signAccessToken, verifyAccessToken as verifyJwt } from './jwt.js';
import type { OAuthStateStore } from './oauth-store.js';
import { getCurrentRecorder } from './request-context.js';

export interface FreeeOAuthProviderDeps {
  clientStore: RedisClientStore;
  oauthStore: OAuthStateStore;
  tokenStore: TokenStore;
  jwtSecret: string;
  issuerUrl: string;
  freeeClientId: string;
  freeeAuthorizationEndpoint: string;
  freeeScope: string;
  callbackBaseUrl: string;
}

const ACCESS_TOKEN_EXPIRES_IN = 3600;

export class FreeeOAuthProvider implements OAuthServerProvider {
  private readonly deps: FreeeOAuthProviderDeps;

  constructor(deps: FreeeOAuthProviderDeps) {
    this.deps = deps;
  }

  get clientsStore(): OAuthRegisteredClientsStore {
    return this.deps.clientStore;
  }

  async authorize(
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
    res: Response,
  ): Promise<void> {
    const sessionId = randomUUID();
    const { codeVerifier: freeePkceVerifier, codeChallenge: freeeCodeChallenge } = generatePKCE();

    await this.deps.oauthStore.saveSession(sessionId, {
      clientId: client.client_id,
      redirectUri: params.redirectUri,
      codeChallenge: params.codeChallenge,
      state: params.state || '',
      scopes: params.scopes || [],
      freeePkceVerifier,
      resource: params.resource?.href,
    });

    const freeeCallbackUri = `${this.deps.callbackBaseUrl}${FREEE_CALLBACK_PATH}`;
    const freeeParams = new URLSearchParams({
      response_type: 'code',
      client_id: this.deps.freeeClientId,
      redirect_uri: freeeCallbackUri,
      scope: this.deps.freeeScope,
      state: sessionId,
      code_challenge: freeeCodeChallenge,
      code_challenge_method: 'S256',
    });

    res.redirect(302, `${this.deps.freeeAuthorizationEndpoint}?${freeeParams.toString()}`);
  }

  async challengeForAuthorizationCode(
    _client: OAuthClientInformationFull,
    authorizationCode: string,
  ): Promise<string> {
    const codeData = await this.deps.oauthStore.getAuthCode(authorizationCode);
    if (!codeData) {
      throw new InvalidGrantError('Authorization code not found or expired');
    }
    return codeData.codeChallenge;
  }

  async exchangeAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
    _codeVerifier?: string,
    _redirectUri?: string,
    _resource?: URL,
  ): Promise<OAuthTokens> {
    const codeData = await this.deps.oauthStore.consumeAuthCode(authorizationCode);
    if (!codeData) {
      throw new InvalidGrantError('Authorization code not found or already used');
    }

    if (codeData.clientId !== client.client_id) {
      throw new InvalidGrantError('Authorization code was not issued to this client');
    }

    return this.issueTokens(codeData.userId, client.client_id, codeData.scopes);
  }

  async exchangeRefreshToken(
    client: OAuthClientInformationFull,
    refreshToken: string,
    scopes?: string[],
    _resource?: URL,
  ): Promise<OAuthTokens> {
    // Read first (non-destructive) to validate before consuming
    const tokenData = await this.deps.oauthStore.getRefreshToken(refreshToken);
    if (!tokenData) {
      throw new InvalidGrantError('Invalid or expired refresh token');
    }

    if (tokenData.clientId !== client.client_id) {
      throw new InvalidGrantError('Refresh token was issued to a different client');
    }

    if (scopes && !scopes.every((s) => tokenData.scopes.includes(s))) {
      throw new InvalidGrantError('Requested scopes exceed originally granted scopes');
    }

    // Consume only after validation passes
    const consumed = await this.deps.oauthStore.consumeRefreshToken(refreshToken);
    if (!consumed) {
      throw new InvalidGrantError('Refresh token already used');
    }

    const grantedScopes = scopes || tokenData.scopes;

    return this.issueTokens(tokenData.userId, client.client_id, grantedScopes);
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    let payload: Awaited<ReturnType<typeof verifyJwt>>;
    try {
      payload = await verifyJwt(token, this.deps.jwtSecret, this.deps.issuerUrl);
    } catch (err) {
      const mapped = mapJoseErrorToInvalidToken(err);
      if (mapped) {
        // Explicitly record so the canonical log surfaces the real jose cause
        // instead of the PR #392 `UnrecordedError` safety net fallback.
        getCurrentRecorder()?.recordError({
          source: 'auth',
          status_code: 401,
          error_type: 'invalid_token',
          chain: makeErrorChain(
            err instanceof Error ? err.name : 'UnknownJoseError',
            mapped.message,
          ),
        });
        throw mapped;
      }
      throw err;
    }
    return {
      token,
      clientId: payload.client_id,
      scopes: payload.scope.split(' '),
      expiresAt: payload.exp,
      extra: {
        userId: payload.sub,
        tokenStore: this.deps.tokenStore,
      },
    };
  }

  async revokeToken(
    _client: OAuthClientInformationFull,
    request: OAuthTokenRevocationRequest,
  ): Promise<void> {
    await this.deps.oauthStore.revokeRefreshToken(request.token);
  }

  private async issueTokens(
    userId: string,
    clientId: string,
    scopes: string[],
  ): Promise<OAuthTokens> {
    const scope = scopes.join(' ');
    const jwt = await signAccessToken(
      { sub: userId, scope, clientId },
      this.deps.jwtSecret,
      this.deps.issuerUrl,
    );

    const refreshToken = randomUUID();
    await this.deps.oauthStore.saveRefreshToken(refreshToken, {
      userId,
      clientId,
      scopes,
    });

    return {
      access_token: jwt,
      token_type: 'bearer',
      expires_in: ACCESS_TOKEN_EXPIRES_IN,
      scope,
      refresh_token: refreshToken,
    };
  }
}

// jose throws its own error classes that the MCP SDK bearerAuth middleware
// does not recognize, so we translate the common token-validity failures into
// `InvalidTokenError` to produce a spec-compliant 401 + WWW-Authenticate
// response. See issue #394.
function mapJoseErrorToInvalidToken(err: unknown): InvalidTokenError | null {
  if (err instanceof joseErrors.JWTExpired) {
    return new InvalidTokenError('Token has expired');
  }
  if (err instanceof joseErrors.JWSSignatureVerificationFailed) {
    return new InvalidTokenError('Invalid token signature');
  }
  if (err instanceof joseErrors.JWTInvalid || err instanceof joseErrors.JWSInvalid) {
    return new InvalidTokenError('Malformed token');
  }
  if (err instanceof joseErrors.JWTClaimValidationFailed) {
    return new InvalidTokenError(`Invalid token claim: ${err.message}`);
  }
  return null;
}
