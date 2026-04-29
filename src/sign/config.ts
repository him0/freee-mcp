import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { parseBooleanEnv, parsePort } from '../config.js';
import { CONFIG_FILE_PERMISSION, getConfigDir } from '../constants.js';

/** サイン専用のデフォルトコールバックポート（freee 本体の 54321 と競合しないようにする） */
export const SIGN_DEFAULT_CALLBACK_PORT = 54322;

// Sign OAuth endpoints
export const SIGN_API_URL =
  process.env.FREEE_SIGN_API_URL?.replace(/\/+$/, '') || 'https://ninja-sign.com';
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
    throw new Error('FREEE_SIGN_CLIENT_ID と FREEE_SIGN_CLIENT_SECRET は両方設定してください。');
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

export const SIGN_CALLBACK_PATH = '/oauth/sign-callback';

export interface SignRemoteServerConfig {
  port: number;
  issuerUrl: string;
  jwtSecret: string;
  signClientId: string;
  signClientSecret: string;
  signAuthorizationEndpoint: string;
  signTokenEndpoint: string;
  signScope: string;
  redisUrl: string;
  corsAllowedOrigins?: string;
  rateLimitEnabled: boolean;
  logLevel: string;
}

const SIGN_VALID_LOG_LEVELS = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
] as const;

const SignRemoteServerEnvSchema = z.object({
  SIGN_ISSUER_URL: z
    .string({ required_error: 'SIGN_ISSUER_URL is required for serve mode.' })
    .min(1, 'SIGN_ISSUER_URL is required for serve mode.')
    .url('SIGN_ISSUER_URL must be a valid URL.'),
  SIGN_JWT_SECRET: z
    .string({ required_error: 'SIGN_JWT_SECRET is required for serve mode.' })
    .min(
      32,
      'SIGN_JWT_SECRET must be at least 32 characters. Use a cryptographically random value: openssl rand -hex 32',
    ),
  FREEE_SIGN_CLIENT_ID: z
    .string({ required_error: 'FREEE_SIGN_CLIENT_ID is required for serve mode.' })
    .min(1, 'FREEE_SIGN_CLIENT_ID is required for serve mode.'),
  FREEE_SIGN_CLIENT_SECRET: z
    .string({ required_error: 'FREEE_SIGN_CLIENT_SECRET is required for serve mode.' })
    .min(1, 'FREEE_SIGN_CLIENT_SECRET is required for serve mode.'),
  SIGN_PORT: z.string().optional(),
  SIGN_AUTHORIZATION_ENDPOINT: z
    .string()
    .url('SIGN_AUTHORIZATION_ENDPOINT must be a valid URL.')
    .optional(),
  SIGN_TOKEN_ENDPOINT: z.string().url('SIGN_TOKEN_ENDPOINT must be a valid URL.').optional(),
  SIGN_SCOPE: z.string().optional(),
  SIGN_REDIS_URL: z.string().min(1).optional(),
  SIGN_CORS_ALLOWED_ORIGINS: z.string().optional(),
  SIGN_RATE_LIMIT_ENABLED: z.string().optional(),
  SIGN_LOG_LEVEL: z.enum(SIGN_VALID_LOG_LEVELS).optional(),
});

function formatSignZodIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const name = issue.path.join('.');
      return name ? `${name}: ${issue.message}` : issue.message;
    })
    .join('; ');
}

export function loadSignRemoteServerConfig(): SignRemoteServerConfig {
  const rawEnv = {
    SIGN_ISSUER_URL: process.env.SIGN_ISSUER_URL,
    SIGN_JWT_SECRET: process.env.SIGN_JWT_SECRET,
    FREEE_SIGN_CLIENT_ID: process.env.FREEE_SIGN_CLIENT_ID,
    FREEE_SIGN_CLIENT_SECRET: process.env.FREEE_SIGN_CLIENT_SECRET,
    SIGN_PORT: process.env.SIGN_PORT,
    SIGN_AUTHORIZATION_ENDPOINT: process.env.SIGN_AUTHORIZATION_ENDPOINT,
    SIGN_TOKEN_ENDPOINT: process.env.SIGN_TOKEN_ENDPOINT,
    SIGN_SCOPE: process.env.SIGN_SCOPE,
    SIGN_REDIS_URL: process.env.SIGN_REDIS_URL,
    SIGN_CORS_ALLOWED_ORIGINS: process.env.SIGN_CORS_ALLOWED_ORIGINS,
    SIGN_RATE_LIMIT_ENABLED: process.env.SIGN_RATE_LIMIT_ENABLED,
    SIGN_LOG_LEVEL: process.env.SIGN_LOG_LEVEL,
  };

  const parsed = SignRemoteServerEnvSchema.safeParse(rawEnv);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${formatSignZodIssues(parsed.error)}`);
  }
  const env = parsed.data;

  // SIGN_RATE_LIMIT_ENABLED defaults to true (secure-by-default).
  // Operators must set SIGN_RATE_LIMIT_ENABLED=false explicitly to disable.
  const rateLimitEnabled = parseBooleanEnv(
    'SIGN_RATE_LIMIT_ENABLED',
    env.SIGN_RATE_LIMIT_ENABLED,
    true,
  );

  return {
    port: parsePort(env.SIGN_PORT, 3002),
    issuerUrl: env.SIGN_ISSUER_URL,
    jwtSecret: env.SIGN_JWT_SECRET,
    signClientId: env.FREEE_SIGN_CLIENT_ID,
    signClientSecret: env.FREEE_SIGN_CLIENT_SECRET,
    signAuthorizationEndpoint: env.SIGN_AUTHORIZATION_ENDPOINT || SIGN_AUTHORIZATION_ENDPOINT,
    signTokenEndpoint: env.SIGN_TOKEN_ENDPOINT || SIGN_TOKEN_ENDPOINT,
    signScope: env.SIGN_SCOPE || SIGN_OAUTH_SCOPE,
    redisUrl: env.SIGN_REDIS_URL || 'redis://localhost:6379',
    corsAllowedOrigins: env.SIGN_CORS_ALLOWED_ORIGINS,
    rateLimitEnabled,
    logLevel: env.SIGN_LOG_LEVEL || 'info',
  };
}

function maskSignSecret(value: string | undefined): string {
  if (!value) {
    return '<unset>';
  }
  return '<redacted>';
}

/**
 * Build a log-safe summary of the resolved sign remote server config.
 * Secrets (jwtSecret, signClientSecret) are masked.
 */
export function summarizeSignRemoteServerConfig(
  config: SignRemoteServerConfig,
): Record<string, string | number | boolean | undefined> {
  return {
    port: config.port,
    issuerUrl: config.issuerUrl,
    jwtSecret: maskSignSecret(config.jwtSecret),
    signClientId: config.signClientId,
    signClientSecret: maskSignSecret(config.signClientSecret),
    signAuthorizationEndpoint: config.signAuthorizationEndpoint,
    signTokenEndpoint: config.signTokenEndpoint,
    signScope: config.signScope,
    redisUrl: config.redisUrl,
    corsAllowedOrigins: config.corsAllowedOrigins,
    rateLimitEnabled: config.rateLimitEnabled,
    logLevel: config.logLevel,
  };
}
