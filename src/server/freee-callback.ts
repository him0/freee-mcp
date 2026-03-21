import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { OAuthTokenResponseSchema } from '../auth/tokens.js';
import { createTokenData } from '../auth/token-utils.js';
import { USER_AGENT, FREEE_API_URL } from '../constants.js';
import type { OAuthStateStore } from './oauth-store.js';
import type { TokenStore } from '../storage/token-store.js';

export interface FreeeCallbackDeps {
  oauthStore: OAuthStateStore;
  tokenStore: TokenStore;
  freeeClientId: string;
  freeeClientSecret: string;
  freeeTokenEndpoint: string;
  freeeScope: string;
  freeeApiUrl?: string;
  callbackBaseUrl: string;
}

async function exchangeFreeeCode(
  code: string,
  codeVerifier: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string,
  tokenEndpoint: string,
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number; scope?: string }> {
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`freee token exchange failed: ${response.status} ${text}`);
  }

  const json: unknown = await response.json();
  const result = OAuthTokenResponseSchema.safeParse(json);
  if (!result.success) {
    throw new Error(`Invalid freee token response: ${result.error.message}`);
  }
  return {
    accessToken: result.data.access_token,
    refreshToken: result.data.refresh_token || '',
    expiresIn: result.data.expires_in,
    scope: result.data.scope,
  };
}

async function fetchFreeeUserId(accessToken: string, apiUrl: string): Promise<string> {
  const response = await fetch(`${apiUrl}/api/1/users/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`freee /users/me failed: ${response.status}`);
  }

  const data = (await response.json()) as { user?: { id?: number } };
  const userId = data.user?.id;
  if (!userId) {
    throw new Error('freee /users/me did not return user.id');
  }
  return String(userId);
}

export function createFreeeCallbackHandler(
  deps: FreeeCallbackDeps,
): (req: Request, res: Response) => void {
  const apiUrl = deps.freeeApiUrl || FREEE_API_URL;
  const callbackRedirectUri = `${deps.callbackBaseUrl}/oauth/freee-callback`;

  return (req: Request, res: Response) => {
    handleCallback(req, res, deps, apiUrl, callbackRedirectUri).catch((err: unknown) => {
      console.error('[error] freee callback error:', err);
      if (!res.headersSent) {
        res.status(500).send('Internal server error during OAuth callback');
      }
    });
  };
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

async function handleCallback(
  req: Request,
  res: Response,
  deps: FreeeCallbackDeps,
  apiUrl: string,
  callbackRedirectUri: string,
): Promise<void> {
  const code = req.query.code as string | undefined;
  const state = req.query.state as string | undefined;
  const error = req.query.error as string | undefined;

  // Handle freee OAuth error (e.g., user denied consent)
  if (error) {
    const session = state ? await deps.oauthStore.consumeSession(state) : null;
    if (!session) {
      res.status(400).send(`freee OAuth error: ${error}`);
      return;
    }

    const errorDescription =
      (req.query.error_description as string) || 'freee authentication failed';
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

  try {
    const freeeTokens = await exchangeFreeeCode(
      code,
      session.freeePkceVerifier,
      callbackRedirectUri,
      deps.freeeClientId,
      deps.freeeClientSecret,
      deps.freeeTokenEndpoint,
    );

    const userId = await fetchFreeeUserId(freeeTokens.accessToken, apiUrl);

    const tokenData = createTokenData(
      {
        access_token: freeeTokens.accessToken,
        refresh_token: freeeTokens.refreshToken,
        expires_in: freeeTokens.expiresIn,
        scope: freeeTokens.scope,
      },
      { scope: deps.freeeScope },
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
    console.error('[error] freee OAuth callback processing failed:', err);
    const redirectTarget = buildRedirectUrl(session.redirectUri, session.state, {
      error: 'server_error',
      error_description: 'Failed to complete freee authentication',
    });
    res.redirect(302, redirectTarget);
  }
}
