import {
  SIGN_AUTHORIZATION_ENDPOINT,
  SIGN_OAUTH_SCOPE,
  SIGN_TOKEN_ENDPOINT,
  getSignCredentials,
} from './config.js';
import { OAuthTokenResponseSchema, saveSignTokens, type TokenData } from './tokens.js';
import { USER_AGENT } from '../constants.js';
import { formatResponseErrorInfo } from '../utils/error.js';
import { createTokenData } from '../auth/token-utils.js';

export function buildSignAuthUrl(state: string, redirectUri: string, clientId: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: SIGN_OAUTH_SCOPE,
    state,
  });

  return `${SIGN_AUTHORIZATION_ENDPOINT}?${params.toString()}`;
}

export async function exchangeSignCodeForTokens(
  code: string,
  redirectUri: string,
): Promise<TokenData> {
  const { clientId, clientSecret } = await getSignCredentials();

  const response = await fetch(SIGN_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
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
    scope: SIGN_OAUTH_SCOPE,
  });

  await saveSignTokens(tokens);
  return tokens;
}
