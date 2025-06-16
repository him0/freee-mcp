import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config } from '../config.js';
import { startCallbackServer, stopCallbackServer } from '../auth/server.js';
import { addAuthenticationTools } from './tools.js';
import { generateToolsFromOpenApi } from '../openapi/converter.js';

export async function createAndStartServer(): Promise<void> {
  const server = new McpServer({
    name: config.server.name,
    version: config.server.version,
  });

  addAuthenticationTools(server);
  generateToolsFromOpenApi(server);

  try {
    await startCallbackServer();
    console.error(`✅ OAuth callback server started on http://127.0.0.1:${config.oauth.callbackPort}`);
  } catch (error) {
    console.error('⚠️ Failed to start callback server:', error);
    console.error('OAuth authentication will fall back to manual mode');
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Freee MCP Server running on stdio');

  process.on('SIGINT', () => {
    stopCallbackServer();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    stopCallbackServer();
    process.exit(0);
  });
}