// Type overrides to prevent OOM during type checking
// The complex type inference between Zod 3.25+ and MCP SDK causes excessive memory usage
// This file simplifies the McpServer.tool method signature to avoid deep type inference

import '@modelcontextprotocol/sdk/server/mcp.js';

declare module '@modelcontextprotocol/sdk/server/mcp.js' {
  interface McpServer {
    // Override tool method with simplified signature to avoid OOM
    // biome-ignore lint/suspicious/noExplicitAny: intentional override to prevent deep type inference OOM
    tool(name: string, description: string, schema: any, handler: any): void;
  }
}
