import { type FullConfig, saveFullConfig } from '../config/companies.js';
import { getConfigDir } from '../constants.js';
import type { Company, Credentials, SelectedCompany } from './types.js';

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
  const configDir = getConfigDir();
  console.log('設定情報を保存しました。\n');
  console.log(`認証情報は ${configDir}/config.json に保存されました。`);
  console.log(`トークンは ${configDir}/tokens.json に保存されました。\n`);
}
