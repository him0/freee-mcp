/**
 * E2E tests for individual API mode (one tool per endpoint)
 * Tests the complete flow from MCP tool invocation to API response
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { generateToolsFromOpenApi } from '../openapi/converter.js';
import {
  mockDealsResponse,
  mockDealResponse,
  mockUserResponse,
  mockCompaniesResponse,
  mockPartnersResponse,
} from './fixtures/api-responses.js';

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
  makeApiRequest: vi.fn(async (
    method: string,
    path: string,
    params?: Record<string, unknown>,
    body?: Record<string, unknown>,
    baseUrl?: string
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
    if (path === '/api/1/companies') {
      return mockCompaniesResponse;
    }
    if (path === '/api/1/partners') {
      return mockPartnersResponse;
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
  }),
}));

describe('E2E: Individual API Mode Tools', () => {
  let server: McpServer;
  let registeredTools: Map<string, {
    description: string;
    schema: unknown;
    handler: (args: Record<string, unknown>) => Promise<unknown>;
  }>;

  beforeEach(() => {
    vi.clearAllMocks();
    apiCalls.length = 0;
    mockApiError = null;
    mockApiResponse = null;

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

    // Generate individual API tools
    generateToolsFromOpenApi(server);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Tool Registration', () => {
    it('should register tools with correct naming convention', () => {
      // Check for accounting API tools
      const accountingTools = Array.from(registeredTools.keys()).filter(
        (name) => name.startsWith('accounting_')
      );
      expect(accountingTools.length).toBeGreaterThan(0);

      // Check for HR API tools
      const hrTools = Array.from(registeredTools.keys()).filter(
        (name) => name.startsWith('hr_')
      );
      expect(hrTools.length).toBeGreaterThan(0);

      // Check for Invoice API tools
      const invoiceTools = Array.from(registeredTools.keys()).filter(
        (name) => name.startsWith('invoice_')
      );
      expect(invoiceTools.length).toBeGreaterThan(0);

      // Check for PM API tools
      const pmTools = Array.from(registeredTools.keys()).filter(
        (name) => name.startsWith('pm_')
      );
      expect(pmTools.length).toBeGreaterThan(0);
    });

    it('should include API name in tool descriptions', () => {
      const firstTool = Array.from(registeredTools.values())[0];
      expect(firstTool.description).toMatch(/\[(freee.+ API|freee会計|freee人事労務|freee請求書|freee工数管理)/);
    });

    it('should register common accounting endpoints', () => {
      // Find a deals-related tool
      const dealTools = Array.from(registeredTools.keys()).filter(
        (name) => name.includes('deals')
      );
      expect(dealTools.length).toBeGreaterThan(0);

      // Find a users-related tool
      const userTools = Array.from(registeredTools.keys()).filter(
        (name) => name.includes('users')
      );
      expect(userTools.length).toBeGreaterThan(0);

      // Find a companies-related tool
      const companyTools = Array.from(registeredTools.keys()).filter(
        (name) => name.includes('companies')
      );
      expect(companyTools.length).toBeGreaterThan(0);
    });
  });

  describe('Accounting API Tools', () => {
    it('should fetch users/me endpoint', async () => {
      // Find the users/me GET tool
      const toolName = Array.from(registeredTools.keys()).find(
        (name) => name.includes('users') && name.includes('me') && name.includes('get')
      );

      if (!toolName) {
        // Skip if tool not found (schema might not include this endpoint)
        return;
      }

      const handler = registeredTools.get(toolName)!.handler;
      const result = await handler({}) as { content: Array<{ type: string; text: string }> };

      expect(result.content).toHaveLength(1);
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.user.email).toBe('test@example.com');
    });

    it('should fetch companies list', async () => {
      // Find the companies GET tool
      const toolName = Array.from(registeredTools.keys()).find(
        (name) => name.startsWith('accounting_') && name.includes('companies') && name.includes('get')
      );

      if (!toolName) {
        return;
      }

      const handler = registeredTools.get(toolName)!.handler;
      const result = await handler({}) as { content: Array<{ type: string; text: string }> };

      expect(result.content).toHaveLength(1);
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.companies).toBeDefined();
    });

    it('should fetch deals list with query parameters', async () => {
      // Find the deals GET tool
      const toolName = Array.from(registeredTools.keys()).find(
        (name) =>
          name.startsWith('accounting_') &&
          name.includes('deals') &&
          name.includes('get') &&
          !name.includes('deal_id') // Exclude single deal endpoint
      );

      if (!toolName) {
        return;
      }

      const handler = registeredTools.get(toolName)!.handler;
      const result = await handler({
        limit: 10,
        offset: 0,
      }) as { content: Array<{ type: string; text: string }> };

      expect(result.content).toHaveLength(1);
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.deals).toBeDefined();
    });

    it('should fetch partners list', async () => {
      // Find the partners GET tool
      const toolName = Array.from(registeredTools.keys()).find(
        (name) =>
          name.startsWith('accounting_') &&
          name.includes('partners') &&
          name.includes('get')
      );

      if (!toolName) {
        return;
      }

      const handler = registeredTools.get(toolName)!.handler;
      const result = await handler({}) as { content: Array<{ type: string; text: string }> };

      expect(result.content).toHaveLength(1);
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.partners).toBeDefined();
    });
  });

  describe('POST/PUT Operations', () => {
    it('should create a deal with POST', async () => {
      // Find a deals POST tool
      const toolName = Array.from(registeredTools.keys()).find(
        (name) =>
          name.startsWith('accounting_') &&
          name.includes('deals') &&
          name.includes('post')
      );

      if (!toolName) {
        return;
      }

      const handler = registeredTools.get(toolName)!.handler;
      await handler({
        body: {
          issue_date: '2024-01-15',
          type: 'income',
          due_date: '2024-02-15',
          partner_id: 201,
        },
      });

      // Verify POST request was made
      const postCall = apiCalls.find((call) => call.method === 'POST');
      expect(postCall).toBeDefined();
    });

    it('should update a deal with PUT', async () => {
      // Find a deals PUT tool (requires deal_id parameter)
      const toolName = Array.from(registeredTools.keys()).find(
        (name) =>
          name.startsWith('accounting_') &&
          name.includes('deals') &&
          name.includes('put')
      );

      if (!toolName) {
        return;
      }

      const handler = registeredTools.get(toolName)!.handler;
      await handler({
        id: '101', // Path parameter
        body: {
          issue_date: '2024-01-20',
        },
      });

      // Verify PUT request was made
      const putCall = apiCalls.find((call) => call.method === 'PUT');
      expect(putCall).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockApiError = new Error('API request failed: 500');

      // Find the companies GET tool
      const toolName = Array.from(registeredTools.keys()).find(
        (name) => name.startsWith('accounting_') && name.includes('companies') && name.includes('get')
      );

      if (!toolName) {
        return;
      }

      const handler = registeredTools.get(toolName)!.handler;
      const result = await handler({}) as { content: Array<{ type: string; text: string }> };

      expect(result.content[0].text).toContain('Error');
    });

    it('should handle authentication errors', async () => {
      mockApiError = new Error('認証エラーが発生しました');

      // Find any tool to test
      const toolName = Array.from(registeredTools.keys()).find(
        (name) => name.startsWith('accounting_') && name.includes('get')
      );

      if (!toolName) {
        return;
      }

      const handler = registeredTools.get(toolName)!.handler;
      const result = await handler({}) as { content: Array<{ type: string; text: string }> };

      expect(result.content[0].text).toContain('Error');
    });
  });

  describe('Path Parameters', () => {
    it('should replace path parameters in URL', async () => {
      // Find a tool with path parameters - look for one that has 'id' in the name
      // Pattern like: accounting_get_api_1_deals_id
      const toolName = Array.from(registeredTools.keys()).find(
        (name) =>
          name.startsWith('accounting_') &&
          name.includes('deals') &&
          name.includes('_id')
      );

      if (!toolName) {
        // If no single deal tool found, skip this test
        // (The schema might not have this endpoint)
        return;
      }

      const handler = registeredTools.get(toolName)!.handler;
      await handler({ id: '12345' });

      // Verify URL contains the ID
      expect(apiCalls.length).toBeGreaterThan(0);
      const lastCall = apiCalls[apiCalls.length - 1];
      expect(lastCall.path).toContain('12345');
    });
  });

  describe('Multi-API Coverage', () => {
    it('should have tools for all supported APIs', () => {
      const toolNames = Array.from(registeredTools.keys());

      // Each API should have at least one tool
      expect(toolNames.some((n) => n.startsWith('accounting_'))).toBe(true);
      expect(toolNames.some((n) => n.startsWith('hr_'))).toBe(true);
      expect(toolNames.some((n) => n.startsWith('invoice_'))).toBe(true);
      expect(toolNames.some((n) => n.startsWith('pm_'))).toBe(true);
    });

    it('should have significant number of tools registered', () => {
      // Individual mode should generate many tools
      expect(registeredTools.size).toBeGreaterThan(10);
    });
  });

  describe('Base URL Configuration', () => {
    it('should use correct base URL for accounting API', async () => {
      const toolName = Array.from(registeredTools.keys()).find(
        (name) => name.startsWith('accounting_') && name.includes('users') && name.includes('me')
      );

      if (!toolName) return;

      const handler = registeredTools.get(toolName)!.handler;
      await handler({});

      expect(apiCalls.length).toBeGreaterThan(0);
      const lastCall = apiCalls[apiCalls.length - 1];
      expect(lastCall.baseUrl).toBe('https://api.freee.co.jp');
    });

    it('should use correct base URL for HR API', async () => {
      mockApiResponse = { employees: [] };

      const toolName = Array.from(registeredTools.keys()).find(
        (name) => name.startsWith('hr_') && name.includes('get')
      );

      if (!toolName) return;

      const handler = registeredTools.get(toolName)!.handler;
      await handler({});

      expect(apiCalls.length).toBeGreaterThan(0);
      const lastCall = apiCalls[apiCalls.length - 1];
      expect(lastCall.baseUrl).toBe('https://api.freee.co.jp/hr');
    });

    it('should use correct base URL for Invoice API', async () => {
      mockApiResponse = { invoices: [] };

      const toolName = Array.from(registeredTools.keys()).find(
        (name) => name.startsWith('invoice_') && name.includes('get')
      );

      if (!toolName) return;

      const handler = registeredTools.get(toolName)!.handler;
      await handler({});

      expect(apiCalls.length).toBeGreaterThan(0);
      const lastCall = apiCalls[apiCalls.length - 1];
      expect(lastCall.baseUrl).toBe('https://api.freee.co.jp/iv');
    });

    it('should use correct base URL for PM API', async () => {
      mockApiResponse = { projects: [] };

      const toolName = Array.from(registeredTools.keys()).find(
        (name) => name.startsWith('pm_') && name.includes('get')
      );

      if (!toolName) return;

      const handler = registeredTools.get(toolName)!.handler;
      await handler({});

      expect(apiCalls.length).toBeGreaterThan(0);
      const lastCall = apiCalls[apiCalls.length - 1];
      expect(lastCall.baseUrl).toBe('https://api.freee.co.jp/pm');
    });
  });
});
