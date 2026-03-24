import fs from 'node:fs/promises';
import path from 'node:path';
import { stopCallbackServer } from '../auth/server.js';
import { clearTokens } from '../auth/tokens.js';
import { getConfigDir, PACKAGE_VERSION } from '../constants.js';
import { saveConfig } from './configuration.js';
import { performOAuth } from './oauth-flow.js';
import { collectCredentials, configureMcpIntegration, selectCompany } from './prompts.js';

export interface ConfigureOptions {
  force?: boolean;
}

async function clearConfig(): Promise<void> {
  const configPath = path.join(getConfigDir(), 'config.json');
  try {
    await fs.unlink(configPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

export async function configure(options: ConfigureOptions = {}): Promise<void> {
  console.log(`\n=== freee-mcp v${PACKAGE_VERSION} Configuration Setup ===\n`);

  if (options.force) {
    console.log('保存済みのログイン情報をリセットしています...');
    await clearTokens();
    await clearConfig();
    console.log('リセットが完了しました。\n');
  }

  console.log('このウィザードでは、freee-mcpの設定と認証を対話式で行います。');
  console.log('freee OAuth認証情報が必要です。\n');

  try {
    const credentials = await collectCredentials();
    const oauthResult = await performOAuth();
    const { selected: selectedCompany, all: allCompanies } = await selectCompany(
      oauthResult.accessToken,
    );
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
