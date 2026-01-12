import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import crypto from 'crypto';
import { addAuthenticationTools } from './tools.js';

vi.mock('crypto');
vi.mock('../config.js', () => ({
  config: {
    freee: {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      companyId: '12345'
    },
    oauth: {
      redirectUri: 'http://127.0.0.1:54321/callback',
      callbackPort: 54321
    }
  }
}));

vi.mock('../config/companies.js', () => ({
  getCurrentCompanyId: vi.fn().mockResolvedValue('12345'),
  getCompanyInfo: vi.fn().mockResolvedValue({
    id: '12345',
    name: 'Demo Company',
    addedAt: Date.now()
  })
}));

const { getCurrentCompanyId, getCompanyInfo } = await import('../config/companies.js');

vi.mock('../api/client.js', () => ({
  makeApiRequest: vi.fn()
}));

vi.mock('../auth/tokens.js', () => ({
  loadTokens: vi.fn(),
  clearTokens: vi.fn()
}));

vi.mock('../auth/oauth.js', () => ({
  generatePKCE: vi.fn(),
  buildAuthUrl: vi.fn()
}));

vi.mock('../auth/server.js', () => ({
  registerAuthenticationRequest: vi.fn(),
  getActualRedirectUri: vi.fn()
}));

const mockCrypto = vi.mocked(crypto);

