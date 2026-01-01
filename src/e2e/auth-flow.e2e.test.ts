/**
 * E2E tests for authentication flow
 * Tests the complete authentication flow from tool invocation to token management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { addAuthenticationTools } from '../mcp/tools.js';
import { setupMockApi, clearMockApi } from './mock-api.js';
import {
  mockUserResponse,
  mockCompaniesResponse,
  mockTokenResponse,
} from './fixtures/api-responses.js';
import { TokenData } from '../auth/tokens.js';

// Track mock function state
let mockTokenData: TokenData | null = null;
let mockCompanyId: string = '12345';

// Mock config module
vi.mock('../config.js', () => ({
  config: {
    freee: {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      apiUrl: 'https://api.freee.co.jp',
      companyId: '12345',
    },
    oauth: {
      callbackPort: 54321,
    },
  },
}));

// Mock companies module
vi.mock('../config/companies.js', () => ({
  getCurrentCompanyId: vi.fn(() => Promise.resolve(mockCompanyId)),
  setCurrentCompany: vi.fn((id: string) => {
    mockCompanyId = id;
    return Promise.resolve();
  }),
  getCompanyInfo: vi.fn((id: string) => {
    return Promise.resolve({
      id,
      name: id === '12345' ? 'テスト株式会社' : 'サンプル合同会社',
    });
  }),
}));

// Mock tokens module
vi.mock('../auth/tokens.js', () => ({
  loadTokens: vi.fn(() => Promise.resolve(mockTokenData)),
  saveTokens: vi.fn((data: TokenData) => {
    mockTokenData = data;
    return Promise.resolve();
  }),
  clearTokens: vi.fn(() => {
    mockTokenData = null;
    return Promise.resolve();
  }),
  getValidAccessToken: vi.fn(() => {
    if (!mockTokenData) return Promise.resolve(null);
    return Promise.resolve(mockTokenData.access_token);
  }),
}));

// Mock OAuth module
vi.mock('../auth/oauth.js', () => ({
  generatePKCE: vi.fn(() => ({
    codeVerifier: 'test-code-verifier',
    codeChallenge: 'test-code-challenge',
  })),
  buildAuthUrl: vi.fn((codeChallenge: string, state: string, redirectUri: string) => {
    return `https://accounts.secure.freee.co.jp/public_api/authorize?client_id=test-client-id&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${codeChallenge}&state=${state}`;
  }),
  exchangeCodeForTokens: vi.fn(),
}));

// Mock auth server module
vi.mock('../auth/server.js', () => ({
  registerAuthenticationRequest: vi.fn(),
  getActualRedirectUri: vi.fn(() => 'http://127.0.0.1:54321/callback'),
}));

// Mock API client
vi.mock('../api/client.js', () => ({
  makeApiRequest: vi.fn((method: string, path: string) => {
    if (path === '/api/1/users/me') {
      return Promise.resolve(mockUserResponse);
    }
    if (path === '/api/1/companies') {
      return Promise.resolve(mockCompaniesResponse);
    }
    return Promise.resolve({});
  }),
}));

describe('E2E: Authentication Flow', () => {
  let server: McpServer;
  let registeredTools: Map<string, {
    description: string;
    schema: unknown;
    handler: (args: Record<string, unknown>) => Promise<unknown>;
  }>;

  beforeEach(() => {
    vi.clearAllMocks();
    setupMockApi();

    // Reset mock state
    mockTokenData = null;
    mockCompanyId = '12345';

    // Create a mock MCP server that captures registered tools
    registeredTools = new Map();
    server = {
      tool: vi.fn((
        name: string,
        description: string,
        schema: unknown,
        handler: (args: Record<string, unknown>) => Promise<unknown>
      ) => {
        registeredTools.set(name, { description, schema, handler });
      }),
    } as unknown as McpServer;

    // Generate authentication tools
    addAuthenticationTools(server);
  });

  afterEach(() => {
    clearMockApi();
    vi.restoreAllMocks();
  });

  describe('Tool Registration', () => {
    it('should register all authentication tools', () => {
      expect(registeredTools.has('freee_authenticate')).toBe(true);
      expect(registeredTools.has('freee_auth_status')).toBe(true);
      expect(registeredTools.has('freee_clear_auth')).toBe(true);
      expect(registeredTools.has('freee_current_user')).toBe(true);
      expect(registeredTools.has('freee_set_current_company')).toBe(true);
      expect(registeredTools.has('freee_get_current_company')).toBe(true);
      expect(registeredTools.has('freee_list_companies')).toBe(true);
    });
  });

  describe('freee_authenticate', () => {
    it('should return authentication URL', async () => {
      const handler = registeredTools.get('freee_authenticate')!.handler;

      const result = await handler({}) as { content: Array<{ type: string; text: string }> };

      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('認証URL');
      expect(result.content[0].text).toContain('accounts.secure.freee.co.jp');
    });

    it('should include PKCE code challenge in URL', async () => {
      const handler = registeredTools.get('freee_authenticate')!.handler;

      const result = await handler({}) as { content: Array<{ type: string; text: string }> };

      expect(result.content[0].text).toContain('code_challenge');
    });

    it('should include state parameter in URL', async () => {
      const handler = registeredTools.get('freee_authenticate')!.handler;

      const result = await handler({}) as { content: Array<{ type: string; text: string }> };

      expect(result.content[0].text).toContain('state');
    });
  });

  describe('freee_auth_status', () => {
    it('should return unauthenticated status when no tokens', async () => {
      mockTokenData = null;

      const handler = registeredTools.get('freee_auth_status')!.handler;
      const result = await handler({}) as { content: Array<{ type: string; text: string }> };

      expect(result.content[0].text).toContain('未認証');
    });

    it('should return valid status when tokens exist and not expired', async () => {
      mockTokenData = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: Date.now() + 3600000, // 1 hour in future
        token_type: 'Bearer',
        scope: 'read write',
      };

      const handler = registeredTools.get('freee_auth_status')!.handler;
      const result = await handler({}) as { content: Array<{ type: string; text: string }> };

      expect(result.content[0].text).toContain('有効');
    });

    it('should return expired status when tokens expired', async () => {
      mockTokenData = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: Date.now() - 3600000, // 1 hour in past
        token_type: 'Bearer',
        scope: 'read write',
      };

      const handler = registeredTools.get('freee_auth_status')!.handler;
      const result = await handler({}) as { content: Array<{ type: string; text: string }> };

      expect(result.content[0].text).toContain('期限切れ');
    });
  });

  describe('freee_clear_auth', () => {
    it('should clear authentication tokens', async () => {
      mockTokenData = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: Date.now() + 3600000,
        token_type: 'Bearer',
        scope: 'read write',
      };

      const handler = registeredTools.get('freee_clear_auth')!.handler;
      const result = await handler({}) as { content: Array<{ type: string; text: string }> };

      expect(result.content[0].text).toContain('クリアしました');
      expect(mockTokenData).toBeNull();
    });
  });

  describe('freee_current_user', () => {
    it('should return current user info when authenticated', async () => {
      mockTokenData = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: Date.now() + 3600000,
        token_type: 'Bearer',
        scope: 'read write',
      };

      const handler = registeredTools.get('freee_current_user')!.handler;
      const result = await handler({}) as { content: Array<{ type: string; text: string }> };

      expect(result.content[0].text).toContain('ユーザー情報');
      expect(result.content[0].text).toContain('12345');
    });
  });

  describe('freee_set_current_company', () => {
    it('should set current company', async () => {
      const handler = registeredTools.get('freee_set_current_company')!.handler;

      const result = await handler({
        company_id: '67890',
        name: 'サンプル合同会社',
      }) as { content: Array<{ type: string; text: string }> };

      expect(result.content[0].text).toContain('事業所を設定');
      expect(mockCompanyId).toBe('67890');
    });

    it('should set company without name', async () => {
      const handler = registeredTools.get('freee_set_current_company')!.handler;

      const result = await handler({
        company_id: '99999',
      }) as { content: Array<{ type: string; text: string }> };

      expect(result.content[0].text).toContain('事業所を設定');
    });
  });

  describe('freee_get_current_company', () => {
    it('should return current company info', async () => {
      const handler = registeredTools.get('freee_get_current_company')!.handler;

      const result = await handler({}) as { content: Array<{ type: string; text: string }> };

      expect(result.content[0].text).toContain('事業所');
      expect(result.content[0].text).toContain('12345');
    });
  });

  describe('freee_list_companies', () => {
    it('should list available companies', async () => {
      mockTokenData = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: Date.now() + 3600000,
        token_type: 'Bearer',
        scope: 'read write',
      };

      const handler = registeredTools.get('freee_list_companies')!.handler;
      const result = await handler({}) as { content: Array<{ type: string; text: string }> };

      expect(result.content[0].text).toContain('事業所一覧');
      expect(result.content[0].text).toContain('テスト株式会社');
    });

    it('should mark current company in list', async () => {
      mockTokenData = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: Date.now() + 3600000,
        token_type: 'Bearer',
        scope: 'read write',
      };

      const handler = registeredTools.get('freee_list_companies')!.handler;
      const result = await handler({}) as { content: Array<{ type: string; text: string }> };

      // Current company should be marked
      expect(result.content[0].text).toContain('*');
    });
  });

  describe('Full Authentication Flow', () => {
    it('should handle complete auth -> check status -> use API -> clear flow', async () => {
      // Step 1: Initial status should be unauthenticated
      let handler = registeredTools.get('freee_auth_status')!.handler;
      let result = await handler({}) as { content: Array<{ type: string; text: string }> };
      expect(result.content[0].text).toContain('未認証');

      // Step 2: Start authentication
      handler = registeredTools.get('freee_authenticate')!.handler;
      result = await handler({}) as { content: Array<{ type: string; text: string }> };
      expect(result.content[0].text).toContain('認証URL');

      // Step 3: Simulate token receipt (in real flow, this happens via callback)
      mockTokenData = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_at: Date.now() + 3600000,
        token_type: 'Bearer',
        scope: 'read write',
      };

      // Step 4: Check status should now be authenticated
      handler = registeredTools.get('freee_auth_status')!.handler;
      result = await handler({}) as { content: Array<{ type: string; text: string }> };
      expect(result.content[0].text).toContain('有効');

      // Step 5: Get current user
      handler = registeredTools.get('freee_current_user')!.handler;
      result = await handler({}) as { content: Array<{ type: string; text: string }> };
      expect(result.content[0].text).toContain('ユーザー情報');

      // Step 6: Clear authentication
      handler = registeredTools.get('freee_clear_auth')!.handler;
      result = await handler({}) as { content: Array<{ type: string; text: string }> };
      expect(result.content[0].text).toContain('クリア');

      // Step 7: Status should be unauthenticated again
      handler = registeredTools.get('freee_auth_status')!.handler;
      result = await handler({}) as { content: Array<{ type: string; text: string }> };
      expect(result.content[0].text).toContain('未認証');
    });
  });
});
