import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { config } from '../config.js';
import { CONFIG_FILE_PERMISSION } from '../constants.js';

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
  scope: string;
}

function getTokenFilePath(): string {
  const configDir = path.join(os.homedir(), '.config', 'freee-mcp');
  return path.join(configDir, 'tokens.json');
}

function getLegacyTokenFilePath(companyId: string): string {
  const configDir = path.join(os.homedir(), '.config', 'freee-mcp');
  return path.join(configDir, `tokens-${companyId}.json`);
}

export async function saveTokens(tokens: TokenData): Promise<void> {
  const tokenPath = getTokenFilePath();
  const configDir = path.dirname(tokenPath);

  try {
    console.error(`[tokens] Creating directory: ${configDir}`);
    await fs.mkdir(configDir, { recursive: true });
    console.error(`[tokens] Writing tokens to: ${tokenPath}`);
    await fs.writeFile(tokenPath, JSON.stringify(tokens, null, 2), { mode: CONFIG_FILE_PERMISSION });
    console.error('[tokens] Tokens saved successfully');
  } catch (error) {
    console.error('[tokens] Failed to save tokens:', error);
    throw error;
  }
}

export async function loadTokens(): Promise<TokenData | null> {
  const tokenPath = getTokenFilePath();

  try {
    const data = await fs.readFile(tokenPath, 'utf8');
    return JSON.parse(data) as TokenData;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Try to migrate from legacy company-specific token files
      const legacyTokens = await tryMigrateLegacyTokens();
      if (legacyTokens) {
        return legacyTokens;
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

async function tryMigrateLegacyTokens(): Promise<TokenData | null> {
  // Try to find and migrate legacy company-specific token files
  const configDir = path.join(os.homedir(), '.config', 'freee-mcp');
  
  try {
    const files = await fs.readdir(configDir);
    const tokenFiles = files.filter(file => file.startsWith('tokens-') && file.endsWith('.json'));
    
    if (tokenFiles.length > 0) {
      // Use the most recent token file
      const tokenFilePath = path.join(configDir, tokenFiles[0]);
      const data = await fs.readFile(tokenFilePath, 'utf8');
      const tokens = JSON.parse(data) as TokenData;
      
      // Migrate to new format
      await saveTokens(tokens);
      
      // Clean up all legacy token files
      await Promise.all(
        tokenFiles.map(file =>
          fs.unlink(path.join(configDir, file)).catch((err) => {
            console.error(`[tokens] Failed to clean up legacy token file ${file}:`, err);
          })
        )
      );
      
      console.error('[tokens] Migrated legacy company-specific tokens to user-based tokens');
      return tokens;
    }
  } catch (error) {
    console.error('[tokens] Error during legacy token migration attempt:', error);
  }

  return null;
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenData> {
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

  await saveTokens(tokens);
  return tokens;
}

export async function clearTokens(): Promise<void> {
  const tokenPath = getTokenFilePath();

  try {
    await fs.unlink(tokenPath);
    console.error('Tokens cleared successfully');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error('No tokens to clear (file does not exist)');
      return;
    }
    console.error('Failed to clear tokens:', error);
    throw error;
  }
  
  // Also try to clear any legacy company-specific token files
  await clearLegacyTokens();
}

async function clearLegacyTokens(): Promise<void> {
  const configDir = path.join(os.homedir(), '.config', 'freee-mcp');
  
  try {
    const files = await fs.readdir(configDir);
    const tokenFiles = files.filter(file => file.startsWith('tokens-') && file.endsWith('.json'));
    
    await Promise.all(
      tokenFiles.map(file =>
        fs.unlink(path.join(configDir, file)).catch((err) => {
          console.error(`[tokens] Failed to clear legacy token file ${file}:`, err);
        })
      )
    );
    
    if (tokenFiles.length > 0) {
      console.error('[tokens] Cleared legacy company-specific token files');
    }
  } catch (error) {
    console.error('[tokens] Error during legacy token cleanup:', error);
  }
}

export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await loadTokens();
  if (!tokens) {
    return null;
  }

  if (isTokenValid(tokens)) {
    return tokens.access_token;
  }

  try {
    const newTokens = await refreshAccessToken(tokens.refresh_token);
    return newTokens.access_token;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return null;
  }
}