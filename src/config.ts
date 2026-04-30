import { createRequire } from 'node:module';
import { z } from 'zod';
import { loadFullConfig } from './config/companies.js';
import {
  AUTH_TIMEOUT_MS,
  DEFAULT_CALLBACK_PORT,
  FREEE_API_URL,
  FREEE_AUTHORIZATION_ENDPOINT,
  FREEE_OAUTH_SCOPE,
  FREEE_TOKEN_ENDPOINT,
  SERVER_INSTRUCTIONS,
} from './constants.js';

const require = createRequire(import.meta.url);
const { version: packageVersion } = require('../package.json') as { version: string };

/**
 * Validate and parse a port value.
 * Returns defaultPort with a warning if the value is invalid.
 */
export function parsePort(value: string | number | undefined, defaultPort: number): number {
  if (value === undefined || value === null) {
    return defaultPort;
  }

  const port = typeof value === 'string' ? parseInt(value, 10) : value;

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error(
      `Warning: ポートの値が不正です (${String(value)})。デフォルトポート ${defaultPort} を使用します。`,
    );
    return defaultPort;
  }

  return port;
}

export interface Config {
  freee: {
    clientId: string;
    clientSecret: string;
    companyId: string;
    apiUrl: string;
  };
  oauth: {
    callbackPort: number;
    redirectUri: string;
    authorizationEndpoint: string;
    tokenEndpoint: string;
    scope: string;
  };
  server: {
    name: string;
    version: string;
    instructions: string;
  };
  auth: {
    timeoutMs: number;
  };
  mcp: {
    // RFC 8707 audience for issued/verified JWTs. `undefined` means callers
    // should fall back to the issuer URL when signing (deep defense default).
    jwtAudience: string | undefined;
    // When false, verifyAccessToken runs in grace-period mode and accepts
    // tokens regardless of their `aud` claim (legacy tokens included).
    jwtAudienceEnforce: boolean;
  };
}

// Cached config
let cachedConfig: Config | null = null;

/**
 * Check if environment variables are set for credentials.
 * Both FREEE_CLIENT_ID and FREEE_CLIENT_SECRET must be set together.
 * Throws an error if only one of them is set.
 */
function hasEnvCredentials(): boolean {
  const hasClientId = !!process.env.FREEE_CLIENT_ID;
  const hasClientSecret = !!process.env.FREEE_CLIENT_SECRET;

  if (hasClientId && !hasClientSecret) {
    throw new Error(
      '環境変数 FREEE_CLIENT_SECRET が設定されていません。\n' +
        '`freee-mcp configure` を実行して設定ファイルへ移行することを推奨します。\n' +
        '環境変数を使う場合は FREEE_CLIENT_ID と FREEE_CLIENT_SECRET の両方を設定してください。',
    );
  }

  if (!hasClientId && hasClientSecret) {
    throw new Error(
      '環境変数 FREEE_CLIENT_ID が設定されていません。\n' +
        '`freee-mcp configure` を実行して設定ファイルへ移行することを推奨します。\n' +
        '環境変数を使う場合は FREEE_CLIENT_ID と FREEE_CLIENT_SECRET の両方を設定してください。',
    );
  }

  return hasClientId && hasClientSecret;
}

/**
 * Resolve the JWT `aud` value for issued tokens (RFC 8707).
 * Priority: MCP_JWT_AUDIENCE > MCP_PUBLIC_BASE_URL > undefined.
 */
function resolveMcpJwtAudience(): string | undefined {
  return process.env.MCP_JWT_AUDIENCE || process.env.MCP_PUBLIC_BASE_URL || undefined;
}

/**
 * Resolve whether verifyAccessToken should enforce `aud`.
 * Defaults to false (grace-period: accept tokens missing or with any `aud`).
 */
function resolveMcpJwtAudienceEnforce(): boolean {
  return process.env.MCP_JWT_AUDIENCE_ENFORCE === 'true';
}

/**
 * Load and cache configuration
 * Priority: environment variables > config file > error
 */
