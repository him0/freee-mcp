import { saveFullConfig, type FullConfig } from '../config/companies.js';
import type { Credentials, SelectedCompany, Company } from './types.js';

export async function saveConfig(
  credentials: Credentials,
  selectedCompany: SelectedCompany,
  allCompanies: Company[],
): Promise<void> {
  const fullConfig: FullConfig = {
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    callbackPort: credentials.callbackPort,
    defaultCompanyId: String(selectedCompany.id),
    currentCompanyId: String(selectedCompany.id),
    companies: {},
  };

  allCompanies.forEach((company) => {
    fullConfig.companies[String(company.id)] = {
      id: String(company.id),
      name: company.display_name || company.name || undefined,
      description: `Role: ${company.role}`,
      addedAt: Date.now(),
      lastUsed: company.id === selectedCompany.id ? Date.now() : undefined,
    };
  });

  await saveFullConfig(fullConfig);
  console.log('設定情報を保存しました。\n');
  console.log('認証情報は ~/.config/freee-mcp/config.json に保存されました。');
  console.log('トークンは ~/.config/freee-mcp/tokens.json に保存されました。\n');
}
