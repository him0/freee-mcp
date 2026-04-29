import { randomUUID } from 'node:crypto';
import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import type { Request, Response } from 'express';
import { createTokenData } from '../auth/token-utils.js';
import { OAuthTokenResponseSchema } from '../auth/tokens.js';
import {
  FETCH_TIMEOUT_TOKEN_MS,
  FETCH_TIMEOUT_USERINFO_MS,
  FREEE_API_URL,
  FREEE_CALLBACK_PATH,
} from '../constants.js';
import type { TokenStore } from '../storage/token-store.js';
import { getLogger } from './logger.js';
import type { OAuthStateStore } from './oauth-store.js';
import { getUserAgent } from './user-agent.js';

export interface FreeeCallbackDeps {
  oauthStore: OAuthStateStore;
  tokenStore: TokenStore;
  clientStore?: OAuthRegisteredClientsStore;
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
      'User-Agent': getUserAgent(),
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      client_id: clientId,
      client_secret: clientSecret,
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_TOKEN_MS),
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
      'User-Agent': getUserAgent(),
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_USERINFO_MS),
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

async function fetchFirstCompany(
  accessToken: string,
  apiUrl: string,
): Promise<{ id: number; name?: string | null } | null> {
  // Try accounting API first
  try {
    const response = await fetch(`${apiUrl}/api/1/companies`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': getUserAgent(),
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_USERINFO_MS),
    });

    if (response.ok) {
      const data = (await response.json()) as {
        companies?: Array<{ id: number; name?: string | null }>;
      };
      const first = data.companies?.[0];
      if (first) {
        return first;
      }
    }
  } catch {
    // Fall through to HR API
  }

  // Fall back to HR API (for HR-only users)
  try {
    const response = await fetch(`${apiUrl}/hr/api/v1/users/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': getUserAgent(),
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_USERINFO_MS),
    });

    if (response.ok) {
      const data = (await response.json()) as {
        companies?: Array<{ id: number; name?: string | null }>;
      };
      const first = data.companies?.[0];
      if (first) {
        return first;
      }
    }
  } catch {
    // Both APIs failed
  }

  return null;
}

async function setDefaultCompanyIfNeeded(
  accessToken: string,
  apiUrl: string,
  userId: string,
  tokenStore: TokenStore,
): Promise<void> {
  const currentCompanyId = await tokenStore.getCurrentCompanyId(userId);
  if (currentCompanyId !== '0') {
    return;
  }

  try {
    const firstCompany = await fetchFirstCompany(accessToken, apiUrl);
    if (!firstCompany) {
      return;
    }

    await tokenStore.setCurrentCompany(
      userId,
      String(firstCompany.id),
      firstCompany.name ?? undefined,
    );
    getLogger().info(
      { userId, companyId: firstCompany.id, companyName: firstCompany.name },
      'Default company set automatically',
    );
  } catch (err) {
    getLogger().warn({ err }, 'Failed to set default company (non-critical)');
  }
}

export function createFreeeCallbackHandler(
  deps: FreeeCallbackDeps,
): (req: Request, res: Response) => void {
  const apiUrl = deps.freeeApiUrl || FREEE_API_URL;
  const callbackRedirectUri = `${deps.callbackBaseUrl}${FREEE_CALLBACK_PATH}`;

  return (req: Request, res: Response) => {
    handleCallback(req, res, deps, apiUrl, callbackRedirectUri).catch((err: unknown) => {
      getLogger().error({ err }, 'freee callback error');
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
      res.status(400).type('text/plain').send(`freee OAuth error: ${error}`);
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

  // Validate redirect_uri against registered client (defense-in-depth).
  // Fail-closed on validation errors: any exception during lookup (e.g. Redis failure)
  // results in a 400 response so a malformed/unverifiable redirect_uri can never bypass
  // the check. Trade-off: the session is already consumed above, so the user must restart
  // the OAuth flow — accepted security cost vs. a potential validation bypass.
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
      res.status(400).send('redirect_uri validation failed');
      return;
    }
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

    await setDefaultCompanyIfNeeded(freeeTokens.accessToken, apiUrl, userId, deps.tokenStore);

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
    getLogger().error({ err }, 'freee OAuth callback processing failed');
    const redirectTarget = buildRedirectUrl(session.redirectUri, session.state, {
      error: 'server_error',
      error_description: 'Failed to complete freee authentication',
    });
    res.redirect(302, redirectTarget);
  }
}
