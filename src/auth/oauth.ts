import crypto from 'node:crypto';
import { getConfig } from '../config.js';
import { getUserAgent } from '../server/user-agent.js';
import { formatResponseErrorInfo } from '../utils/error.js';
import { createTokenData } from './token-utils.js';
import { OAuthTokenResponseSchema, saveTokens, type TokenData } from './tokens.js';

export function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

export function buildAuthUrl(codeChallenge: string, state: string, redirectUri: string): string {
  const cfg = getConfig();
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: cfg.freee.clientId,
    redirect_uri: redirectUri,
    scope: cfg.oauth.scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `${cfg.oauth.authorizationEndpoint}?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<TokenData> {
  const cfg = getConfig();
  const response = await fetch(cfg.oauth.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': getUserAgent(),
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: cfg.freee.clientId,
      client_secret: cfg.freee.clientSecret,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const errorInfo = await formatResponseErrorInfo(response);
    throw new Error(`Token exchange failed: ${response.status} ${errorInfo}`);
  }

  const jsonData: unknown = await response.json();
  const parseResult = OAuthTokenResponseSchema.safeParse(jsonData);
  if (!parseResult.success) {
    throw new Error(`Invalid token response format: ${parseResult.error.message}`);
  }
  const tokens = createTokenData(parseResult.data, {
    scope: cfg.oauth.scope,
  });

  await saveTokens(tokens);
  return tokens;
}
