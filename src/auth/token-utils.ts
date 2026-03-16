import type { TokenData } from './tokens.js';

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type?: string;
  scope?: string;
}

export interface TokenFallbacks {
  refreshToken?: string;
  scope: string;
}

export function createTokenData(
  response: TokenResponse,
  fallbacks: TokenFallbacks
): TokenData {
  const refreshToken = response.refresh_token || fallbacks.refreshToken;
  if (!refreshToken) {
    throw new Error(
      'No refresh_token available. The token response did not include a refresh_token and no fallback was provided. Please re-authenticate.'
    );
  }
  return {
    access_token: response.access_token,
    refresh_token: refreshToken,
    expires_at: Date.now() + response.expires_in * 1000,
    token_type: response.token_type || 'Bearer',
    scope: response.scope || fallbacks.scope,
  };
}