export async function loadConfig(): Promise<Config> {
  if (cachedConfig) {
    return cachedConfig;
  }

  const fullConfig = await loadFullConfig();

  // Load credentials with priority: env > file
  let clientId: string;
  let clientSecret: string;
  let callbackPort: number;

  if (hasEnvCredentials()) {
    // Environment variables take priority (with deprecation warning)
    console.error('Warning: 環境変数での認証情報設定は非推奨です。');
    console.error('  `freee-mcp configure` を実行して設定ファイルに移行してください。');
    console.error('  環境変数設定は将来のバージョンで削除される予定です。\n');

    clientId = process.env.FREEE_CLIENT_ID || '';
    clientSecret = process.env.FREEE_CLIENT_SECRET || '';
    callbackPort = parsePort(process.env.FREEE_CALLBACK_PORT, DEFAULT_CALLBACK_PORT);
  } else {
    // Load from config file
    if (!fullConfig.clientId || !fullConfig.clientSecret) {
      throw new Error(
        '認証情報が設定されていません。\n' +
          '`freee-mcp configure` を実行してセットアップしてください。',
      );
    }

    clientId = fullConfig.clientId;
    clientSecret = fullConfig.clientSecret;
    callbackPort = parsePort(fullConfig.callbackPort, DEFAULT_CALLBACK_PORT);
  }

  cachedConfig = {
    freee: {
      clientId,
      clientSecret,
      companyId: '0',
      apiUrl: FREEE_API_URL,
    },
    oauth: {
      callbackPort,
      redirectUri: `http://127.0.0.1:${callbackPort}/callback`,
      authorizationEndpoint: FREEE_AUTHORIZATION_ENDPOINT,
      tokenEndpoint: FREEE_TOKEN_ENDPOINT,
      scope: FREEE_OAUTH_SCOPE,
    },
    server: {
      name: 'freee',
      version: packageVersion,
      instructions: SERVER_INSTRUCTIONS,
    },
    auth: {
      timeoutMs: AUTH_TIMEOUT_MS,
    },
    mcp: {
      jwtAudience: resolveMcpJwtAudience(),
      jwtAudienceEnforce: resolveMcpJwtAudienceEnforce(),
    },
  };

  return cachedConfig;
}

/**
 * Get cached configuration synchronously
 * Throws if loadConfig() has not been called yet
 */
export function getConfig(): Config {
  if (!cachedConfig) {
    throw new Error('Config not loaded. Call loadConfig() first in async context.');
  }
  return cachedConfig;
}

export interface RemoteServerConfig {
  port: number;
  issuerUrl: string;
  jwtSecret: string;
  jwtAudience: string | undefined;
  jwtAudienceEnforce: boolean;
  freeeClientId: string;
  freeeClientSecret: string;
  freeeAuthorizationEndpoint: string;
  freeeTokenEndpoint: string;
  freeeScope: string;
  freeeApiUrl: string;
  redisUrl: string;
  corsAllowedOrigins?: string;
  rateLimitEnabled: boolean;
  logLevel: string;
  // Dev-only: accept http://localhost CIMD URLs. Determined by environment, not by an env var.
  allowInsecureLocalhostCimd: boolean;
}

// kubelet auto-injects KUBERNETES_SERVICE_HOST into every pod, so its presence is
// a trustworthy "this is a cluster workload" signal that no operator can forget to set.
// NODE_ENV is checked as a strict allowlist so unset / typoed / arbitrary values all
// fail safely toward "production-like".
function isDevelopmentEnvironment(): boolean {
  if (process.env.KUBERNETES_SERVICE_HOST) return false;
  return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
}

/**
 * Parse a boolean environment variable.
 * Accepts (case-insensitively): "true"/"false", "1"/"0", "yes"/"no", "on"/"off".
 * Returns `defaultValue` when the variable is undefined or empty.
 * Throws if the value is set but not one of the accepted forms.
 */
export function parseBooleanEnv(
  name: string,
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined || value === '') {
    return defaultValue;
  }
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false;
  }
  throw new Error(`${name} must be a boolean (true/false). Got: ${JSON.stringify(value)}`);
}

