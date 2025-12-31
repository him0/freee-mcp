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
  })),
  getMode: vi.fn(() => false)
}));

vi.mock('../auth/server.js', () => ({
  startCallbackServer: vi.fn(),
  stopCallbackServer: vi.fn()
}));

vi.mock('./tools.js', () => ({
  addAuthenticationTools: vi.fn()
}));

vi.mock('../openapi/converter.js', () => ({
  generateToolsFromOpenApi: vi.fn()
}));

vi.mock('../openapi/client-mode.js', () => ({
  generateClientModeTool: vi.fn()
}));

describe('handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(process, 'on').mockImplementation(() => process);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createAndStartServer', () => {
    it('should create and start MCP server successfully', async () => {
      const mockMcpServer = await import('@modelcontextprotocol/sdk/server/mcp.js');
      const mockStdioTransport = await import('@modelcontextprotocol/sdk/server/stdio.js');
      const mockStartCallbackServer = await import('../auth/server.js');
      const mockAddAuthenticationTools = await import('./tools.js');
      const mockGenerateToolsFromOpenApi = await import('../openapi/converter.js');

      const mockServerInstance = {
        connect: vi.fn().mockResolvedValue(undefined)
      };
      vi.mocked(mockMcpServer.McpServer).mockReturnValue(mockServerInstance as unknown as InstanceType<typeof mockMcpServer.McpServer>);
      
      const mockTransportInstance = {};
      vi.mocked(mockStdioTransport.StdioServerTransport).mockReturnValue(mockTransportInstance as unknown as InstanceType<typeof mockStdioTransport.StdioServerTransport>);
      
      vi.mocked(mockStartCallbackServer.startCallbackServer).mockResolvedValue();

      await createAndStartServer();

      expect(mockMcpServer.McpServer).toHaveBeenCalledWith({
        name: 'freee',
        version: '1.0.0'
      });
      expect(mockAddAuthenticationTools.addAuthenticationTools).toHaveBeenCalledWith(mockServerInstance);
      expect(mockGenerateToolsFromOpenApi.generateToolsFromOpenApi).toHaveBeenCalledWith(mockServerInstance);
      expect(mockStartCallbackServer.startCallbackServer).toHaveBeenCalled();
      expect(mockServerInstance.connect).toHaveBeenCalledWith(mockTransportInstance);
    });

    it('should handle callback server startup failure gracefully', async () => {
      const mockMcpServer = await import('@modelcontextprotocol/sdk/server/mcp.js');
      const mockStartCallbackServer = await import('../auth/server.js');

      const mockServerInstance = {
        connect: vi.fn().mockResolvedValue(undefined)
      };
      vi.mocked(mockMcpServer.McpServer).mockReturnValue(mockServerInstance as unknown as InstanceType<typeof mockMcpServer.McpServer>);
      
      vi.mocked(mockStartCallbackServer.startCallbackServer).mockRejectedValue(new Error('Port in use'));

      await createAndStartServer();

      expect(console.error).toHaveBeenCalledWith('Failed to start callback server:', expect.any(Error));
      expect(console.error).toHaveBeenCalledWith('OAuth authentication will fall back to manual mode');
      expect(mockServerInstance.connect).toHaveBeenCalled();
    });

    it('should register SIGINT handler', async () => {
      const mockMcpServer = await import('@modelcontextprotocol/sdk/server/mcp.js');
      const mockStopCallbackServer = await import('../auth/server.js');

      const mockServerInstance = {
        connect: vi.fn().mockResolvedValue(undefined)
      };
      vi.mocked(mockMcpServer.McpServer).mockReturnValue(mockServerInstance as unknown as InstanceType<typeof mockMcpServer.McpServer>);

      const mockProcessOn = vi.spyOn(process, 'on');
      const mockProcessExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await createAndStartServer();

      expect(mockProcessOn).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      
      const sigintHandler = mockProcessOn.mock.calls.find(call => call[0] === 'SIGINT')?.[1] as Function;
      expect(sigintHandler).toBeDefined();
      
      sigintHandler();
      
      expect(mockStopCallbackServer.stopCallbackServer).toHaveBeenCalled();
      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });

    it('should register SIGTERM handler', async () => {
      const mockMcpServer = await import('@modelcontextprotocol/sdk/server/mcp.js');
      const mockStopCallbackServer = await import('../auth/server.js');

      const mockServerInstance = {
        connect: vi.fn().mockResolvedValue(undefined)
      };
      vi.mocked(mockMcpServer.McpServer).mockReturnValue(mockServerInstance as unknown as InstanceType<typeof mockMcpServer.McpServer>);

      const mockProcessOn = vi.spyOn(process, 'on');
      const mockProcessExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await createAndStartServer();

      expect(mockProcessOn).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
      
      const sigtermHandler = mockProcessOn.mock.calls.find(call => call[0] === 'SIGTERM')?.[1] as Function;
      expect(sigtermHandler).toBeDefined();
      
      sigtermHandler();
      
      expect(mockStopCallbackServer.stopCallbackServer).toHaveBeenCalled();
      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });
  });
});