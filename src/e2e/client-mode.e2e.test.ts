/**
 * E2E tests for client mode (freee_api_get, freee_api_post, etc.)
 * Tests the complete flow from MCP tool invocation to API response
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateClientModeTool } from '../openapi/client-mode.js';
import { mockDealResponse, mockDealsResponse, mockUserResponse } from './fixtures/api-responses.js';

// Track API calls for assertions
interface ApiCall {
  method: string;
  path: string;
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
  baseUrl?: string;
}
const apiCalls: ApiCall[] = [];

// Configurable mock behavior
let mockApiError: Error | null = null;
let mockApiResponse: unknown = null;

// Mock dependencies
vi.mock('../config.js', () => ({
  config: {
    freee: {
      apiUrl: 'https://api.freee.co.jp',
      companyId: '12345',
    },
  },
}));

vi.mock('../config/companies.js', () => ({
  getCurrentCompanyId: vi.fn().mockResolvedValue('12345'),
}));

vi.mock('../auth/tokens.js', () => ({
  getValidAccessToken: vi.fn().mockResolvedValue('mock-access-token'),
}));

// Mock the API client with configurable behavior
vi.mock('../api/client.js', () => ({
  makeApiRequest: vi.fn(
    async (
      method: string,
      path: string,
      params?: Record<string, unknown>,
      body?: Record<string, unknown>,
      baseUrl?: string,
    ) => {
      // Record the API call
      apiCalls.push({ method, path, params, body, baseUrl });

      // Check for configured error
      if (mockApiError) {
        throw mockApiError;
      }

      // Check for configured response
      if (mockApiResponse !== null) {
        return mockApiResponse;
      }

      // Default responses based on path
      if (path === '/api/1/users/me') {
        return mockUserResponse;
      }
      if (path === '/api/1/deals') {
        if (method === 'GET') return mockDealsResponse;
        if (method === 'POST') return mockDealResponse;
      }
      if (path.match(/^\/api\/1\/deals\/\d+$/)) {
        if (method === 'GET' || method === 'PUT') return mockDealResponse;
        if (method === 'DELETE') return {};
      }

      return {};
    },
  ),
  isBinaryFileResponse: vi.fn((result: unknown): boolean => {
    return (
      typeof result === 'object' &&
      result !== null &&
      'type' in result &&
      (result as { type: string }).type === 'binary'
    );
  }),
}));

describe('E2E: Client Mode Tools', () => {
  let server: McpServer;
  let registeredTools: Map<
    string,
    { handler: (args: Record<string, unknown>) => Promise<unknown> }
  >;

  beforeEach(() => {
    vi.clearAllMocks();
    apiCalls.length = 0;
    mockApiError = null;
    mockApiResponse = null;

    // Create a mock MCP server that captures registered tools
    registeredTools = new Map();
    server = {
      registerTool: vi.fn(
        (
          name: string,
          _config: unknown,
          handler: (args: Record<string, unknown>) => Promise<unknown>,
        ) => {
          registeredTools.set(name, { handler });
        },
      ),
    } as unknown as McpServer;

    // Generate client mode tools
    generateClientModeTool(server);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Tool Registration', () => {
    it('should register all client mode tools', () => {
      expect(registeredTools.has('freee_api_get')).toBe(true);
      expect(registeredTools.has('freee_api_post')).toBe(true);
      expect(registeredTools.has('freee_api_put')).toBe(true);
      expect(registeredTools.has('freee_api_delete')).toBe(true);
      expect(registeredTools.has('freee_api_patch')).toBe(true);
      expect(registeredTools.has('freee_api_list_paths')).toBe(true);
    });
  });

  describe('freee_api_get', () => {
    it('should successfully fetch deals list', async () => {
      const handler = registeredTools.get('freee_api_get')?.handler;

      const result = (await handler({
        service: 'accounting',
        path: '/api/1/deals',
      })) as { content: Array<{ type: string; text: string }> };

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.deals).toHaveLength(2);
      expect(responseData.deals[0].id).toBe(101);
    });

    it('should pass query parameters correctly', async () => {
      const handler = registeredTools.get('freee_api_get')?.handler;

      await handler({
        service: 'accounting',
        path: '/api/1/deals',
        query: { limit: 10, offset: 0 },
      });

      // Verify API was called with query params
      expect(apiCalls.length).toBeGreaterThan(0);
      const lastCall = apiCalls[apiCalls.length - 1];
      expect(lastCall.params).toEqual({ limit: 10, offset: 0 });
    });

    it('should fetch single deal by ID', async () => {
      const handler = registeredTools.get('freee_api_get')?.handler;

      const result = (await handler({
        service: 'accounting',
        path: '/api/1/deals/101',
      })) as { content: Array<{ type: string; text: string }> };

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.deal.id).toBe(101);
    });

    it('should fetch user info', async () => {
      const handler = registeredTools.get('freee_api_get')?.handler;

      const result = (await handler({
        service: 'accounting',
        path: '/api/1/users/me',
      })) as { content: Array<{ type: string; text: string }> };

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.user.email).toBe('test@example.com');
    });

    it('should handle invalid path with error message', async () => {
      const handler = registeredTools.get('freee_api_get')?.handler;

      const result = (await handler({
        service: 'accounting',
        path: '/invalid/path',
      })) as { content: Array<{ type: string; text: string }> };

      expect(result.content[0].text).toContain('パス検証エラー');
      expect(result.content[0].text).toContain('freee_api_list_paths');
    });
  });

  describe('freee_api_post', () => {
    it('should create a new deal', async () => {
      const handler = registeredTools.get('freee_api_post')?.handler;

      const result = (await handler({
        service: 'accounting',
        path: '/api/1/deals',
        body: {
          issue_date: '2024-01-15',
          type: 'income',
          due_date: '2024-02-15',
          partner_id: 201,
          details: [
            {
              account_item_id: 301,
              amount: 10000,
              tax_code: 1,
            },
          ],
        },
      })) as { content: Array<{ type: string; text: string }> };

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.deal.id).toBe(101);

      // Verify POST request was made
      const postCall = apiCalls.find((call) => call.method === 'POST');
      expect(postCall).toBeDefined();
    });

    it('should include request body in POST request', async () => {
      const handler = registeredTools.get('freee_api_post')?.handler;
      const requestBody = {
        issue_date: '2024-01-15',
        type: 'income',
        amount: 10000,
      };

      await handler({
        service: 'accounting',
        path: '/api/1/deals',
        body: requestBody,
      });

      const postCall = apiCalls.find((call) => call.method === 'POST');
      expect(postCall).toBeDefined();
      expect(postCall?.body).toEqual(requestBody);
    });
  });

  describe('freee_api_put', () => {
    it('should update an existing deal', async () => {
      const handler = registeredTools.get('freee_api_put')?.handler;

      const result = (await handler({
        service: 'accounting',
        path: '/api/1/deals/101',
        body: {
          issue_date: '2024-01-20',
          amount: 15000,
        },
      })) as { content: Array<{ type: string; text: string }> };

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.deal.id).toBe(101);

      // Verify PUT request was made
      const putCall = apiCalls.find((call) => call.method === 'PUT');
      expect(putCall).toBeDefined();
    });
  });

  describe('freee_api_delete', () => {
    it('should delete a deal', async () => {
      const handler = registeredTools.get('freee_api_delete')?.handler;

      await handler({
        service: 'accounting',
        path: '/api/1/deals/101',
      });

      // Verify DELETE request was made
      const deleteCall = apiCalls.find((call) => call.method === 'DELETE');
      expect(deleteCall).toBeDefined();
    });
  });

  describe('freee_api_list_paths', () => {
    it('should return available API paths', async () => {
      const handler = registeredTools.get('freee_api_list_paths')?.handler;

      const result = (await handler({})) as { content: Array<{ type: string; text: string }> };

      expect(result.content[1].text).toContain('freee API');
      expect(result.content[1].text).toContain('使用例');
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication error', async () => {
      mockApiError = new Error('認証エラー: トークンが無効です');

      const handler = registeredTools.get('freee_api_get')?.handler;

      const result = (await handler({
        service: 'accounting',
        path: '/api/1/deals',
      })) as { content: Array<{ type: string; text: string }> };

      expect(result.content[0].text).toContain('APIリクエストエラー');
    });

    it('should handle network error', async () => {
      mockApiError = new Error('Network error: Failed to fetch');

      const handler = registeredTools.get('freee_api_get')?.handler;

      const result = (await handler({
        service: 'accounting',
        path: '/api/1/deals',
      })) as { content: Array<{ type: string; text: string }> };

      expect(result.content[0].text).toContain('APIリクエストエラー');
    });

    it('should handle API error responses', async () => {
      mockApiError = new Error(
        'API request failed: 400\n\n詳細: {"errors":[{"type":"validation","messages":["issue_date is required"]}]}',
      );

      const handler = registeredTools.get('freee_api_get')?.handler;

      const result = (await handler({
        service: 'accounting',
        path: '/api/1/deals',
      })) as { content: Array<{ type: string; text: string }> };

      expect(result.content[0].text).toContain('APIリクエストエラー');
    });
  });

  describe('Multi-API Support', () => {
    it('should handle HR API requests', async () => {
      const handler = registeredTools.get('freee_api_get')?.handler;

      const result = (await handler({
        service: 'hr',
        path: '/api/v1/employees',
      })) as { content: Array<{ type: string; text: string }> };

      // Should fail path validation since HR API has different path structure
      expect(result.content[0].type).toBe('text');
    });

    it('should include correct base URL for each service', async () => {
      const handler = registeredTools.get('freee_api_get')?.handler;

      // Test accounting API
      await handler({
        service: 'accounting',
        path: '/api/1/users/me',
      });

      expect(apiCalls.length).toBeGreaterThan(0);
      const lastCall = apiCalls[apiCalls.length - 1];
      expect(lastCall.baseUrl).toBe('https://api.freee.co.jp');
    });

    it('should use different base URL for invoice API', async () => {
      mockApiResponse = { invoices: [] };

      const handler = registeredTools.get('freee_api_get')?.handler;

      await handler({
        service: 'invoice',
        path: '/invoices',
      });

      expect(apiCalls.length).toBeGreaterThan(0);
      const lastCall = apiCalls[apiCalls.length - 1];
      expect(lastCall.baseUrl).toBe('https://api.freee.co.jp/iv');
    });
  });

  describe('Service Validation', () => {
    it('should validate path against correct service schema', async () => {
      const handler = registeredTools.get('freee_api_get')?.handler;

      // Using accounting path with invoice service should fail
      const result = (await handler({
        service: 'invoice',
        path: '/api/1/deals', // This is an accounting path, not invoice
      })) as { content: Array<{ type: string; text: string }> };

      expect(result.content[0].text).toContain('パス検証エラー');
    });
  });

  describe('Binary Response', () => {
    it('should return base64 ImageContent for binary response', async () => {
      const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      mockApiResponse = {
        type: 'binary',
        data: pngBytes,
        mimeType: 'image/png',
        size: pngBytes.byteLength,
      };

      const handler = registeredTools.get('freee_api_get')?.handler;
      const result = (await handler({
        service: 'accounting',
        path: '/api/1/receipts/123/download',
      })) as { content: Array<{ type: string; data?: string; mimeType?: string }> };

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('image');
      expect(result.content[0].mimeType).toBe('image/png');
      expect(result.content[0].data).toBe(pngBytes.toString('base64'));
    });

    it('should return EmbeddedResource for PDF binary response', async () => {
      const pdfBytes = Buffer.from([0x25, 0x50, 0x44, 0x46]);
      mockApiResponse = {
        type: 'binary',
        data: pdfBytes,
        mimeType: 'application/pdf',
        size: pdfBytes.byteLength,
      };

      const handler = registeredTools.get('freee_api_get')?.handler;
      const result = (await handler({
        service: 'accounting',
        path: '/api/1/receipts/456/download',
      })) as {
        content: Array<{
          type: string;
          resource?: { uri: string; mimeType: string; blob: string };
        }>;
      };

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('resource');
      expect(result.content[0].resource?.uri).toBe('freee://api/api/1/receipts/456/download');
      expect(result.content[0].resource?.mimeType).toBe('application/pdf');
      expect(Buffer.from(result.content[0].resource?.blob ?? '', 'base64')).toEqual(pdfBytes);
    });

    it('should return ImageContent for JPEG binary response', async () => {
      const jpegBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      mockApiResponse = {
        type: 'binary',
        data: jpegBytes,
        mimeType: 'image/jpeg',
        size: jpegBytes.byteLength,
      };

      const handler = registeredTools.get('freee_api_get')?.handler;
      const result = (await handler({
        service: 'accounting',
        path: '/api/1/receipts/789/download',
      })) as { content: Array<{ type: string; data?: string; mimeType?: string }> };

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('image');
      expect(result.content[0].mimeType).toBe('image/jpeg');
      expect(result.content[0].data).toBe(jpegBytes.toString('base64'));
    });

    it('should return decoded text for CSV binary response', async () => {
      const csvText = 'id,name,amount\n1,テスト,1000\n2,サンプル,2000';
      const csvBytes = Buffer.from(csvText, 'utf-8');
      mockApiResponse = {
        type: 'binary',
        data: csvBytes,
        mimeType: 'text/csv',
        size: csvBytes.byteLength,
      };

      const handler = registeredTools.get('freee_api_get')?.handler;
      const result = (await handler({
        service: 'accounting',
        path: '/api/1/receipts/789/download',
      })) as { content: Array<{ type: string; text?: string }> };

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toBe(csvText);
    });

    it('should return error message for unsupported binary type', async () => {
      const bytes = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      mockApiResponse = {
        type: 'binary',
        data: bytes,
        mimeType: 'application/octet-stream',
        size: bytes.byteLength,
      };

      const handler = registeredTools.get('freee_api_get')?.handler;
      const result = (await handler({
        service: 'accounting',
        path: '/api/1/receipts/999/download',
      })) as { content: Array<{ type: string; text?: string }> };

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('application/octet-stream');
      expect(result.content[0].text).toContain('表示できません');
      expect(result.content[0].text).toContain(`${bytes.byteLength} bytes`);
    });

    it('should handle MIME type with parameters', async () => {
      const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      mockApiResponse = {
        type: 'binary',
        data: pngBytes,
        mimeType: 'image/png; charset=utf-8',
        size: pngBytes.byteLength,
      };

      const handler = registeredTools.get('freee_api_get')?.handler;
      const result = (await handler({
        service: 'accounting',
        path: '/api/1/receipts/123/download',
      })) as { content: Array<{ type: string; data?: string; mimeType?: string }> };

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('image');
      expect(result.content[0].mimeType).toBe('image/png');
    });
  });
});
