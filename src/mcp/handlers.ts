import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from '../config.js';
import { addAuthenticationTools } from './tools.js';
import { generateClientModeTool } from '../openapi/client-mode.js';

export async function createAndStartServer(): Promise<void> {
  // Load config first
  const config = await loadConfig();

  const server = new McpServer({
    name: config.server.name,
    version: config.server.version,
  });

  addAuthenticationTools(server);
  generateClientModeTool(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Freee MCP Server running on stdio');
}