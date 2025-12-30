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
