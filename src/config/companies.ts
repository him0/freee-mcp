import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export interface CompanyConfig {
  id: string;
  name?: string;
  description?: string;
  addedAt: number;
  lastUsed?: number;
}

export interface FullConfig {
  // OAuth credentials
  clientId?: string;
  clientSecret?: string;
  callbackPort?: number;

  // Company settings
  defaultCompanyId: string;
  currentCompanyId: string;
  companies: Record<string, CompanyConfig>;
}

// Legacy format (for backward compatibility)
export interface LegacyCompaniesConfig {
  defaultCompanyId: string;
  currentCompanyId: string;
  companies: Record<string, CompanyConfig>;
}

function getConfigFilePath(): string {
  const configDir = path.join(os.homedir(), '.config', 'freee-mcp');
  return path.join(configDir, 'config.json');
}

async function ensureConfigDir(): Promise<void> {
  const configDir = path.dirname(getConfigFilePath());
  await fs.mkdir(configDir, { recursive: true });
}

/**
 * Check if config is legacy format (only has company info)
 */
function isLegacyConfig(data: unknown): data is LegacyCompaniesConfig {
  return (
    data !== null &&
    data !== undefined &&
    typeof data === 'object' &&
    'defaultCompanyId' in data &&
    'currentCompanyId' in data &&
    'companies' in data &&
    !('clientId' in data)
  );
}

/**
 * Migrate legacy config to new format
 */
function migrateLegacyConfig(legacy: LegacyCompaniesConfig): FullConfig {
  console.error('📦 古い設定形式を検出しました。新しい形式に移行します...');
  return {
    // Credentials will be undefined (need to be set via configure)
    clientId: undefined,
    clientSecret: undefined,
    callbackPort: undefined,
    // Keep company settings
    defaultCompanyId: legacy.defaultCompanyId,
    currentCompanyId: legacy.currentCompanyId,
    companies: legacy.companies,
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
        currentCompanyId: defaultCompanyId,
        companies: {
          [defaultCompanyId]: {
            id: defaultCompanyId,
            name: 'Default Company',
            description: 'Company from environment variable',
            addedAt: Date.now(),
            lastUsed: Date.now(),
          },
        },
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
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), { mode: 0o600 });
}

/**
 * Get current company ID
 */
export async function getCurrentCompanyId(): Promise<string> {
  const config = await loadFullConfig();
  return config.currentCompanyId;
}

/**
 * Set current company
 */
export async function setCurrentCompany(
  companyId: string,
  name?: string,
  description?: string
): Promise<void> {
  const config = await loadFullConfig();

  // Add or update company info
  if (!config.companies[companyId]) {
    config.companies[companyId] = {
      id: companyId,
      name: name || `Company ${companyId}`,
      description: description || undefined,
      addedAt: Date.now(),
    };
  } else if (name || description) {
    // Update existing company info if provided
    if (name) config.companies[companyId].name = name;
    if (description) config.companies[companyId].description = description;
  }

  // Update last used timestamp
  config.companies[companyId].lastUsed = Date.now();

  // Set as current company
  config.currentCompanyId = companyId;

  await saveFullConfig(config);
}

/**
 * Get list of all companies
 */
export async function getCompanyList(): Promise<CompanyConfig[]> {
  const config = await loadFullConfig();
  return Object.values(config.companies).sort((a, b) =>
    (b.lastUsed || 0) - (a.lastUsed || 0)
  );
}

/**
 * Get company info by ID
 */
export async function getCompanyInfo(companyId: string): Promise<CompanyConfig | null> {
  const config = await loadFullConfig();
  return config.companies[companyId] || null;
}