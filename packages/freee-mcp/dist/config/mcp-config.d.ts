/**
 * MCP configuration management for Claude Code and Claude Desktop
 *
 * Handles reading, adding, and removing freee-mcp configuration
 * from Claude Code (~/.claude.json) and Claude Desktop config files.
 */
export type McpTarget = 'claude-code' | 'claude-desktop';
export type McpConfigStatus = {
    path: string;
    exists: boolean;
    hasFreeeConfig: boolean;
};
/**
 * Get the MCP configuration file path for the specified target.
 */
export declare function getMcpConfigPath(target: McpTarget): string;
/**
 * Get display name for the target.
 */
export declare function getTargetDisplayName(target: McpTarget): string;
/**
 * Check the current MCP configuration status for the specified target.
 */
export declare function checkMcpConfigStatus(target: McpTarget): Promise<McpConfigStatus>;
/**
 * Add freee-mcp configuration to the specified target.
 * Preserves existing configuration while adding/updating the freee-mcp entry.
 */
export declare function addFreeeMcpConfig(target: McpTarget): Promise<void>;
/**
 * Remove freee-mcp configuration from the specified target.
 * Preserves other MCP server configurations.
 */
export declare function removeFreeeMcpConfig(target: McpTarget): Promise<void>;
