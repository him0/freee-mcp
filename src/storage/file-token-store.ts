import type { TokenData } from '../auth/tokens.js';
import type { CompanyConfig } from '../config/companies.js';
import type { TokenStore } from './token-store.js';
import {
  loadTokens as fileLoadTokens,
  saveTokens as fileSaveTokens,
  clearTokens as fileClearTokens,
  getValidAccessToken as fileGetValidAccessToken,
} from '../auth/tokens.js';
import {
  getCurrentCompanyId as fileGetCurrentCompanyId,
  setCurrentCompany as fileSetCurrentCompany,
  getCompanyInfo as fileGetCompanyInfo,
} from '../config/companies.js';

// SECURITY: FileTokenStore ignores userId — all callers share the same local files.
// This is intentional for stdio (single-user) mode only. Do NOT use this store in
// multi-tenant environments. Use a tenant-aware TokenStore (e.g. RedisTokenStore)
// for remote / HTTP deployments where multiple users share one server process.
export class FileTokenStore implements TokenStore {
  async loadTokens(_userId: string): Promise<TokenData | null> {
    return fileLoadTokens();
  }

  async saveTokens(_userId: string, tokens: TokenData): Promise<void> {
    return fileSaveTokens(tokens);
  }

  async clearTokens(_userId: string): Promise<void> {
    return fileClearTokens();
  }

  async getValidAccessToken(_userId: string): Promise<string | null> {
    return fileGetValidAccessToken();
  }

  async getCurrentCompanyId(_userId: string): Promise<string> {
    return fileGetCurrentCompanyId();
  }

  async setCurrentCompany(_userId: string, companyId: string, name?: string, description?: string): Promise<void> {
    return fileSetCurrentCompany(companyId, name, description);
  }

  async getCompanyInfo(_userId: string, companyId: string): Promise<CompanyConfig | null> {
    return fileGetCompanyInfo(companyId);
  }
}
