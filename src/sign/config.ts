import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { CONFIG_FILE_PERMISSION, getConfigDir } from '../constants.js';

/** サイン専用のデフォルトコールバックポート（freee 本体の 54321 と競合しないようにする） */
export const SIGN_DEFAULT_CALLBACK_PORT = 54322;

// Sign OAuth endpoints
export const SIGN_API_URL = process.env.FREEE_SIGN_API_URL || 'https://ninja-sign.com';
export const SIGN_AUTHORIZATION_ENDPOINT = `${SIGN_API_URL}/oauth/authorize`;
export const SIGN_TOKEN_ENDPOINT = `${SIGN_API_URL}/oauth/token`;
export const SIGN_OAUTH_SCOPE = 'all';

export const SIGN_SERVER_INSTRUCTIONS =
  'freee サイン（電子契約）APIと連携するMCPサーバー。文書CRUD・フォルダ・入力項目・マイ印鑑・チーム管理をサポート。';

const SignConfigSchema = z.object({
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  callbackPort: z.preprocess((val) => (val === null ? undefined : val), z.number().optional()),
});

export type SignConfig = z.infer<typeof SignConfigSchema>;

function getSignConfigFilePath(): string {
  return path.join(getConfigDir(), 'sign-config.json');
}

async function ensureConfigDir(): Promise<void> {
  const configDir = path.dirname(getSignConfigFilePath());
  await fs.mkdir(configDir, { recursive: true });
}

function createDefaultConfig(): SignConfig {
  return {
    clientId: undefined,
    clientSecret: undefined,
    callbackPort: undefined,
  };
}

let cachedSignConfig: SignConfig | null = null;

/** Reset config cache (for testing) */
export function resetSignConfigCache(): void {
  cachedSignConfig = null;
}

export async function loadSignConfig(): Promise<SignConfig> {
  if (cachedSignConfig) {
    return cachedSignConfig;
  }

  const configPath = getSignConfigFilePath();

  try {
    const data = await fs.readFile(configPath, 'utf8');
    const parsed = JSON.parse(data);
    const result = SignConfigSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `Sign 設定ファイルが不正です: ${result.error.message}\n` +
          '`freee-sign-mcp configure` を実行して再設定してください。',
      );
    }
    cachedSignConfig = result.data;
    return cachedSignConfig;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      const defaultConfig = createDefaultConfig();
      await saveSignConfig(defaultConfig);
      return defaultConfig;
    }
    throw error;
  }
}

export async function saveSignConfig(config: SignConfig): Promise<void> {
  await ensureConfigDir();
  const configPath = getSignConfigFilePath();
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), {
    mode: CONFIG_FILE_PERMISSION,
  });
  cachedSignConfig = config;
}

export async function clearSignConfig(): Promise<void> {
  const configPath = getSignConfigFilePath();
  try {
    await fs.unlink(configPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  cachedSignConfig = null;
}

/**
 * Resolve Sign credentials with priority: env > config file > error.
 * Does NOT depend on freee's loadConfig().
 */
export async function getSignCredentials(): Promise<{
  clientId: string;
  clientSecret: string;
  callbackPort: number;
}> {
  const envClientId = process.env.FREEE_SIGN_CLIENT_ID;
  const envClientSecret = process.env.FREEE_SIGN_CLIENT_SECRET;

  if (envClientId && envClientSecret) {
    return {
      clientId: envClientId,
      clientSecret: envClientSecret,
      callbackPort: SIGN_DEFAULT_CALLBACK_PORT,
    };
  }

  if (envClientId || envClientSecret) {
    throw new Error(
      'FREEE_SIGN_CLIENT_ID と FREEE_SIGN_CLIENT_SECRET は両方設定してください。',
    );
  }

  const config = await loadSignConfig();
  if (!config.clientId || !config.clientSecret) {
    throw new Error(
      'クライアントIDが設定されていません。\n' +
        '`freee-sign-mcp configure` を実行してセットアップしてください。',
    );
  }

  return {
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    callbackPort: config.callbackPort ?? SIGN_DEFAULT_CALLBACK_PORT,
  };
}