describe('tools', () => {
  let mockServer: McpServer;
  let mockTool: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockTool = vi.fn();
    mockServer = {
      tool: mockTool
    } as unknown as McpServer;
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // モック関数を確実に設定
    vi.mocked(getCurrentCompanyId).mockResolvedValue('12345');
    vi.mocked(getCompanyInfo).mockResolvedValue({
      id: '12345',
      name: 'Demo Company',
      addedAt: Date.now()
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('addAuthenticationTools', () => {
    it('should register authentication tools', () => {
      addAuthenticationTools(mockServer);

      expect(mockTool).toHaveBeenCalledTimes(7);
      expect(mockTool).toHaveBeenCalledWith('freee_current_user', expect.any(String), {}, expect.any(Function));
      expect(mockTool).toHaveBeenCalledWith('freee_authenticate', expect.any(String), {}, expect.any(Function));
      expect(mockTool).toHaveBeenCalledWith('freee_auth_status', expect.any(String), {}, expect.any(Function));
      expect(mockTool).toHaveBeenCalledWith('freee_clear_auth', expect.any(String), {}, expect.any(Function));
    });

    describe('freee_current_user', () => {
      it('should return user info when authenticated', async () => {
        const mockMakeApiRequest = await import('../api/client.js');
        const mockUserInfo = { user: { id: 1, email: 'test@example.com' } };
        vi.mocked(mockMakeApiRequest.makeApiRequest).mockResolvedValue(mockUserInfo);

        addAuthenticationTools(mockServer);
        const handler = mockTool.mock.calls.find(call => call[0] === 'freee_current_user')?.[3];
        
        const result = await handler();

        expect(result.content[0].text).toContain('現在のユーザー情報');
        expect(result.content[0].text).toContain('会社ID: 12345');
        expect(result.content[0].text).toContain(JSON.stringify(mockUserInfo, null, 2));
      });

      it('should handle authentication error', async () => {
        const mockMakeApiRequest = await import('../api/client.js');
        vi.mocked(mockMakeApiRequest.makeApiRequest).mockRejectedValue(new Error('Authentication required'));

        addAuthenticationTools(mockServer);
        const handler = mockTool.mock.calls.find(call => call[0] === 'freee_current_user')?.[3];
        
        const result = await handler();

        expect(result.content[0].text).toContain('ユーザー情報の取得に失敗');
        expect(result.content[0].text).toContain('Authentication required');
      });
    });

    describe('freee_authenticate', () => {
      it('should start OAuth authentication', async () => {
        const mockGeneratePKCE = await import('../auth/oauth.js');
        const mockBuildAuthUrl = await import('../auth/oauth.js');
        const mockRegisterAuthenticationRequest = await import('../auth/server.js');

        vi.mocked(mockGeneratePKCE.generatePKCE).mockReturnValue({
          codeVerifier: 'test-verifier',
          codeChallenge: 'test-challenge'
        });
        vi.mocked(mockBuildAuthUrl.buildAuthUrl).mockReturnValue('https://auth.url');
        vi.mocked(mockRegisterAuthenticationRequest.getActualRedirectUri).mockReturnValue('http://127.0.0.1:54321/callback');
        mockCrypto.randomBytes = vi.fn().mockReturnValue({
          toString: vi.fn().mockReturnValue('test-state-hex')
        });

        addAuthenticationTools(mockServer);
        const handler = mockTool.mock.calls.find(call => call[0] === 'freee_authenticate')?.[3];
        
        const result = await handler();

        expect(mockGeneratePKCE.generatePKCE).toHaveBeenCalled();
        expect(mockRegisterAuthenticationRequest.getActualRedirectUri).toHaveBeenCalled();
        expect(mockBuildAuthUrl.buildAuthUrl).toHaveBeenCalledWith(
          'test-challenge',
          'test-state-hex',
          'http://127.0.0.1:54321/callback'
        );
        expect(mockRegisterAuthenticationRequest.registerAuthenticationRequest).toHaveBeenCalledWith(
          'test-state-hex',
          'test-verifier'
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
          token_type: 'Bearer'
        };
        vi.mocked(mockLoadTokens.loadTokens).mockResolvedValue(mockTokens);

        addAuthenticationTools(mockServer);
        const handler = mockTool.mock.calls.find(call => call[0] === 'freee_auth_status')?.[3];
        
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
          token_type: 'Bearer'
        };
        vi.mocked(mockLoadTokens.loadTokens).mockResolvedValue(mockTokens);

        addAuthenticationTools(mockServer);
        const handler = mockTool.mock.calls.find(call => call[0] === 'freee_auth_status')?.[3];
        
        const result = await handler();

        expect(result.content[0].text).toContain('認証状態: 期限切れ');
        expect(result.content[0].text).toContain('次回API使用時に自動更新されます');
      });

      it('should handle no tokens', async () => {
        const mockLoadTokens = await import('../auth/tokens.js');
        vi.mocked(mockLoadTokens.loadTokens).mockResolvedValue(null);

        addAuthenticationTools(mockServer);
        const handler = mockTool.mock.calls.find(call => call[0] === 'freee_auth_status')?.[3];
        
        const result = await handler();

        expect(result.content[0].text).toContain('未認証');
      });
    });

    describe('freee_clear_auth', () => {
      it('should clear authentication tokens', async () => {
        const mockClearTokens = await import('../auth/tokens.js');
        vi.mocked(mockClearTokens.clearTokens).mockResolvedValue();

        addAuthenticationTools(mockServer);
        const handler = mockTool.mock.calls.find(call => call[0] === 'freee_clear_auth')?.[3];
        
        const result = await handler();

        expect(mockClearTokens.clearTokens).toHaveBeenCalled();
        expect(result.content[0].text).toContain('認証情報をクリアしました');
      });

      it('should handle clear tokens error', async () => {
        const mockClearTokens = await import('../auth/tokens.js');
        vi.mocked(mockClearTokens.clearTokens).mockRejectedValue(new Error('Permission denied'));

        addAuthenticationTools(mockServer);
        const handler = mockTool.mock.calls.find(call => call[0] === 'freee_clear_auth')?.[3];

        const result = await handler();

        expect(result.content[0].text).toContain('認証情報のクリアに失敗');
        expect(result.content[0].text).toContain('Permission denied');
      });
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
        const handler = mockTool.mock.calls.find(call => call[0] === 'freee_list_companies')?.[3];

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
        const handler = mockTool.mock.calls.find(call => call[0] === 'freee_list_companies')?.[3];

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
        const handler = mockTool.mock.calls.find(call => call[0] === 'freee_list_companies')?.[3];

        const result = await handler();

        expect(result.content[0].text).toContain('APIレスポンスの形式が不正です');
      });

      it('should handle API error', async () => {
        const mockMakeApiRequest = await import('../api/client.js');
        vi.mocked(mockMakeApiRequest.makeApiRequest).mockRejectedValue(new Error('API Error'));

        addAuthenticationTools(mockServer);
        const handler = mockTool.mock.calls.find(call => call[0] === 'freee_list_companies')?.[3];

        const result = await handler();

        expect(result.content[0].text).toContain('事業所一覧の取得に失敗');
        expect(result.content[0].text).toContain('API Error');
      });
    });
  });
});