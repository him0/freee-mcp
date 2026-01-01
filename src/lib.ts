/**
 * Library exports for testing and programmatic use
 * This file exports internal functions without starting the MCP server
 */

export {
  API_CONFIGS,
  validatePathForService,
  listAllAvailablePaths,
  type ApiType,
  type ApiConfig,
  type PathValidationResult,
} from './openapi/schema-loader.js';

export { generateClientModeTool } from './openapi/client-mode.js';
