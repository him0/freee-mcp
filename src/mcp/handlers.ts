import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { type Config, loadConfig } from '../config.js';
import { generateClientModeTool } from '../openapi/client-mode.js';
import { getLogger } from '../server/logger.js';
import { addFileUploadTool } from './file-upload-tool.js';
import { addAuthenticationTools } from './tools.js';

export function createMcpServer(
  config: Config,
  options?: {
    remote?: boolean;
  },
): McpServer {
  const server = new McpServer(
    {
      name: config.server.name,
      version: config.server.version,
    },
    {
      instructions: config.server.instructions,
    },
  );

  addAuthenticationTools(server, options);
  if (!options?.remote) {
    addFileUploadTool(server);
  }
  generateClientModeTool(server);

  return server;
}

export async function createAndStartServer(): Promise<void> {
  const config = await loadConfig();
  const server = createMcpServer(config);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  getLogger().info('Freee MCP Server running on stdio');
}
