import prompts from 'prompts';
import { SIGN_DEFAULT_CALLBACK_PORT } from '../config.js';
import { loadSignConfig } from '../config.js';

export interface SignCredentials {
  clientId: string;
  clientSecret: string;
  callbackPort: number;
}

export async function collectSignCredentials(): Promise<SignCredentials> {
  const existingConfig = await loadSignConfig();
  const hasExisting = !!(existingConfig.clientId && existingConfig.clientSecret);

  if (hasExisting) {
    console.log('既存の設定が見つかりました。');
    console.log('  変更しない項目はそのまま Enter を押してください。\n');
  }

  console.log('ステップ 1/2: freee サイン OAuth認証情報の入力\n');

  const defaultPort = existingConfig.callbackPort || SIGN_DEFAULT_CALLBACK_PORT;
  console.log(
    `freee サインアプリのコールバックURLには http://127.0.0.1:${defaultPort}/callback を設定してください。\n`,
  );

  const result = await prompts([
    {
      type: 'text',
      name: 'clientId',
      message: 'FREEE_SIGN_CLIENT_ID:',
      initial: existingConfig.clientId || undefined,
      validate: (value: string): string | boolean => (value.trim() ? true : 'CLIENT_ID は必須です'),
    },
    {
      type: 'password',
      name: 'clientSecret',
      message: hasExisting
        ? 'FREEE_SIGN_CLIENT_SECRET (変更しない場合は空欄):'
        : 'FREEE_SIGN_CLIENT_SECRET:',
      validate: (value: string): string | boolean => {
        if (hasExisting && !value.trim()) return true;
        return value.trim() ? true : 'CLIENT_SECRET は必須です';
      },
    },
    {
      type: 'text',
      name: 'callbackPort',
      message: 'コールバックポート (コールバックURL: http://127.0.0.1:<port>/callback):',
      initial: String(defaultPort),
      validate: (value: string): string | boolean => {
        const port = parseInt(value.trim(), 10);
        if (Number.isNaN(port) || port < 1 || port > 65535) {
          return '有効なポート番号を入力してください (1〜65535)';
        }
        return true;
      },
    },
  ]);

  if (!result.clientId) {
    throw new Error('セットアップがキャンセルされました。');
  }

  return {
    clientId: result.clientId.trim(),
    clientSecret: result.clientSecret?.trim() || existingConfig.clientSecret || '',
    callbackPort: parseInt(result.callbackPort, 10),
  };
}
