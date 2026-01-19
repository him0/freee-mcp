import prompts from 'prompts';
import {
  checkMcpConfigStatus,
  addFreeeMcpConfig,
  removeFreeeMcpConfig,
  getTargetDisplayName,
  type McpTarget,
} from '../config/mcp-config.js';
import { DEFAULT_CALLBACK_PORT } from '../constants.js';
import type { Credentials, SelectedCompany, Company } from './types.js';
import { fetchCompanies } from './api-client.js';

export async function collectCredentials(): Promise<Credentials> {
  const existingConfig = await import('../config/companies.js').then((m) => m.loadFullConfig());
  const hasExistingCredentials = !!(existingConfig.clientId && existingConfig.clientSecret);

  if (hasExistingCredentials) {
    console.log('既存の設定が見つかりました。');
    console.log('  変更しない項目はそのまま Enter を押してください。\n');
  }

  console.log('ステップ 1/3: OAuth認証情報の入力\n');

  const credentials = await prompts([
    {
      type: 'text',
      name: 'clientId',
      message: 'FREEE_CLIENT_ID:',
      initial: existingConfig.clientId || undefined,
      validate: (value: string): string | boolean =>
        value.trim() ? true : 'CLIENT_ID は必須です',
    },
    {
      type: 'password',
      name: 'clientSecret',
      message: hasExistingCredentials
        ? 'FREEE_CLIENT_SECRET (変更しない場合は空欄):'
        : 'FREEE_CLIENT_SECRET:',
      validate: (value: string): string | boolean => {
        if (hasExistingCredentials && !value.trim()) {
          return true;
        }
        return value.trim() ? true : 'CLIENT_SECRET は必須です';
      },
    },
    {
      type: 'text',
      name: 'callbackPort',
      message: 'FREEE_CALLBACK_PORT:',
      initial: String(existingConfig.callbackPort || DEFAULT_CALLBACK_PORT),
    },
  ]);

  if (!credentials.clientId) {
    throw new Error('セットアップがキャンセルされました。');
  }

  const clientId = credentials.clientId.trim();
  const clientSecret = credentials.clientSecret.trim() || existingConfig.clientSecret;
  const callbackPort = parseInt(credentials.callbackPort.trim(), 10);

  if (!clientSecret) {
    throw new Error('CLIENT_SECRET は必須です。');
  }

  process.env.FREEE_CLIENT_ID = clientId;
  process.env.FREEE_CLIENT_SECRET = clientSecret;
  process.env.FREEE_CALLBACK_PORT = String(callbackPort);

  console.log('\n認証情報を受け取りました。\n');

  return { clientId, clientSecret, callbackPort };
}

export async function selectCompany(accessToken: string): Promise<{ selected: SelectedCompany; all: Company[] }> {
  console.log('ステップ 3/3: デフォルト事業所の選択\n');
  console.log('事業所一覧を取得中...');

  const companies = await fetchCompanies(accessToken);

  if (companies.length === 0) {
    throw new Error('利用可能な事業所がありません。');
  }

  const companySelection = await prompts({
    type: 'select',
    name: 'companyId',
    message: 'デフォルトの事業所を選択してください:',
    choices: companies.map((company) => ({
      title: `${company.display_name || company.name} (ID: ${company.id}) - ${company.role}`,
      value: company.id,
    })),
  });

  if (!companySelection.companyId) {
    throw new Error('セットアップがキャンセルされました。');
  }

  const selectedCompany = companies.find((c) => c.id === companySelection.companyId);

  if (!selectedCompany) {
    throw new Error(`選択した事業所が見つかりません: ID ${companySelection.companyId}`);
  }

  console.log(`\n${selectedCompany.display_name || selectedCompany.name} を選択しました。\n`);

  return {
    selected: {
      id: selectedCompany.id,
      name: selectedCompany.name,
      displayName: selectedCompany.display_name || selectedCompany.name,
      role: selectedCompany.role,
    },
    all: companies,
  };
}

async function configureMcpTarget(target: McpTarget): Promise<void> {
  const displayName = getTargetDisplayName(target);
  const status = await checkMcpConfigStatus(target);

  if (status.hasFreeeConfig) {
    const { action } = await prompts({
      type: 'select',
      name: 'action',
      message: `${displayName} に freee-mcp が設定済みです。どうしますか?`,
      choices: [
        { title: 'そのまま (変更なし)', value: 'keep' },
        { title: '削除する', value: 'remove' },
      ],
      initial: 0,
    });

    if (action === 'remove') {
      await removeFreeeMcpConfig(target);
      console.log(`  ✓ ${displayName} から freee-mcp を削除しました。`);
    } else {
      console.log(`  - ${displayName} の設定は変更しません。`);
    }
  } else {
    const { shouldAdd } = await prompts({
      type: 'confirm',
      name: 'shouldAdd',
      message: `${displayName} に freee-mcp を追加しますか?`,
      initial: true,
    });

    if (shouldAdd) {
      await addFreeeMcpConfig(target);
      console.log(`  ✓ ${displayName} に freee-mcp を追加しました。`);
      console.log(`    設定ファイル: ${status.path}`);
    } else {
      console.log(`  - ${displayName} への追加をスキップしました。`);
    }
  }
}

export async function configureMcpIntegration(): Promise<void> {
  console.log('=== MCP設定 ===\n');
  console.log('Claude Code / Claude Desktop に freee-mcp を設定できます。\n');

  await configureMcpTarget('claude-code');
  console.log('');

  await configureMcpTarget('claude-desktop');
  console.log('');

  console.log('セットアップ完了!');
  console.log('変更を反映するには、Claude Code / Claude Desktop を再起動してください。\n');
}
