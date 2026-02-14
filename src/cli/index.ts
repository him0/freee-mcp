import { stopCallbackServer } from '../auth/server.js';
import { collectCredentials, selectCompany, configureMcpIntegration } from './prompts.js';
import { performOAuth } from './oauth-flow.js';
import { saveConfig } from './configuration.js';

export async function configure(): Promise<void> {
  console.log('\n=== freee-mcp Configuration Setup ===\n');
  console.log('このウィザードでは、freee-mcpの設定と認証を対話式で行います。');
  console.log('freee OAuth認証情報が必要です。\n');

  try {
    const credentials = await collectCredentials();
    const oauthResult = await performOAuth();
    const { selected: selectedCompany, all: allCompanies } = await selectCompany(oauthResult.accessToken);
    await saveConfig(credentials, selectedCompany, allCompanies);
    await configureMcpIntegration();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\nError: ${error.message}`);
    } else {
      console.error('\n設定中にエラーが発生しました:', error);
    }
    process.exit(1);
  } finally {
    stopCallbackServer();
  }
}
