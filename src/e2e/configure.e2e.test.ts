/**
 * E2E tests for the configure CLI command
 * Tests the complete configuration flow without affecting the actual machine settings
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { FullConfig } from '../config/companies.js';
import { mockCompaniesResponse, mockTokenResponse } from './fixtures/api-responses.js';

// Track mock state - isolated from real config
let mockSavedConfig: FullConfig | null = null;
let mockExistingConfig: Partial<FullConfig> = {};
let mockPromptsResponses: Record<string, unknown>[] = [];
let mockPromptsIndex = 0;
let mockAuthCallback: ((code: string) => void) | null = null;
let mockAuthReject: ((error: Error) => void) | null = null;
let consoleLogSpy: ReturnType<typeof vi.spyOn>;
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

// Mock prompts module
vi.mock('prompts', () => ({
  default: vi.fn(async (questions: unknown) => {
    const response = mockPromptsResponses[mockPromptsIndex] || {};
    mockPromptsIndex++;
    return response;
  }),
}));

// Mock open module (prevent browser from opening)
vi.mock('open', () => ({
  default: vi.fn(() => Promise.resolve()),
}));

// Mock config/companies module (prevent file system access)
vi.mock('../config/companies.js', () => ({
  loadFullConfig: vi.fn(() => Promise.resolve({
    clientId: mockExistingConfig.clientId,
    clientSecret: mockExistingConfig.clientSecret,
    callbackPort: mockExistingConfig.callbackPort || 54321,
    defaultCompanyId: mockExistingConfig.defaultCompanyId || '0',
    currentCompanyId: mockExistingConfig.currentCompanyId || '0',
    companies: mockExistingConfig.companies || {},
  })),
  saveFullConfig: vi.fn((config: FullConfig) => {
    mockSavedConfig = config;
    return Promise.resolve();
  }),
}));

// Mock config module
vi.mock('../config.js', () => ({
  loadConfig: vi.fn(() => Promise.resolve()),
  config: {
    freee: {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      apiUrl: 'https://api.freee.co.jp',
    },
    oauth: {
      callbackPort: 54321,
    },
  },
}));

// Mock auth server module
vi.mock('../auth/server.js', () => ({
  startCallbackServer: vi.fn(() => Promise.resolve()),
  stopCallbackServer: vi.fn(),
  getActualRedirectUri: vi.fn(() => 'http://127.0.0.1:54321/callback'),
  getDefaultAuthManager: vi.fn(() => ({
    registerCliAuthHandler: vi.fn((state: string, handler: {
      resolve: (code: string) => void;
      reject: (error: Error) => void;
      codeVerifier: string;
    }) => {
      mockAuthCallback = handler.resolve;
      mockAuthReject = handler.reject;
      // Simulate successful callback after a short delay
      setTimeout(() => {
        if (mockAuthCallback) {
          mockAuthCallback('test-auth-code');
        }
      }, 10);
    }),
    removeCliAuthHandler: vi.fn(),
  })),
}));

// Mock OAuth module
vi.mock('../auth/oauth.js', () => ({
  buildAuthUrl: vi.fn((codeChallenge: string, state: string, redirectUri: string) => {
    return `https://accounts.secure.freee.co.jp/public_api/authorize?client_id=test&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${codeChallenge}&state=${state}`;
  }),
  exchangeCodeForTokens: vi.fn(() => Promise.resolve({
    access_token: mockTokenResponse.access_token,
    refresh_token: mockTokenResponse.refresh_token,
    token_type: mockTokenResponse.token_type,
    expires_in: mockTokenResponse.expires_in,
    scope: mockTokenResponse.scope,
  })),
}));

// Mock global fetch for API calls
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('E2E: Configure Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock state
    mockSavedConfig = null;
    mockExistingConfig = {};
    mockPromptsResponses = [];
    mockPromptsIndex = 0;
    mockAuthCallback = null;
    mockAuthReject = null;

    // Setup console spies
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Stub process.exit to prevent actual exit
    vi.stubGlobal('process', {
      ...process,
      exit: vi.fn(),
    });

    // Setup default fetch mock for companies API
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/1/companies')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCompaniesResponse),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' }),
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Credential Collection', () => {
    it('should collect new credentials when none exist', async () => {
      mockPromptsResponses = [
        // First prompts call: credentials
        {
          clientId: 'new-client-id',
          clientSecret: 'new-client-secret',
          callbackPort: '54321',
        },
        // Second prompts call: company selection
        {
          companyId: 12345,
        },
      ];

      const { configure } = await import('../cli.js');
      await configure();

      expect(mockSavedConfig).not.toBeNull();
      expect(mockSavedConfig?.clientId).toBe('new-client-id');
      expect(mockSavedConfig?.clientSecret).toBe('new-client-secret');
      expect(mockSavedConfig?.callbackPort).toBe(54321);
    });

    it('should allow keeping existing credentials', async () => {
      mockExistingConfig = {
        clientId: 'existing-client-id',
        clientSecret: 'existing-client-secret',
        callbackPort: 54321,
      };

      mockPromptsResponses = [
        // Keep existing clientId, empty clientSecret (keep existing)
        {
          clientId: 'existing-client-id',
          clientSecret: '',
          callbackPort: '54321',
        },
        // Company selection
        {
          companyId: 12345,
        },
      ];

      const { configure } = await import('../cli.js');
      await configure();

      expect(mockSavedConfig?.clientId).toBe('existing-client-id');
      expect(mockSavedConfig?.clientSecret).toBe('existing-client-secret');
    });

    it('should handle cancelled credential input', async () => {
      mockPromptsResponses = [
        // User cancels (no clientId)
        {
          clientId: undefined,
        },
      ];

      const { configure } = await import('../cli.js');
      await configure();

      expect(process.exit).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('キャンセル'));
    });

    it('should require clientSecret for new setup', async () => {
      mockPromptsResponses = [
        {
          clientId: 'new-client-id',
          clientSecret: '',
          callbackPort: '54321',
        },
      ];

      const { configure } = await import('../cli.js');
      await configure();

      expect(process.exit).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('CLIENT_SECRET'));
    });
  });

  describe('OAuth Flow', () => {
    it('should build correct auth URL with PKCE', async () => {
      const { buildAuthUrl } = await import('../auth/oauth.js');

      mockPromptsResponses = [
        {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          callbackPort: '54321',
        },
        {
          companyId: 12345,
        },
      ];

      const { configure } = await import('../cli.js');
      await configure();

      expect(buildAuthUrl).toHaveBeenCalledWith(
        expect.any(String), // codeChallenge
        expect.any(String), // state
        'http://127.0.0.1:54321/callback'
      );
    });

    it('should open browser with auth URL', async () => {
      const open = (await import('open')).default;

      mockPromptsResponses = [
        {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          callbackPort: '54321',
        },
        {
          companyId: 12345,
        },
      ];

      const { configure } = await import('../cli.js');
      await configure();

      expect(open).toHaveBeenCalledWith(expect.stringContaining('accounts.secure.freee.co.jp'));
    });

    it('should exchange auth code for tokens', async () => {
      const { exchangeCodeForTokens } = await import('../auth/oauth.js');

      mockPromptsResponses = [
        {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          callbackPort: '54321',
        },
        {
          companyId: 12345,
        },
      ];

      const { configure } = await import('../cli.js');
      await configure();

      expect(exchangeCodeForTokens).toHaveBeenCalledWith(
        'test-auth-code',
        expect.any(String), // codeVerifier
        'http://127.0.0.1:54321/callback'
      );
    });
  });

  describe('Company Selection', () => {
    it('should fetch and display available companies', async () => {
      mockPromptsResponses = [
        {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          callbackPort: '54321',
        },
        {
          companyId: 12345,
        },
      ];

      const { configure } = await import('../cli.js');
      await configure();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.freee.co.jp/api/1/companies',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Bearer'),
          }),
        })
      );
    });

    it('should save selected company as default', async () => {
      mockPromptsResponses = [
        {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          callbackPort: '54321',
        },
        {
          companyId: 67890, // Select second company
        },
      ];

      const { configure } = await import('../cli.js');
      await configure();

      expect(mockSavedConfig?.defaultCompanyId).toBe('67890');
      expect(mockSavedConfig?.currentCompanyId).toBe('67890');
    });

    it('should save all companies in config', async () => {
      mockPromptsResponses = [
        {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          callbackPort: '54321',
        },
        {
          companyId: 12345,
        },
      ];

      const { configure } = await import('../cli.js');
      await configure();

      expect(mockSavedConfig?.companies).toHaveProperty('12345');
      expect(mockSavedConfig?.companies).toHaveProperty('67890');
      expect(mockSavedConfig?.companies['12345'].name).toBe('テスト株式会社');
      expect(mockSavedConfig?.companies['67890'].name).toBe('サンプル合同会社');
    });

    it('should handle cancelled company selection', async () => {
      mockPromptsResponses = [
        {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          callbackPort: '54321',
        },
        {
          companyId: undefined, // User cancels
        },
      ];

      const { configure } = await import('../cli.js');
      await configure();

      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should handle no available companies', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/1/companies')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ companies: [] }),
          });
        }
        return Promise.resolve({ ok: false, status: 404 });
      });

      mockPromptsResponses = [
        {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          callbackPort: '54321',
        },
      ];

      const { configure } = await import('../cli.js');
      await configure();

      expect(process.exit).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('事業所がありません'));
    });
  });

  describe('Config Saving', () => {
    it('should save complete config with all fields', async () => {
      mockPromptsResponses = [
        {
          clientId: 'final-client-id',
          clientSecret: 'final-client-secret',
          callbackPort: '12345',
        },
        {
          companyId: 12345,
        },
      ];

      const { configure } = await import('../cli.js');
      await configure();

      expect(mockSavedConfig).toEqual(expect.objectContaining({
        clientId: 'final-client-id',
        clientSecret: 'final-client-secret',
        callbackPort: 12345,
        defaultCompanyId: '12345',
        currentCompanyId: '12345',
        companies: expect.objectContaining({
          '12345': expect.objectContaining({
            id: '12345',
            name: 'テスト株式会社',
            description: expect.stringContaining('admin'),
            addedAt: expect.any(Number),
            lastUsed: expect.any(Number),
          }),
        }),
      }));
    });

    it('should display MCP configuration after save', async () => {
      mockPromptsResponses = [
        {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          callbackPort: '54321',
        },
        {
          companyId: 12345,
        },
      ];

      const { configure } = await import('../cli.js');
      await configure();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('MCP設定'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('セットアップ完了'));
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors when fetching companies', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/1/companies')) {
          return Promise.resolve({
            ok: false,
            status: 401,
            json: () => Promise.resolve({ error: 'unauthorized' }),
          });
        }
        return Promise.resolve({ ok: false, status: 404 });
      });

      mockPromptsResponses = [
        {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          callbackPort: '54321',
        },
      ];

      const { configure } = await import('../cli.js');
      await configure();

      expect(process.exit).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error'));
    });

    it('should stop callback server on error', async () => {
      const { stopCallbackServer } = await import('../auth/server.js');

      mockPromptsResponses = [
        {
          clientId: undefined, // Cause early error
        },
      ];

      const { configure } = await import('../cli.js');
      await configure();

      expect(stopCallbackServer).toHaveBeenCalled();
    });

    it('should stop callback server on success', async () => {
      const { stopCallbackServer } = await import('../auth/server.js');

      mockPromptsResponses = [
        {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          callbackPort: '54321',
        },
        {
          companyId: 12345,
        },
      ];

      const { configure } = await import('../cli.js');
      await configure();

      expect(stopCallbackServer).toHaveBeenCalled();
    });
  });

  describe('Environment Isolation', () => {
    it('should not modify actual config files', async () => {
      // This test verifies that our mocking is working correctly
      const { saveFullConfig, loadFullConfig } = await import('../config/companies.js');

      mockPromptsResponses = [
        {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          callbackPort: '54321',
        },
        {
          companyId: 12345,
        },
      ];

      const { configure } = await import('../cli.js');
      await configure();

      // Verify mocked functions were called instead of real file operations
      expect(loadFullConfig).toHaveBeenCalled();
      expect(saveFullConfig).toHaveBeenCalled();

      // The saved config should only be in our mock variable
      expect(mockSavedConfig).not.toBeNull();
    });

    it('should not open actual browser', async () => {
      const open = (await import('open')).default;

      mockPromptsResponses = [
        {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          callbackPort: '54321',
        },
        {
          companyId: 12345,
        },
      ];

      const { configure } = await import('../cli.js');
      await configure();

      // Verify the mock was called (not the real open function)
      expect(vi.isMockFunction(open)).toBe(true);
      expect(open).toHaveBeenCalled();
    });

    it('should not make actual network requests', async () => {
      mockPromptsResponses = [
        {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          callbackPort: '54321',
        },
        {
          companyId: 12345,
        },
      ];

      const { configure } = await import('../cli.js');
      await configure();

      // Verify all fetch calls were through our mock
      expect(mockFetch).toHaveBeenCalled();
      expect(vi.isMockFunction(mockFetch)).toBe(true);
    });
  });

  describe('Full Configuration Flow', () => {
    it('should complete full flow from credentials to saved config', async () => {
      mockPromptsResponses = [
        {
          clientId: 'full-flow-client-id',
          clientSecret: 'full-flow-client-secret',
          callbackPort: '54321',
        },
        {
          companyId: 67890,
        },
      ];

      const { configure } = await import('../cli.js');
      await configure();

      // Verify entire flow completed
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ステップ 1/3'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ステップ 2/3'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ステップ 3/3'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('セットアップ完了'));

      // Verify final config state
      expect(mockSavedConfig).toEqual(expect.objectContaining({
        clientId: 'full-flow-client-id',
        clientSecret: 'full-flow-client-secret',
        callbackPort: 54321,
        defaultCompanyId: '67890',
        currentCompanyId: '67890',
      }));

      // Verify process did not exit with error
      expect(process.exit).not.toHaveBeenCalled();
    });
  });
});
