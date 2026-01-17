import crypto from 'crypto';
import { getConfig } from '../config.js';
import { saveTokens, TokenData } from './tokens.js';
import { createTokenData } from './token-utils.js';
import { safeParseJson } from '../utils/error.js';

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

export async function exchangeCodeForTokens(code: string, codeVerifier: string, redirectUri: string): Promise<TokenData> {
  const cfg = getConfig();
  const response = await fetch(cfg.oauth.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
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
    const errorData = await safeParseJson(response);
    throw new Error(`Token exchange failed: ${response.status} ${JSON.stringify(errorData)}`);
  }

  const tokenResponse = await response.json();
  const tokens = createTokenData(tokenResponse, {
    scope: cfg.oauth.scope,
  });

  await saveTokens(tokens);
  return tokens;
}
