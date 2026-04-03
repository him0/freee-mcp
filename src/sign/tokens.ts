import fs from 'node:fs/promises';
import path from 'node:path';
import {
  CONFIG_FILE_PERMISSION,
  getConfigDir,
} from '../constants.js';
import {
  TokenDataSchema,
  OAuthTokenResponseSchema,
  type TokenData,
  refreshFreeeTokenRaw,
} from '../auth/tokens.js';
import { SIGN_OAUTH_SCOPE, SIGN_TOKEN_ENDPOINT, getSignCredentials } from './config.js';

export { OAuthTokenResponseSchema, type TokenData };
export const SignTokenDataSchema = TokenDataSchema;

function getSignTokenFilePath(): string {
  return path.join(getConfigDir(), 'sign-tokens.json');
}

export async function saveSignTokens(tokens: TokenData): Promise<void> {
  const tokenPath = getSignTokenFilePath();
  const configDir = path.dirname(tokenPath);

  try {
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(tokenPath, JSON.stringify(tokens, null, 2), {
      mode: CONFIG_FILE_PERMISSION,
    });
  } catch (error) {
    console.error('[error] Failed to save sign tokens:', error);
    throw error;
  }
}

export async function loadSignTokens(): Promise<TokenData | null> {
  const tokenPath = getSignTokenFilePath();

  try {
    const data = await fs.readFile(tokenPath, 'utf8');
    const parsed = JSON.parse(data);
    const result = SignTokenDataSchema.safeParse(parsed);
    if (!result.success) {
      console.error('[error] Invalid sign token file:', result.error.message);
      return null;
    }
    return result.data;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    // JSON parse error etc. → treat as invalid, return null
    console.error('[error] Failed to load sign tokens:', error);
    return null;
  }
}

export function isSignTokenValid(tokens: TokenData): boolean {
  return Date.now() < tokens.expires_at;
}

export async function refreshSignAccessToken(refreshToken: string): Promise<TokenData> {
  const { clientId, clientSecret } = await getSignCredentials();

  // refreshFreeeTokenRaw が 401/invalid_grant で失敗した場合は再認証誘導、それ以外は元のエラーを伝播
  const tokens = await refreshFreeeTokenRaw(refreshToken, {
    clientId,
    clientSecret,
    tokenEndpoint: SIGN_TOKEN_ENDPOINT,
    scope: SIGN_OAUTH_SCOPE,
  });
  await saveSignTokens(tokens);
  return tokens;
}

export async function getValidSignAccessToken(): Promise<string | null> {
  const tokens = await loadSignTokens();
  if (!tokens) {
    return null;
  }

  if (isSignTokenValid(tokens)) {
    return tokens.access_token;
  }

  const newTokens = await refreshSignAccessToken(tokens.refresh_token);
  return newTokens.access_token;
}

export async function clearSignTokens(): Promise<void> {
  const tokenPath = getSignTokenFilePath();

  try {
    await fs.unlink(tokenPath);
    console.error('[info] Sign tokens cleared successfully');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error('[info] No sign tokens to clear (file does not exist)');
      return;
    }
    throw error;
  }
}
