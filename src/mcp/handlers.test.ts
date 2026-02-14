import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAndStartServer } from './handlers.js';

vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: vi.fn().mockImplementation((options) => ({
    ...options,
    connect: vi.fn()
  }))
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn()
}));

vi.mock('../config.js', () => ({
  loadConfig: vi.fn(() => Promise.resolve({
    server: {
      name: 'freee',
      version: '1.0.0'
    },
    oauth: {
      callbackPort: 54321
    }
  }))
}));

vi.mock('./tools.js', () => ({
  addAuthenticationTools: vi.fn()
}));

vi.mock('../openapi/client-mode.js', () => ({
  generateClientModeTool: vi.fn()
}));

describe('handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createAndStartServer', () => {
    it('should create and start MCP server successfully', async () => {
      const mockMcpServer = await import('@modelcontextprotocol/sdk/server/mcp.js');
      const mockStdioTransport = await import('@modelcontextprotocol/sdk/server/stdio.js');
      const mockAddAuthenticationTools = await import('./tools.js');
      const mockGenerateClientModeTool = await import('../openapi/client-mode.js');

      const mockServerInstance = {
        connect: vi.fn().mockResolvedValue(undefined)
      };
      vi.mocked(mockMcpServer.McpServer).mockReturnValue(mockServerInstance as unknown as InstanceType<typeof mockMcpServer.McpServer>);

      const mockTransportInstance = {};
      vi.mocked(mockStdioTransport.StdioServerTransport).mockReturnValue(mockTransportInstance as unknown as InstanceType<typeof mockStdioTransport.StdioServerTransport>);

      await createAndStartServer();

      expect(mockMcpServer.McpServer).toHaveBeenCalledWith({
        name: 'freee',
        version: '1.0.0'
      });
      expect(mockAddAuthenticationTools.addAuthenticationTools).toHaveBeenCalledWith(mockServerInstance);
      expect(mockGenerateClientModeTool.generateClientModeTool).toHaveBeenCalledWith(mockServerInstance);
      expect(mockServerInstance.connect).toHaveBeenCalledWith(mockTransportInstance);
    });
  });
});
