import fs from 'fs/promises';
import path from 'path';
import { getConfigDir } from '../constants.js';
import { TokenData, TokenDataSchema } from './tokens.js';

// Find legacy company-specific token files (e.g., tokens-12345.json)
export async function findLegacyTokenFiles(): Promise<string[]> {
  const configDir = getConfigDir();

  try {
    const files = await fs.readdir(configDir);
    return files.filter(file => file.startsWith('tokens-') && file.endsWith('.json'));
  } catch {
    return [];
  }
}

// Try to migrate from legacy company-specific token files
export async function tryMigrateLegacyTokens(
  saveTokensFn: (tokens: TokenData) => Promise<void>
): Promise<TokenData | null> {
  const configDir = getConfigDir();

  try {
    const tokenFiles = await findLegacyTokenFiles();

    if (tokenFiles.length > 0) {
      // Use the most recent token file
      const tokenFilePath = path.join(configDir, tokenFiles[0]);
      const data = await fs.readFile(tokenFilePath, 'utf8');
      const parsed = JSON.parse(data);
      const result = TokenDataSchema.safeParse(parsed);
      if (!result.success) {
        console.error('[error] Invalid legacy token file:', result.error.message);
        return null;
      }
      const tokens = result.data;

      // Migrate to new format
      await saveTokensFn(tokens);

      // Clean up all legacy token files
      await Promise.all(
        tokenFiles.map(file =>
          fs.unlink(path.join(configDir, file)).catch((err) => {
            console.error(`[warn] Failed to clean up legacy token file ${file}:`, err);
          })
        )
      );

      console.error('[info] Migrated legacy company-specific tokens to user-based tokens');
      return tokens;
    }
  } catch (error) {
    console.error('[warn] Error during legacy token migration attempt:', error);
  }

  return null;
}

// Clear any legacy company-specific token files
export async function clearLegacyTokens(): Promise<void> {
  const configDir = getConfigDir();

  try {
    const tokenFiles = await findLegacyTokenFiles();

    await Promise.all(
      tokenFiles.map(file =>
        fs.unlink(path.join(configDir, file)).catch((err) => {
          console.error(`[warn] Failed to clear legacy token file ${file}:`, err);
        })
      )
    );

    if (tokenFiles.length > 0) {
      console.error('[info] Cleared legacy company-specific token files');
    }
  } catch (error) {
    console.error('[warn] Error during legacy token cleanup:', error);
  }
}
