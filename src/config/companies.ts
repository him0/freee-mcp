import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { CONFIG_FILE_PERMISSION, getConfigDir } from '../constants.js';

export interface FullConfig {
  // OAuth credentials
  clientId?: string;
  clientSecret?: string;
  callbackPort?: number;

  // Company settings
  defaultCompanyId: string;

  // Download settings
  downloadDir?: string;
}

// Legacy format (for backward compatibility)
interface LegacyConfig {
  defaultCompanyId: string;
  currentCompanyId?: string;
  companies?: Record<string, unknown>;
  clientId?: string;
  clientSecret?: string;
  callbackPort?: number;
  downloadDir?: string;
}

function getConfigFilePath(): string {
  return path.join(getConfigDir(), 'config.json');
}

async function ensureConfigDir(): Promise<void> {
  const configDir = path.dirname(getConfigFilePath());
  await fs.mkdir(configDir, { recursive: true });
}

/**
 * Check if config is legacy format (has currentCompanyId or companies)
 */
function isLegacyConfig(data: unknown): data is LegacyConfig {
  return (
    data !== null &&
    data !== undefined &&
    typeof data === 'object' &&
    ('currentCompanyId' in data || 'companies' in data)
  );
}

/**
 * Migrate legacy config to new format (remove currentCompanyId and companies)
 */
function migrateLegacyConfig(legacy: LegacyConfig): FullConfig {
  console.error('📦 古い設定形式を検出しました。新しい形式に移行します...');
  return {
    clientId: legacy.clientId,
    clientSecret: legacy.clientSecret,
    callbackPort: legacy.callbackPort,
    defaultCompanyId: legacy.defaultCompanyId || legacy.currentCompanyId || '0',
    downloadDir: legacy.downloadDir,
  };
}

/**
 * Load full config from file
 */
export async function loadFullConfig(): Promise<FullConfig> {
  const configPath = getConfigFilePath();

  try {
    const data = await fs.readFile(configPath, 'utf8');
    const parsed = JSON.parse(data);

    // Check if legacy format and migrate
    if (isLegacyConfig(parsed)) {
      const migrated = migrateLegacyConfig(parsed);
      await saveFullConfig(migrated);
      return migrated;
    }

    return parsed as FullConfig;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Create default config
      const defaultCompanyId = process.env.FREEE_DEFAULT_COMPANY_ID || '0';
      const defaultConfig: FullConfig = {
        clientId: undefined,
        clientSecret: undefined,
        callbackPort: undefined,
        defaultCompanyId,
      };
      await saveFullConfig(defaultConfig);
      return defaultConfig;
    }
    throw error;
  }
}

/**
 * Save full config to file
 */
export async function saveFullConfig(config: FullConfig): Promise<void> {
  await ensureConfigDir();
  const configPath = getConfigFilePath();
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), { mode: CONFIG_FILE_PERMISSION });
}

/**
 * Get default company ID
 */
export async function getDefaultCompanyId(): Promise<string> {
  const config = await loadFullConfig();
  return config.defaultCompanyId;
}

/**
 * Set default company ID
 */
export async function setDefaultCompanyId(companyId: string): Promise<void> {
  const config = await loadFullConfig();
  config.defaultCompanyId = companyId;
  await saveFullConfig(config);
}

/**
 * Get download directory for binary files
 * Returns configured directory or system temp directory as default
 */
export async function getDownloadDir(): Promise<string> {
  const config = await loadFullConfig();
  return config.downloadDir || os.tmpdir();
}

/**
 * Set download directory for binary files
 */
export async function setDownloadDir(dir: string): Promise<void> {
  const config = await loadFullConfig();
  config.downloadDir = dir;
  await saveFullConfig(config);
}
