import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSignMcpServer } from './handlers.js';
import { addSignAuthenticationTools } from './tools.js';

vi.mock('./config.js', () => ({
  SIGN_SERVER_INSTRUCTIONS: 'freee サイン（電子契約）APIと連携するMCPサーバー。',
  SIGN_API_URL: 'https://ninja-sign.com',
  SIGN_AUTHORIZATION_ENDPOINT: 'https://ninja-sign.com/oauth/authorize',
  SIGN_TOKEN_ENDPOINT: 'https://ninja-sign.com/oauth/token',
  SIGN_OAUTH_SCOPE: 'all',
  getSignCredentials: (): Promise<{
    clientId: string;
    clientSecret: string;
    callbackPort: number;
  }> => Promise.resolve({ clientId: 'id', clientSecret: 'secret', callbackPort: 54322 }),
}));

vi.mock('./tokens.js', () => ({
  loadSignTokens: (): Promise<null> => Promise.resolve(null),
  isSignTokenValid: (): boolean => false,
  clearSignTokens: (): Promise<void> => Promise.resolve(),
  getValidSignAccessToken: (): Promise<null> => Promise.resolve(null),
  OAuthTokenResponseSchema: { safeParse: vi.fn() },
  SignTokenDataSchema: { safeParse: vi.fn() },
}));

vi.mock('../auth/server.js', () => ({
  startCallbackServerWithAutoStop: (): Promise<void> => Promise.resolve(),
  getActualRedirectUri: (): string => 'http://127.0.0.1:54321/callback',
}));

describe('sign/handlers', () => {
  it('createSignMcpServer が sign_* ツールを登録する', () => {
    const server = createSignMcpServer();
    expect(server).toBeDefined();
  });

  it('Sign server instructions が Sign API 固有の説明文を含む', async () => {
    const { SIGN_SERVER_INSTRUCTIONS } = await import('./config.js');
    expect(SIGN_SERVER_INSTRUCTIONS).toContain('サイン');
    expect(SIGN_SERVER_INSTRUCTIONS).not.toContain('会計');
  });

  it('createSignMcpServer({ remote: true }) でもエラーなく生成される', () => {
    const server = createSignMcpServer({ remote: true });
    expect(server).toBeDefined();
  });

  describe('remote mode でのツール登録', () => {
    let mockServer: McpServer;
    let mockTool: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockTool = vi.fn();
      mockServer = {
        registerTool: mockTool,
      } as unknown as McpServer;
      vi.clearAllMocks();
    });

    it('remote: true 時に sign_authenticate が登録されない', () => {
      addSignAuthenticationTools(mockServer, { remote: true });

      const toolNames = mockTool.mock.calls.map((call: unknown[]) => call[0]);
      expect(toolNames).not.toContain('sign_authenticate');
      expect(toolNames).toContain('sign_auth_status');
      expect(toolNames).toContain('sign_clear_auth');
      expect(toolNames).toContain('sign_server_info');
    });

    it('remote: false 時に sign_authenticate が登録される', () => {
      addSignAuthenticationTools(mockServer, { remote: false });

      const toolNames = mockTool.mock.calls.map((call: unknown[]) => call[0]);
      expect(toolNames).toContain('sign_authenticate');
      expect(toolNames).toContain('sign_auth_status');
      expect(toolNames).toContain('sign_clear_auth');
      expect(toolNames).toContain('sign_server_info');
    });

    it('options 未指定時に sign_authenticate が登録される', () => {
      addSignAuthenticationTools(mockServer);

      const toolNames = mockTool.mock.calls.map((call: unknown[]) => call[0]);
      expect(toolNames).toContain('sign_authenticate');
      expect(toolNames).toContain('sign_server_info');
    });

    it('sign_server_info が stdio transport を返す（デフォルト）', async () => {
      addSignAuthenticationTools(mockServer);
      const handler = mockTool.mock.calls.find(
        (call: unknown[]) => call[0] === 'sign_server_info',
      )?.[2];

      const result = await handler();

      expect(result.content[0].text).toContain('freee-sign-mcp server info:');
      expect(result.content[0].text).toContain('transport: stdio');
    });

    it('sign_server_info が remote transport を返す（remote: true）', async () => {
      addSignAuthenticationTools(mockServer, { remote: true });
      const handler = mockTool.mock.calls.find(
        (call: unknown[]) => call[0] === 'sign_server_info',
      )?.[2];

      const result = await handler();

      expect(result.content[0].text).toContain('transport: remote');
    });
  });
});
