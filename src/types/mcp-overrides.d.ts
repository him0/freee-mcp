// Type overrides to prevent OOM during type checking
// The complex type inference between Zod 3.25+ and MCP SDK causes excessive memory usage
// This file simplifies the McpServer.registerTool method signature to avoid deep type inference

import '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

declare module '@modelcontextprotocol/sdk/server/mcp.js' {
  interface McpServer {
    // Override registerTool method with simplified signature to avoid OOM
    // biome-ignore lint/suspicious/noExplicitAny: intentional override to prevent deep type inference OOM
    registerTool(name: string, config: { title?: string; description?: string; inputSchema?: any; outputSchema?: any; annotations?: ToolAnnotations; _meta?: Record<string, unknown> }, handler: any): void;
  }
}
