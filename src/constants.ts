/**
 * Centralized constants for freee-mcp
 *
 * This file consolidates magic numbers and hardcoded values that are used
 * across multiple files in the codebase.
 */

import path from 'node:path';
import os from 'node:os';

/**
 * Application name used for configuration directory
 */
export const APP_NAME = 'freee-mcp';

/**
 * Get the configuration directory path.
 * Respects XDG Base Directory specification:
 * - Uses XDG_CONFIG_HOME if set
 * - Falls back to ~/.config/freee-mcp
 */
export function getConfigDir(): string {
  return process.env.XDG_CONFIG_HOME
    ? path.join(process.env.XDG_CONFIG_HOME, APP_NAME)
    : path.join(os.homedir(), '.config', APP_NAME);
}

/**
 * Default port for OAuth callback server
 */
export const DEFAULT_CALLBACK_PORT = 54321;

/**
 * Authentication timeout in milliseconds (5 minutes)
 */
export const AUTH_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * File permission for sensitive configuration files (owner read/write only)
 */
export const CONFIG_FILE_PERMISSION = 0o600;

/**
 * Base URL for freee API
 */
export const FREEE_API_URL = 'https://api.freee.co.jp';

/**
 * Package version for freee-mcp
 * Injected at build time from package.json via Bun.build define
 * Falls back to 'dev' for development/test environments
 */
declare const __PACKAGE_VERSION__: string | undefined;
export const PACKAGE_VERSION =
  typeof __PACKAGE_VERSION__ !== 'undefined' ? __PACKAGE_VERSION__ : 'dev';

/**
 * User-Agent header value for API requests
 * Format follows RFC 7231: ProductName/Version (comments)
 * @see https://datatracker.ietf.org/doc/html/rfc7231#section-5.5.3
 */
export const USER_AGENT = `freee-mcp/${PACKAGE_VERSION} (MCP Server; +https://github.com/freee/freee-mcp)`;

export const FREEE_AUTHORIZATION_ENDPOINT =
  'https://accounts.secure.freee.co.jp/public_api/authorize';

export const FREEE_TOKEN_ENDPOINT = 'https://accounts.secure.freee.co.jp/public_api/token';

export const FREEE_OAUTH_SCOPE = 'read write';

export const SERVER_INSTRUCTIONS =
  'freee APIと連携するMCPサーバー。会計・人事労務・請求書・工数管理・販売APIをサポート。詳細ガイドはfreee-api-skill skillを参照。skillが未インストールの場合は npx skills add freee/freee-mcp で追加';

// Fetch timeout constants for external API calls
export const FETCH_TIMEOUT_TOKEN_MS = 10_000; // Token exchange / refresh
export const FETCH_TIMEOUT_USERINFO_MS = 10_000; // User info fetch
export const FETCH_TIMEOUT_API_MS = 30_000; // freee API calls (MCP tools)
