/**
 * Centralized constants for freee-mcp
 *
 * This file consolidates magic numbers and hardcoded values that are used
 * across multiple files in the codebase.
 */
/**
 * Application name used for configuration directory
 */
export declare const APP_NAME = "freee-mcp";
/**
 * Get the configuration directory path.
 * Respects XDG Base Directory specification:
 * - Uses XDG_CONFIG_HOME if set
 * - Falls back to ~/.config/freee-mcp
 */
export declare function getConfigDir(): string;
/**
 * Default port for OAuth callback server
 */
export declare const DEFAULT_CALLBACK_PORT = 54321;
/**
 * Authentication timeout in milliseconds (5 minutes)
 */
export declare const AUTH_TIMEOUT_MS: number;
/**
 * File permission for sensitive configuration files (owner read/write only)
 */
export declare const CONFIG_FILE_PERMISSION = 384;
/**
 * Base URL for freee API
 */
export declare const FREEE_API_URL = "https://api.freee.co.jp";
