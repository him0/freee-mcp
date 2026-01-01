/**
 * MCP configuration management for Claude Code and Claude Desktop
 *
 * Handles reading, adding, and removing freee-mcp configuration
 * from Claude Code (~/.claude.json) and Claude Desktop config files.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

export type McpTarget = 'claude-code' | 'claude-desktop';

export type McpConfigStatus = {
  path: string;
  exists: boolean;
  hasFreeeConfig: boolean;
};

type McpServerEntry = {
  command: string;
  args: string[];
  env?: Record<string, string>;
};

type McpConfig = {
  mcpServers?: Record<string, McpServerEntry>;
  [key: string]: unknown;
};

const FREEE_MCP_SERVER_NAME = 'freee-mcp';

const FREEE_MCP_SERVER_CONFIG: McpServerEntry = {
  command: 'npx',
  args: ['@him0/freee-mcp', 'client'],
};

/**
 * Get the MCP configuration file path for the specified target.
 */
export function getMcpConfigPath(target: McpTarget): string {
  const platform = os.platform();

  if (target === 'claude-code') {
    return path.join(os.homedir(), '.claude.json');
  }

  // Claude Desktop paths vary by platform
  if (platform === 'darwin') {
    return path.join(
      os.homedir(),
      'Library',
      'Application Support',
      'Claude',
      'claude_desktop_config.json'
    );
  } else if (platform === 'win32') {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(appData, 'Claude', 'claude_desktop_config.json');
  } else {
    // Linux and other Unix-like systems
    return path.join(os.homedir(), '.config', 'Claude', 'claude_desktop_config.json');
  }
}

/**
 * Get display name for the target.
 */
export function getTargetDisplayName(target: McpTarget): string {
  return target === 'claude-code' ? 'Claude Code' : 'Claude Desktop';
}

/**
 * Read and parse MCP configuration file.
 * Returns null if file doesn't exist or can't be parsed.
 */
async function readMcpConfig(configPath: string): Promise<McpConfig | null> {
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content) as McpConfig;
  } catch {
    return null;
  }
}

/**
 * Write MCP configuration to file.
 * Creates parent directories if they don't exist.
 */
async function writeMcpConfig(configPath: string, config: McpConfig): Promise<void> {
  const dir = path.dirname(configPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

/**
 * Check the current MCP configuration status for the specified target.
 */
export async function checkMcpConfigStatus(target: McpTarget): Promise<McpConfigStatus> {
  const configPath = getMcpConfigPath(target);

  try {
    await fs.access(configPath);
    const config = await readMcpConfig(configPath);

    return {
      path: configPath,
      exists: true,
      hasFreeeConfig: config?.mcpServers?.[FREEE_MCP_SERVER_NAME] !== undefined,
    };
  } catch {
    return {
      path: configPath,
      exists: false,
      hasFreeeConfig: false,
    };
  }
}

/**
 * Add freee-mcp configuration to the specified target.
 * Preserves existing configuration while adding/updating the freee-mcp entry.
 */
export async function addFreeeMcpConfig(target: McpTarget): Promise<void> {
  const configPath = getMcpConfigPath(target);

  // Read existing config or start with empty object
  let config = await readMcpConfig(configPath);
  if (!config) {
    config = {};
  }

  // Ensure mcpServers object exists
  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  // Add/update freee-mcp entry
  config.mcpServers[FREEE_MCP_SERVER_NAME] = { ...FREEE_MCP_SERVER_CONFIG };

  await writeMcpConfig(configPath, config);
}

/**
 * Remove freee-mcp configuration from the specified target.
 * Preserves other MCP server configurations.
 */
export async function removeFreeeMcpConfig(target: McpTarget): Promise<void> {
  const configPath = getMcpConfigPath(target);

  const config = await readMcpConfig(configPath);
  if (!config?.mcpServers?.[FREEE_MCP_SERVER_NAME]) {
    // Nothing to remove
    return;
  }

  // Remove freee-mcp entry
  delete config.mcpServers[FREEE_MCP_SERVER_NAME];

  // Clean up empty mcpServers object
  if (Object.keys(config.mcpServers).length === 0) {
    delete config.mcpServers;
  }

  await writeMcpConfig(configPath, config);
}