const VALID_LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;

/**
 * Schema for validating remote server environment variables at startup.
 * All required envs must be present and well-formed; invalid values fail loudly.
 */
const RemoteServerEnvSchema = z.object({
  ISSUER_URL: z
    .string({ required_error: 'ISSUER_URL is required for serve mode.' })
    .min(1, 'ISSUER_URL is required for serve mode.')
    .url('ISSUER_URL must be a valid URL.'),
  JWT_SECRET: z
    .string({ required_error: 'JWT_SECRET is required for serve mode.' })
    .min(
      32,
      'JWT_SECRET must be at least 32 characters. Use a cryptographically random value: openssl rand -hex 32',
    ),
  FREEE_CLIENT_ID: z
    .string({ required_error: 'FREEE_CLIENT_ID is required for serve mode.' })
    .min(1, 'FREEE_CLIENT_ID is required for serve mode.'),
  FREEE_CLIENT_SECRET: z
    .string({ required_error: 'FREEE_CLIENT_SECRET is required for serve mode.' })
    .min(1, 'FREEE_CLIENT_SECRET is required for serve mode.'),
  PORT: z.string().optional(),
  FREEE_AUTHORIZATION_ENDPOINT: z
    .string()
    .url('FREEE_AUTHORIZATION_ENDPOINT must be a valid URL.')
    .optional(),
  FREEE_TOKEN_ENDPOINT: z.string().url('FREEE_TOKEN_ENDPOINT must be a valid URL.').optional(),
  FREEE_SCOPE: z.string().optional(),
  FREEE_API_BASE_URL: z.string().url('FREEE_API_BASE_URL must be a valid URL.').optional(),
  REDIS_URL: z.string().min(1).optional(),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  RATE_LIMIT_ENABLED: z.string().optional(),
  LOG_LEVEL: z.enum(VALID_LOG_LEVELS).optional(),
});

function formatZodIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const name = issue.path.join('.');
      return name ? `${name}: ${issue.message}` : issue.message;
    })
    .join('; ');
}

