import { randomUUID } from 'node:crypto';
import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import type { Request, Response } from 'express';
import { createTokenData } from '../../auth/token-utils.js';
import { OAuthTokenResponseSchema } from '../../auth/tokens.js';
import { FETCH_TIMEOUT_TOKEN_MS, FETCH_TIMEOUT_USERINFO_MS } from '../../constants.js';
import { getLogger } from '../../server/logger.js';
import type { OAuthStateStore } from '../../server/oauth-store.js';
import { getUserAgent } from '../../server/user-agent.js';
import { SIGN_CALLBACK_PATH } from '../config.js';
import type { SignTokenStore } from './sign-redis-token-store.js';

export interface SignCallbackDeps {
  oauthStore: OAuthStateStore;
  tokenStore: SignTokenStore;
  clientStore?: OAuthRegisteredClientsStore;
  signClientId: string;
  signClientSecret: string;
  signTokenEndpoint: string;
  signScope: string;
  callbackBaseUrl: string;
}

async function exchangeSignCode(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string,
  tokenEndpoint: string,
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number; scope?: string }> {
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': getUserAgent(),
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_TOKEN_MS),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    // レスポンス本文に PII や shorter ID が含まれる可能性があるため先頭 200 文字に制限
    throw new Error(`Sign token exchange failed: ${response.status} ${text.slice(0, 200)}`);
  }

  const json: unknown = await response.json();
  const result = OAuthTokenResponseSchema.safeParse(json);
  if (!result.success) {
    throw new Error(`Invalid Sign token response: ${result.error.message}`);
  }
  return {
    accessToken: result.data.access_token,
    refreshToken: result.data.refresh_token || '',
    expiresIn: result.data.expires_in,
    scope: result.data.scope,
  };
}

async function fetchSignUserId(accessToken: string, apiUrl: string): Promise<string> {
  const response = await fetch(`${apiUrl}/v1/users/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': getUserAgent(),
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_USERINFO_MS),
  });

  if (!response.ok) {
    throw new Error(`Sign /v1/users/me failed: ${response.status}`);
  }

  const data = (await response.json()) as { id?: number };
  const userId = data.id;
  if (userId == null) {
    throw new Error('Sign /v1/users/me did not return id');
  }
  return String(userId);
}

function buildRedirectUrl(baseUri: string, state: string, params: Record<string, string>): string {
  const url = new URL(baseUri);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  if (state) {
    url.searchParams.set('state', state);
  }
  return url.toString();
}

export function createSignCallbackHandler(
  deps: SignCallbackDeps,
  signApiUrl: string,
): (req: Request, res: Response) => void {
  const callbackRedirectUri = `${deps.callbackBaseUrl}${SIGN_CALLBACK_PATH}`;

  return (req: Request, res: Response) => {
    handleSignCallback(req, res, deps, signApiUrl, callbackRedirectUri).catch((err: unknown) => {
      getLogger().error({ err }, 'Sign callback error');
      if (!res.headersSent) {
        res.status(500).send('Internal server error during Sign OAuth callback');
      }
    });
  };
}

async function handleSignCallback(
  req: Request,
  res: Response,
  deps: SignCallbackDeps,
  signApiUrl: string,
  callbackRedirectUri: string,
): Promise<void> {
  const code = req.query.code as string | undefined;
  const state = req.query.state as string | undefined;
  const error = req.query.error as string | undefined;

  if (error) {
    const session = state ? await deps.oauthStore.consumeSession(state) : null;
    if (!session) {
      res.status(400).type('text/plain').send(`Sign OAuth error: ${error}`);
      return;
    }

    const errorDescription =
      (req.query.error_description as string) || 'Sign authentication failed';
    const redirectTarget = buildRedirectUrl(session.redirectUri, session.state, {
      error,
      error_description: errorDescription,
    });
    res.redirect(302, redirectTarget);
    return;
  }

  if (!code || !state) {
    res.status(400).send('Missing code or state parameter');
    return;
  }

  const session = await deps.oauthStore.consumeSession(state);
  if (!session) {
    res.status(400).send('Invalid or expired OAuth session');
    return;
  }

  // Validate redirect_uri against registered client (defense-in-depth).
  // Wrapped in try-catch: session is already consumed above, so a Redis failure here
  // must not abort the flow — the user cannot retry without restarting OAuth.
  if (deps.clientStore) {
    try {
      const client = await deps.clientStore.getClient(session.clientId);
      if (client?.redirect_uris && !client.redirect_uris.includes(session.redirectUri)) {
        getLogger().error({ clientId: session.clientId }, 'redirect_uri mismatch');
        res.status(400).send('redirect_uri mismatch');
        return;
      }
    } catch (err) {
      getLogger().error({ clientId: session.clientId, err }, 'Failed to validate redirect_uri');
    }
  }

  try {
    const signTokens = await exchangeSignCode(
      code,
      callbackRedirectUri,
      deps.signClientId,
      deps.signClientSecret,
      deps.signTokenEndpoint,
    );

    const userId = await fetchSignUserId(signTokens.accessToken, signApiUrl);

    const tokenData = createTokenData(
      {
        access_token: signTokens.accessToken,
        refresh_token: signTokens.refreshToken,
        expires_in: signTokens.expiresIn,
        scope: signTokens.scope,
      },
      { scope: deps.signScope },
    );
    await deps.tokenStore.saveTokens(userId, tokenData);

    const mcpCode = randomUUID();
    await deps.oauthStore.saveAuthCode(mcpCode, {
      userId,
      clientId: session.clientId,
      codeChallenge: session.codeChallenge,
      scopes: session.scopes,
      redirectUri: session.redirectUri,
      resource: session.resource,
    });

    const redirectTarget = buildRedirectUrl(session.redirectUri, session.state, { code: mcpCode });
    res.redirect(302, redirectTarget);
  } catch (err) {
    getLogger().error({ err }, 'Sign OAuth callback processing failed');
    const redirectTarget = buildRedirectUrl(session.redirectUri, session.state, {
      error: 'server_error',
      error_description: 'Failed to complete Sign authentication',
    });
    res.redirect(302, redirectTarget);
  }
}
