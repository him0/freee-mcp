/**
 * Centralized constants for freee-mcp
 *
 * This file consolidates magic numbers and hardcoded values that are used
 * across multiple files in the codebase.
 */

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
