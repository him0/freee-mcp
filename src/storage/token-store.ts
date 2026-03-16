import type { TokenData } from '../auth/tokens.js';
import type { CompanyConfig } from '../config/companies.js';

export interface TokenStore {
  loadTokens(userId: string): Promise<TokenData | null>;
  saveTokens(userId: string, tokens: TokenData): Promise<void>;
  clearTokens(userId: string): Promise<void>;
  getValidAccessToken(userId: string): Promise<string | null>;
  getCurrentCompanyId(userId: string): Promise<string>;
  setCurrentCompany(userId: string, companyId: string, name?: string, description?: string): Promise<void>;
  getCompanyInfo(userId: string, companyId: string): Promise<CompanyConfig | null>;
}
