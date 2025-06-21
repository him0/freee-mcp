import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { config } from '../config.js';
import { getCurrentCompanyId } from '../config/companies.js';

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
  scope: string;
}

function getTokenFilePath(companyId?: string): string {
  const configDir = path.join(os.homedir(), '.config', 'freee-mcp');
  if (companyId) {
    return path.join(configDir, `tokens-${companyId}.json`);
  }
  // Legacy support for old token file
  return path.join(configDir, 'tokens.json');
}

export async function saveTokens(tokens: TokenData, companyId?: string): Promise<void> {
  const currentCompanyId = companyId || await getCurrentCompanyId();
  const tokenPath = getTokenFilePath(currentCompanyId);
  const configDir = path.dirname(tokenPath);

  try {
    console.error(`📁 Creating directory: ${configDir}`);
    await fs.mkdir(configDir, { recursive: true });
    console.error(`💾 Writing tokens for company ${currentCompanyId} to: ${tokenPath}`);
    await fs.writeFile(tokenPath, JSON.stringify(tokens, null, 2), { mode: 0o600 });
    console.error('✅ Tokens saved successfully');
  } catch (error) {
    console.error('❌ Failed to save tokens:', error);
    throw error;
  }
}

export async function loadTokens(companyId?: string): Promise<TokenData | null> {
  const currentCompanyId = companyId || await getCurrentCompanyId();
  const tokenPath = getTokenFilePath(currentCompanyId);

  try {
    const data = await fs.readFile(tokenPath, 'utf8');
    return JSON.parse(data) as TokenData;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Try legacy token file for backward compatibility
      if (companyId === undefined) {
        const legacyPath = getTokenFilePath();
        try {
          const legacyData = await fs.readFile(legacyPath, 'utf8');
          const legacyTokens = JSON.parse(legacyData) as TokenData;
          // Migrate to new format
          await saveTokens(legacyTokens, currentCompanyId);
          await fs.unlink(legacyPath); // Remove legacy file
          return legacyTokens;
        } catch {
          // Legacy file doesn't exist, return null
        }
      }
      return null;
    }
    console.error('Failed to load tokens:', error);
    throw error;
  }
}

export function isTokenValid(tokens: TokenData): boolean {
  return Date.now() < tokens.expires_at;
}

export async function refreshAccessToken(refreshToken: string, companyId?: string): Promise<TokenData> {
  const response = await fetch(config.oauth.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.freee.clientId,
      client_secret: config.freee.clientSecret,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Token refresh failed: ${response.status} ${JSON.stringify(errorData)}`);
  }

  const tokenResponse = await response.json();
  const tokens: TokenData = {
    access_token: tokenResponse.access_token,
    refresh_token: tokenResponse.refresh_token || refreshToken,
    expires_at: Date.now() + (tokenResponse.expires_in * 1000),
    token_type: tokenResponse.token_type || 'Bearer',
    scope: tokenResponse.scope || config.oauth.scope,
  };

  await saveTokens(tokens, companyId);
  return tokens;
}

export async function clearTokens(companyId?: string): Promise<void> {
  const currentCompanyId = companyId || await getCurrentCompanyId();
  const tokenPath = getTokenFilePath(currentCompanyId);

  try {
    await fs.unlink(tokenPath);
    console.error(`Tokens for company ${currentCompanyId} cleared successfully`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error(`No tokens to clear for company ${currentCompanyId} (file does not exist)`);
      return;
    }
    console.error('Failed to clear tokens:', error);
    throw error;
  }
}

export async function getValidAccessToken(companyId?: string): Promise<string | null> {
  const currentCompanyId = companyId || await getCurrentCompanyId();
  const tokens = await loadTokens(currentCompanyId);
  if (!tokens) {
    return null;
  }

  if (isTokenValid(tokens)) {
    return tokens.access_token;
  }

  try {
    const newTokens = await refreshAccessToken(tokens.refresh_token, currentCompanyId);
    return newTokens.access_token;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return null;
  }
}