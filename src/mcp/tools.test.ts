import crypto from 'node:crypto';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addAuthenticationTools } from './tools.js';

vi.mock('crypto');
vi.mock('../config.js', () => ({
  getConfig: (): {
    freee: { clientId: string; clientSecret: string; companyId: string };
    oauth: { redirectUri: string; callbackPort: number };
  } => ({
    freee: {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      companyId: '12345',
    },
    oauth: {
      redirectUri: 'http://127.0.0.1:54321/callback',
      callbackPort: 54321,
    },
  }),
}));

vi.mock('../config/companies.js', () => ({
  getCurrentCompanyId: vi.fn().mockResolvedValue('12345'),
  getCompanyInfo: vi.fn().mockResolvedValue({
    id: '12345',
    name: 'Demo Company',
    addedAt: Date.now(),
  }),
}));

const { getCurrentCompanyId, getCompanyInfo } = await import('../config/companies.js');

vi.mock('../api/client.js', () => ({
  makeApiRequest: vi.fn(),
}));

vi.mock('../auth/tokens.js', () => ({
  loadTokens: vi.fn(),
  clearTokens: vi.fn(),
}));

vi.mock('../auth/oauth.js', () => ({
  generatePKCE: vi.fn(),
  buildAuthUrl: vi.fn(),
}));

vi.mock('../auth/server.js', () => ({
  registerAuthenticationRequest: vi.fn(),
  getActualRedirectUri: vi.fn(),
  startCallbackServerWithAutoStop: vi.fn().mockResolvedValue(undefined),
}));

const mockCrypto = vi.mocked(crypto);

