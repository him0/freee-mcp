import crypto from 'crypto';
import { config } from '../config.js';
import { TokenData, saveTokens } from './tokens.js';

export function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

export function buildAuthUrl(codeChallenge: string, state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.freee.clientId,
    redirect_uri: redirectUri,
    scope: config.oauth.scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `${config.oauth.authorizationEndpoint}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string, codeVerifier: string, redirectUri: string): Promise<TokenData> {
  const response = await fetch(config.oauth.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.freee.clientId,
      client_secret: config.freee.clientSecret,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Token exchange failed: ${response.status} ${JSON.stringify(errorData)}`);
  }

  const tokenResponse = await response.json();
  const tokens: TokenData = {
    access_token: tokenResponse.access_token,
    refresh_token: tokenResponse.refresh_token,
    expires_at: Date.now() + (tokenResponse.expires_in * 1000),
    token_type: tokenResponse.token_type || 'Bearer',
    scope: tokenResponse.scope || config.oauth.scope,
  };

  await saveTokens(tokens);
  return tokens;
}
