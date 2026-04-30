import { randomUUID } from 'node:crypto';
import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import { InvalidGrantError } from '@modelcontextprotocol/sdk/server/auth/errors.js';
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
import type { RedisClientStore } from '../../server/client-store.js';
import { signAccessToken, verifyAccessToken as verifyJwt } from '../../server/jwt.js';
import type { OAuthStateStore } from '../../server/oauth-store.js';
import { SIGN_CALLBACK_PATH } from '../config.js';
import type { SignTokenStore } from './sign-redis-token-store.js';

export interface SignOAuthProviderDeps {
  clientStore: RedisClientStore;
  oauthStore: OAuthStateStore;
  tokenStore: SignTokenStore;
  jwtSecret: string;
  issuerUrl: string;
  signClientId: string;
  signAuthorizationEndpoint: string;
  signScope: string;
  callbackBaseUrl: string;
}

const ACCESS_TOKEN_EXPIRES_IN = 3600;

export class SignOAuthProvider implements OAuthServerProvider {
  private readonly deps: SignOAuthProviderDeps;

  constructor(deps: SignOAuthProviderDeps) {
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

    // Sign は PKCE 非対応。callback で読まれないため空文字列で型を通すだけ
    await this.deps.oauthStore.saveSession(sessionId, {
      clientId: client.client_id,
      redirectUri: params.redirectUri,
      codeChallenge: params.codeChallenge,
      state: params.state || '',
      scopes: params.scopes || [],
      freeePkceVerifier: '',
      resource: params.resource?.href,
    });

    const signCallbackUri = `${this.deps.callbackBaseUrl}${SIGN_CALLBACK_PATH}`;
    const signParams = new URLSearchParams({
      response_type: 'code',
      client_id: this.deps.signClientId,
      redirect_uri: signCallbackUri,
      scope: this.deps.signScope,
      state: sessionId,
    });

    res.redirect(302, `${this.deps.signAuthorizationEndpoint}?${signParams.toString()}`);
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
    // Sign tokens omit audience enforcement; verify accepts any `aud`.
    const payload = await verifyJwt(token, this.deps.jwtSecret, this.deps.issuerUrl, undefined);
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
    // Sign tokens use the issuer URL as a self-audience (defense in depth).
    const jwt = await signAccessToken(
      { sub: userId, scope, clientId },
      this.deps.jwtSecret,
      this.deps.issuerUrl,
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
