import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { config } from '../config.js';

export interface CompanyConfig {
  id: string;
  name?: string;
  description?: string;
  addedAt: number;
  lastUsed?: number;
}

export interface CompaniesConfig {
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

export async function loadCompaniesConfig(): Promise<CompaniesConfig> {
  const configPath = getConfigFilePath();

  try {
    const data = await fs.readFile(configPath, 'utf8');
    return JSON.parse(data) as CompaniesConfig;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Create default config with environment variable company ID
      const defaultCompanyId = config.freee.companyId || '0';
      const defaultConfig: CompaniesConfig = {
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
      await saveCompaniesConfig(defaultConfig);
      return defaultConfig;
    }
    throw error;
  }
}

export async function saveCompaniesConfig(config: CompaniesConfig): Promise<void> {
  await ensureConfigDir();
  const configPath = getConfigFilePath();
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export async function getCurrentCompanyId(): Promise<string> {
  const config = await loadCompaniesConfig();
  return config.currentCompanyId;
}

export async function setCurrentCompany(
  companyId: string,
  name?: string,
  description?: string
): Promise<void> {
  const config = await loadCompaniesConfig();
  
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
  
  await saveCompaniesConfig(config);
}

export async function getCompanyList(): Promise<CompanyConfig[]> {
  const config = await loadCompaniesConfig();
  return Object.values(config.companies).sort((a, b) => 
    (b.lastUsed || 0) - (a.lastUsed || 0)
  );
}

export async function getCompanyInfo(companyId: string): Promise<CompanyConfig | null> {
  const config = await loadCompaniesConfig();
  return config.companies[companyId] || null;
}