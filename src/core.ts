/**
 * Core module exports for freee-mcp
 *
 * This module provides the public API for programmatic use of freee-mcp.
 * Used by external projects like freee-cli.
 */

// API client
export { makeApiRequest, isBinaryFileResponse } from './api/client.js';
export type { BinaryFileResponse } from './api/client.js';

// Authentication - tokens
export {
  saveTokens,
  loadTokens,
  isTokenValid,
  refreshAccessToken,
  getValidAccessToken,
  clearTokens,
} from './auth/tokens.js';
export type { TokenData, OAuthTokenResponse } from './auth/tokens.js';

// Authentication - OAuth flow
export {
  generatePKCE,
  buildAuthUrl,
  exchangeCodeForTokens,
} from './auth/oauth.js';

// Configuration - runtime
export { loadConfig, getConfig, parseCallbackPort } from './config.js';
export type { Config } from './config.js';

// Configuration - companies
export {
  loadFullConfig,
  saveFullConfig,
  getCurrentCompanyId,
  setCurrentCompany,
  getCompanyInfo,
  getDownloadDir,
} from './config/companies.js';
export type { FullConfig, CompanyConfig } from './config/companies.js';

// OpenAPI schema
export {
  validatePathForService,
  listAllAvailablePaths,
  API_CONFIGS,
} from './openapi/schema-loader.js';
export type {
  ApiType,
  ApiConfig,
  PathValidationResult,
} from './openapi/schema-loader.js';

// Constants
export {
  APP_NAME,
  getConfigDir,
  DEFAULT_CALLBACK_PORT,
  FREEE_API_URL,
  PACKAGE_VERSION,
  USER_AGENT,
} from './constants.js';