describe('tools', () => {
  let mockServer: McpServer;
  let mockTool: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockTool = vi.fn();
    mockServer = {
      registerTool: mockTool,
    } as unknown as McpServer;
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // モック関数を確実に設定
    vi.mocked(getCurrentCompanyId).mockResolvedValue('12345');
    vi.mocked(getCompanyInfo).mockResolvedValue({
      id: '12345',
      name: 'Demo Company',
      addedAt: Date.now(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('addAuthenticationTools', () => {
    it('should register authentication tools', () => {
      addAuthenticationTools(mockServer);

      expect(mockTool).toHaveBeenCalledTimes(8);
      expect(mockTool).toHaveBeenCalledWith(
        'freee_current_user',
        expect.objectContaining({ title: '現在のユーザー情報', description: expect.any(String) }),
        expect.any(Function),
      );
      expect(mockTool).toHaveBeenCalledWith(
        'freee_authenticate',
        expect.objectContaining({ title: 'OAuth認証', description: expect.any(String) }),
        expect.any(Function),
      );
      expect(mockTool).toHaveBeenCalledWith(
        'freee_auth_status',
        expect.objectContaining({ title: '認証状態確認', description: expect.any(String) }),
        expect.any(Function),
      );
      expect(mockTool).toHaveBeenCalledWith(
        'freee_clear_auth',
        expect.objectContaining({ title: '認証情報クリア', description: expect.any(String) }),
        expect.any(Function),
      );
      expect(mockTool).toHaveBeenCalledWith(
        'freee_server_info',
        expect.objectContaining({ title: 'サーバー情報', description: expect.any(String) }),
        expect.any(Function),
      );
    });

    describe('freee_server_info', () => {
      it('should return server info with stdio transport by default', async () => {
        addAuthenticationTools(mockServer);
        const handler = mockTool.mock.calls.find((call) => call[0] === 'freee_server_info')?.[2];

        const result = await handler();

        expect(result.content[0].text).toContain('freee-mcp server info:');
        expect(result.content[0].text).toContain('version:');
        expect(result.content[0].text).toContain('transport: stdio');
      });

      it('should return remote transport when remote option is true', async () => {
        addAuthenticationTools(mockServer, { remote: true });
        const handler = mockTool.mock.calls.find((call) => call[0] === 'freee_server_info')?.[2];

        const result = await handler();

        expect(result.content[0].text).toContain('transport: remote');
      });
    });

    describe('freee_current_user', () => {
      it('should return user info when authenticated', async () => {
        const mockMakeApiRequest = await import('../api/client.js');
        const mockUserInfo = { user: { id: 1, email: 'test@example.com' } };
        vi.mocked(mockMakeApiRequest.makeApiRequest).mockResolvedValue(mockUserInfo);

        addAuthenticationTools(mockServer);
        const handler = mockTool.mock.calls.find((call) => call[0] === 'freee_current_user')?.[2];

        const result = await handler();

        expect(result.content[0].text).toContain('現在のユーザー情報');
        expect(result.content[0].text).toContain('会社ID: 12345');
        expect(result.content[0].text).toContain(JSON.stringify(mockUserInfo, null, 2));
      });

      it('should handle authentication error', async () => {
        const mockMakeApiRequest = await import('../api/client.js');
        vi.mocked(mockMakeApiRequest.makeApiRequest).mockRejectedValue(
          new Error('Authentication required'),
        );

        addAuthenticationTools(mockServer);
        const handler = mockTool.mock.calls.find((call) => call[0] === 'freee_current_user')?.[2];

        const result = await handler();

        expect(result.content[0].text).toContain('ユーザー情報の取得に失敗');
        expect(result.content[0].text).toContain('Authentication required');
      });
    });

    describe('freee_authenticate', () => {
      it('should start OAuth authentication', async () => {
        const mockGeneratePKCE = await import('../auth/oauth.js');
        const mockBuildAuthUrl = await import('../auth/oauth.js');
        const mockServerModule = await import('../auth/server.js');

        vi.mocked(mockGeneratePKCE.generatePKCE).mockReturnValue({
          codeVerifier: 'test-verifier',
          codeChallenge: 'test-challenge',
        });
        vi.mocked(mockBuildAuthUrl.buildAuthUrl).mockReturnValue('https://auth.url');
        vi.mocked(mockServerModule.getActualRedirectUri).mockReturnValue(
          'http://127.0.0.1:54321/callback',
        );
        vi.mocked(mockServerModule.startCallbackServerWithAutoStop).mockResolvedValue(undefined);
        mockCrypto.randomBytes = vi.fn().mockReturnValue({
          toString: vi.fn().mockReturnValue('test-state-hex'),
        });

        addAuthenticationTools(mockServer);
        const handler = mockTool.mock.calls.find((call) => call[0] === 'freee_authenticate')?.[2];

        const result = await handler();

        expect(mockServerModule.startCallbackServerWithAutoStop).toHaveBeenCalledWith(300000); // AUTH_TIMEOUT_MS
        expect(mockGeneratePKCE.generatePKCE).toHaveBeenCalled();
        expect(mockServerModule.getActualRedirectUri).toHaveBeenCalled();
        expect(mockBuildAuthUrl.buildAuthUrl).toHaveBeenCalledWith(
          'test-challenge',
          'test-state-hex',
          'http://127.0.0.1:54321/callback',
        );
        expect(mockServerModule.registerAuthenticationRequest).toHaveBeenCalledWith(
          'test-state-hex',
          'test-verifier',
        );
        expect(result.content[0].text).toContain('認証URL:');
        expect(result.content[0].text).toContain('https://auth.url');
      });
    });

    describe('freee_auth_status', () => {
      it('should return valid token status', async () => {
        const mockLoadTokens = await import('../auth/tokens.js');
        const mockTokens = {
          access_token: 'test-access-token-12345',
          refresh_token: 'test-refresh-token',
          expires_at: Date.now() + 3600000,
          scope: 'read write',
          token_type: 'Bearer',
        };
        vi.mocked(mockLoadTokens.loadTokens).mockResolvedValue(mockTokens);

        addAuthenticationTools(mockServer);
        const handler = mockTool.mock.calls.find((call) => call[0] === 'freee_auth_status')?.[2];

        const result = await handler();

        expect(result.content[0].text).toContain('認証状態: 有効');
        expect(result.content[0].text).toContain('有効期限:');
      });

      it('should return expired token status', async () => {
        const mockLoadTokens = await import('../auth/tokens.js');
        const mockTokens = {
          access_token: 'expired-token-12345',
          refresh_token: 'test-refresh-token',
          expires_at: Date.now() - 3600000,
          scope: 'read write',
          token_type: 'Bearer',
        };
        vi.mocked(mockLoadTokens.loadTokens).mockResolvedValue(mockTokens);

        addAuthenticationTools(mockServer);
        const handler = mockTool.mock.calls.find((call) => call[0] === 'freee_auth_status')?.[2];

        const result = await handler();

        expect(result.content[0].text).toContain('認証状態: 期限切れ');
        expect(result.content[0].text).toContain('次回API使用時に自動更新されます');
      });

      it('should handle no tokens', async () => {
        const mockLoadTokens = await import('../auth/tokens.js');
        vi.mocked(mockLoadTokens.loadTokens).mockResolvedValue(null);

        addAuthenticationTools(mockServer);
        const handler = mockTool.mock.calls.find((call) => call[0] === 'freee_auth_status')?.[2];

        const result = await handler();

        expect(result.content[0].text).toContain('未認証');
      });
    });

    describe('freee_clear_auth', () => {
      it('should clear authentication tokens', async () => {
        const mockClearTokens = await import('../auth/tokens.js');
        vi.mocked(mockClearTokens.clearTokens).mockResolvedValue();

        addAuthenticationTools(mockServer);
        const handler = mockTool.mock.calls.find((call) => call[0] === 'freee_clear_auth')?.[2];

        const result = await handler();

        expect(mockClearTokens.clearTokens).toHaveBeenCalled();
        expect(result.content[0].text).toContain('認証情報をクリアしました');
      });

      it('should handle clear tokens error', async () => {
        const mockClearTokens = await import('../auth/tokens.js');
        vi.mocked(mockClearTokens.clearTokens).mockRejectedValue(new Error('Permission denied'));

        addAuthenticationTools(mockServer);
        const handler = mockTool.mock.calls.find((call) => call[0] === 'freee_clear_auth')?.[2];

        const result = await handler();

        expect(result.content[0].text).toContain('認証情報のクリアに失敗');
        expect(result.content[0].text).toContain('Permission denied');
      });
    });

    describe('zero-arg tool callback receives extra as first argument', () => {
      // MCP SDK 1.28.0+ の registerTool で inputSchema を指定しない場合、
      // コールバックのシグネチャは (extra) => ... となる（(args, extra) ではない）。
      // この仕様に違反するとRemoteモードでトークンコンテキストが渡らず認証が壊れる。

      const mockTokenStore = {
        loadTokens: vi.fn(),
        saveTokens: vi.fn(),
        clearTokens: vi.fn(),
        getValidAccessToken: vi.fn(),
        getCurrentCompanyId: vi.fn().mockResolvedValue('99999'),
        setCurrentCompany: vi.fn(),
        getCompanyInfo: vi.fn().mockResolvedValue({ id: '99999', name: 'Remote Co' }),
      };

      const remoteExtra = {
        authInfo: {
          extra: { tokenStore: mockTokenStore, userId: 'remote-user-1' },
        },
      };

      const zeroArgToolNames = [
        'freee_current_user',
        'freee_auth_status',
        'freee_clear_auth',
        'freee_get_current_company',
        'freee_list_companies',
      ];

      for (const toolName of zeroArgToolNames) {
        it(`${toolName}: should use tokenStore from extra (not fallback)`, async () => {
          const mockMakeApiRequest = await import('../api/client.js');
          vi.mocked(mockMakeApiRequest.makeApiRequest).mockResolvedValue({
            user: { id: 1 },
            companies: [{ id: 99999, name: 'Remote Co' }],
          });
          mockTokenStore.loadTokens.mockResolvedValue({
            access_token: 'remote-token',
            refresh_token: 'refresh',
            expires_at: Date.now() + 3600000,
            scope: 'read write',
            token_type: 'Bearer',
          });

          addAuthenticationTools(mockServer);
          const handler = mockTool.mock.calls.find((call) => call[0] === toolName)?.[2];
          expect(handler).toBeDefined();

          // SDK の zero-arg ツールは extra を第1引数として渡す
          await handler(remoteExtra);

          // fallback (FileTokenStore) ではなく、extra 経由の mockTokenStore が使われたことを検証
          const calledMethods = [
            ...mockTokenStore.loadTokens.mock.calls,
            ...mockTokenStore.getCurrentCompanyId.mock.calls,
            ...mockTokenStore.clearTokens.mock.calls,
            ...mockTokenStore.getCompanyInfo.mock.calls,
          ];
          expect(calledMethods.length).toBeGreaterThan(0);

          // userId が 'remote-user-1' で呼ばれたことを検証（'local' fallback ではない）
          const allUserIds = calledMethods.map((call) => call[0]);
          expect(allUserIds.every((id) => id === 'remote-user-1')).toBe(true);

          vi.clearAllMocks();
        });
      }
    });

    describe('freee_list_companies', () => {
      it('should return company list when API response is valid', async () => {
        const mockMakeApiRequest = await import('../api/client.js');
        const validResponse = {
          companies: [
            { id: 123, name: 'Company A' },
            { id: 456, name: 'Company B' },
          ],
        };
        vi.mocked(mockMakeApiRequest.makeApiRequest).mockResolvedValue(validResponse);

        addAuthenticationTools(mockServer);
        const handler = mockTool.mock.calls.find((call) => call[0] === 'freee_list_companies')?.[2];

        const result = await handler();

        expect(result.content[0].text).toContain('事業所一覧:');
        expect(result.content[0].text).toContain('Company A');
        expect(result.content[0].text).toContain('Company B');
      });

      it('should return error message for invalid API response structure', async () => {
        const mockMakeApiRequest = await import('../api/client.js');
        const invalidResponse = { invalid: 'data' };
        vi.mocked(mockMakeApiRequest.makeApiRequest).mockResolvedValue(invalidResponse);

        addAuthenticationTools(mockServer);
        const handler = mockTool.mock.calls.find((call) => call[0] === 'freee_list_companies')?.[2];

        const result = await handler();

        expect(result.content[0].text).toContain('事業所情報を取得できませんでした');
      });

      it('should return error message when companies array has wrong types', async () => {
        const mockMakeApiRequest = await import('../api/client.js');
        const invalidResponse = {
          companies: [
            { id: 'string-id', name: 123 }, // id should be number, name should be string
          ],
        };
        vi.mocked(mockMakeApiRequest.makeApiRequest).mockResolvedValue(invalidResponse);

        addAuthenticationTools(mockServer);
        const handler = mockTool.mock.calls.find((call) => call[0] === 'freee_list_companies')?.[2];

        const result = await handler();

        expect(result.content[0].text).toContain('APIレスポンスの形式が不正です');
      });

      it('should handle companies with null name', async () => {
        const mockMakeApiRequest = await import('../api/client.js');
        const responseWithNullName = {
          companies: [
            { id: 123, name: 'Company A' },
            { id: 456, name: null },
            { id: 789, name: 'Company C' },
          ],
        };
        vi.mocked(mockMakeApiRequest.makeApiRequest).mockResolvedValue(responseWithNullName);

        addAuthenticationTools(mockServer);
        const handler = mockTool.mock.calls.find((call) => call[0] === 'freee_list_companies')?.[2];

        const result = await handler();

        expect(result.content[0].text).toContain('事業所一覧:');
        expect(result.content[0].text).toContain('Company A');
        expect(result.content[0].text).toContain('(名称未設定) (456)');
        expect(result.content[0].text).toContain('Company C');
      });

      it('should handle API error', async () => {
        const mockMakeApiRequest = await import('../api/client.js');
        vi.mocked(mockMakeApiRequest.makeApiRequest).mockRejectedValue(new Error('API Error'));

        addAuthenticationTools(mockServer);
        const handler = mockTool.mock.calls.find((call) => call[0] === 'freee_list_companies')?.[2];

        const result = await handler();

        expect(result.content[0].text).toContain('事業所一覧の取得に失敗');
        expect(result.content[0].text).toContain('API Error');
      });
    });
  });
});
