/**
 * Tool filtering configuration for MCP server
 * Allows selective enabling/disabling of tools based on various criteria
 */

export interface ToolFilterConfig {
  enableRead: boolean;
  enableWrite: boolean;
  enableDelete: boolean;
  enabledResources: string[];
  enabledTools: string[];
  disabledTools: string[];
}

/**
 * Parse comma-separated list from environment variable
 */
function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * Load tool filter configuration from environment variables
 */
export const toolConfig: ToolFilterConfig = {
  enableRead: process.env.FREEE_ENABLE_READ !== 'false',
  enableWrite: process.env.FREEE_ENABLE_WRITE !== 'false',
  enableDelete: process.env.FREEE_ENABLE_DELETE === 'true',
  enabledResources: parseList(process.env.FREEE_ENABLED_RESOURCES),
  enabledTools: parseList(process.env.FREEE_ENABLED_TOOLS),
  disabledTools: parseList(process.env.FREEE_DISABLED_TOOLS),
};

/**
 * Check if a pattern matches a tool name (supports wildcards)
 * @param toolName - The tool name to check
 * @param patterns - Array of patterns (supports * wildcard)
 * @returns true if any pattern matches
 */
export function matchesPattern(toolName: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(toolName);
    }
    return toolName === pattern;
  });
}

/**
 * Extract resource name from API path
 * @param path - API path (e.g., "/api/1/deals" or "/api/1/deals/{id}")
 * @returns Resource name (e.g., "deals")
 */
export function extractResourceName(path: string): string {
  const parts = path.split('/').filter((p) => p && p !== 'api' && p !== '1');
  if (parts.length === 0) return '';

  // Return the first segment that's not a parameter
  const firstSegment = parts[0];
  if (firstSegment.startsWith('{')) {
    return parts.length > 1 ? parts[1] : '';
  }
  return firstSegment;
}

/**
 * Determine if a tool should be enabled based on filter configuration
 * @param toolName - Full tool name (e.g., "get_deals", "post_deals")
 * @param method - HTTP method (e.g., "get", "post", "put", "delete")
 * @param resourceName - Resource name (e.g., "deals", "companies")
 * @returns true if the tool should be enabled
 */
export function shouldEnableTool(
  toolName: string,
  method: string,
  resourceName: string,
): boolean {
  // Priority 1: Whitelist (enabled tools) - if specified, only these are enabled
  if (toolConfig.enabledTools.length > 0) {
    return matchesPattern(toolName, toolConfig.enabledTools);
  }

  // Priority 2: Blacklist (disabled tools)
  if (matchesPattern(toolName, toolConfig.disabledTools)) {
    return false;
  }

  // Priority 3: Operation type filtering
  const methodLower = method.toLowerCase();
  if (methodLower === 'get' && !toolConfig.enableRead) {
    return false;
  }
  if ((methodLower === 'post' || methodLower === 'put') && !toolConfig.enableWrite) {
    return false;
  }
  if (methodLower === 'delete' && !toolConfig.enableDelete) {
    return false;
  }

  // Priority 4: Resource filtering
  if (toolConfig.enabledResources.length > 0) {
    return toolConfig.enabledResources.includes(resourceName);
  }

  // Default: enable the tool
  return true;
}