export function loadRemoteServerConfig(): RemoteServerConfig {
  // Pick only the envs we care about so unrelated values don't trigger validation.
  const rawEnv = {
    ISSUER_URL: process.env.ISSUER_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    FREEE_CLIENT_ID: process.env.FREEE_CLIENT_ID,
    FREEE_CLIENT_SECRET: process.env.FREEE_CLIENT_SECRET,
    PORT: process.env.PORT,
    FREEE_AUTHORIZATION_ENDPOINT: process.env.FREEE_AUTHORIZATION_ENDPOINT,
    FREEE_TOKEN_ENDPOINT: process.env.FREEE_TOKEN_ENDPOINT,
    FREEE_SCOPE: process.env.FREEE_SCOPE,
    FREEE_API_BASE_URL: process.env.FREEE_API_BASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS,
    RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED,
    LOG_LEVEL: process.env.LOG_LEVEL,
  };

  const parsed = RemoteServerEnvSchema.safeParse(rawEnv);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${formatZodIssues(parsed.error)}`);
  }
  const env = parsed.data;

  // RATE_LIMIT_ENABLED defaults to true (secure-by-default).
  // Operators must set RATE_LIMIT_ENABLED=false explicitly to disable.
  const rateLimitEnabled = parseBooleanEnv('RATE_LIMIT_ENABLED', env.RATE_LIMIT_ENABLED, true);

  const allowInsecureLocalhostCimd = isDevelopmentEnvironment();

  // Audit / safety signals at startup. The CIMD localhost bypass cannot be
  // perfectly distinguished from a self-hosted docker-compose production where
  // the operator forgot to set NODE_ENV, so we surface both states loudly.
  if (allowInsecureLocalhostCimd) {
    console.error(
      'Warning: http://localhost CIMD URLs are accepted (development environment detected). ' +
        'If this process is serving production traffic, set NODE_ENV=production to disable.',
    );
  } else if (!process.env.KUBERNETES_SERVICE_HOST && !process.env.NODE_ENV) {
    console.error(
      'Warning: NODE_ENV is unset outside Kubernetes. ' +
        'Set NODE_ENV=production for production deployments or NODE_ENV=development for local work.',
    );
  }

  return {
    port: parsePort(env.PORT, 3000),
    issuerUrl: env.ISSUER_URL,
    jwtSecret: env.JWT_SECRET,
    jwtAudience: resolveMcpJwtAudience(),
    jwtAudienceEnforce: resolveMcpJwtAudienceEnforce(),
    freeeClientId: env.FREEE_CLIENT_ID,
    freeeClientSecret: env.FREEE_CLIENT_SECRET,
    freeeAuthorizationEndpoint: env.FREEE_AUTHORIZATION_ENDPOINT || FREEE_AUTHORIZATION_ENDPOINT,
    freeeTokenEndpoint: env.FREEE_TOKEN_ENDPOINT || FREEE_TOKEN_ENDPOINT,
    freeeScope: env.FREEE_SCOPE || FREEE_OAUTH_SCOPE,
    freeeApiUrl: env.FREEE_API_BASE_URL?.replace(/\/+$/, '') || FREEE_API_URL,
    redisUrl: env.REDIS_URL || 'redis://localhost:6379',
    corsAllowedOrigins: env.CORS_ALLOWED_ORIGINS,
    rateLimitEnabled,
    logLevel: env.LOG_LEVEL || 'info',
    allowInsecureLocalhostCimd,
  };
}

/**
 * Mask a secret value for safe logging.
 * Returns a fixed-length placeholder so that the original length is not leaked.
 */
function maskSecret(value: string | undefined): string {
  if (!value) {
    return '<unset>';
  }
  return '<redacted>';
}

/**
 * Build a log-safe summary of the resolved remote server config.
 * Secrets (jwtSecret, freeeClientSecret) are masked.
 */
export function summarizeRemoteServerConfig(
  config: RemoteServerConfig,
): Record<string, string | number | boolean | undefined> {
  return {
    port: config.port,
    issuerUrl: config.issuerUrl,
    jwtSecret: maskSecret(config.jwtSecret),
    jwtAudience: config.jwtAudience,
    jwtAudienceEnforce: config.jwtAudienceEnforce,
    freeeClientId: config.freeeClientId,
    freeeClientSecret: maskSecret(config.freeeClientSecret),
    freeeAuthorizationEndpoint: config.freeeAuthorizationEndpoint,
    freeeTokenEndpoint: config.freeeTokenEndpoint,
    freeeScope: config.freeeScope,
    freeeApiUrl: config.freeeApiUrl,
    redisUrl: config.redisUrl,
    corsAllowedOrigins: config.corsAllowedOrigins,
    rateLimitEnabled: config.rateLimitEnabled,
    logLevel: config.logLevel,
    allowInsecureLocalhostCimd: config.allowInsecureLocalhostCimd,
  };
}

// Initialize cachedConfig for remote mode so getConfig() works without loadConfig()
export function initRemoteConfig(remoteConfig: RemoteServerConfig): void {
  cachedConfig = {
    freee: {
      clientId: remoteConfig.freeeClientId,
      clientSecret: remoteConfig.freeeClientSecret,
      companyId: '0',
      apiUrl: remoteConfig.freeeApiUrl,
    },
    oauth: {
      callbackPort: DEFAULT_CALLBACK_PORT,
      redirectUri: `http://127.0.0.1:${DEFAULT_CALLBACK_PORT}/callback`,
      authorizationEndpoint: remoteConfig.freeeAuthorizationEndpoint,
      tokenEndpoint: remoteConfig.freeeTokenEndpoint,
      scope: remoteConfig.freeeScope,
    },
    server: {
      name: 'freee',
      version: packageVersion,
      instructions: SERVER_INSTRUCTIONS,
    },
    auth: {
      timeoutMs: AUTH_TIMEOUT_MS,
    },
    mcp: {
      jwtAudience: remoteConfig.jwtAudience,
      jwtAudienceEnforce: remoteConfig.jwtAudienceEnforce,
    },
  };
}
