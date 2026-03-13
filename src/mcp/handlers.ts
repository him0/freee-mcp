import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Config, loadConfig } from '../config.js';
import { addAuthenticationTools } from './tools.js';
import { addFileUploadTool } from './file-upload-tool.js';
import { generateClientModeTool } from '../openapi/client-mode.js';

export function createMcpServer(config: Config): McpServer {
  const server = new McpServer(
    {
      name: config.server.name,
      version: config.server.version,
    },
    {
      instructions: config.server.instructions,
    },
  );

  addAuthenticationTools(server);
  addFileUploadTool(server);
  generateClientModeTool(server);

  return server;
}

export async function createAndStartServer(): Promise<void> {
  const config = await loadConfig();
  const server = createMcpServer(config);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Freee MCP Server running on stdio');
}
