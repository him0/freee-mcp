/**
 * Centralized constants for freee-mcp
 *
 * This file consolidates magic numbers and hardcoded values that are used
 * across multiple files in the codebase.
 */

import path from 'path';
import os from 'os';

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
 * This should be kept in sync with package.json version
 */
export const PACKAGE_VERSION = '0.6.0';

/**
 * User-Agent header value for API requests
 * Format follows RFC 7231: ProductName/Version (comments)
 * @see https://datatracker.ietf.org/doc/html/rfc7231#section-5.5.3
 */
export const USER_AGENT = `freee-mcp/${PACKAGE_VERSION} (MCP Server; +https://github.com/him0/freee-mcp)`;
