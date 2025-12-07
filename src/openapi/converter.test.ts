import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { generateToolsFromOpenApi } from './converter.js';

vi.mock('./schema-loader.js', () => ({
  getAllSchemas: vi.fn(() => [
    {
      apiType: 'accounting',
      config: {
        schema: {
          paths: {
            '/api/1/users/me': {
              get: {
                summary: 'Get current user',
                parameters: [
                  {
                    name: 'company_id',
                    in: 'query',
                    type: 'integer'
                  }
                ]
              }
            },
            '/api/1/deals/{id}': {
              get: {
                summary: 'Get deal by ID',
                parameters: [
                  {
                    name: 'id',
                    in: 'path',
                    required: true,
                    type: 'integer'
                  },
                  {
                    name: 'company_id',
                    in: 'query',
                    type: 'integer'
                  }
                ]
              },
              put: {
                summary: 'Update deal',
                parameters: [
                  {
                    name: 'id',
                    in: 'path',
                    required: true,
                    type: 'integer'
                  }
                ],
                hasJsonBody: true
              }
            }
          }
        },
        baseUrl: 'https://api.freee.co.jp',
        prefix: 'accounting',
        name: 'freee会計 API'
      }
    }
  ])
}));

vi.mock('./schema.js', () => ({
  convertParameterToZodSchema: vi.fn((param): { optional: () => { _def: { typeName: string } }; _def: { typeName: string } } => ({
    optional: () => ({ _def: { typeName: 'ZodOptional' } }),
    _def: { typeName: 'ZodNumber' }
  })),
  convertPathToToolName: vi.fn((path: string): string => path.replace(/[/{}/]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')),
  sanitizePropertyName: vi.fn((name: string): string => {
    const sanitized = name.replace(/[^a-zA-Z0-9_.-]/g, '_').substring(0, 64);
    return sanitized || '_';
  })
}));

vi.mock('../api/client.js', () => ({
  makeApiRequest: vi.fn()
}));

describe('converter', () => {
  let mockServer: McpServer;
  let mockTool: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockTool = vi.fn();
    mockServer = {
      tool: mockTool
    } as unknown as McpServer;
    vi.clearAllMocks();
  });

  describe('generateToolsFromOpenApi', () => {
    it('should generate tools from OpenAPI schema', () => {
      generateToolsFromOpenApi(mockServer);

      expect(mockTool).toHaveBeenCalledTimes(3);

      expect(mockTool).toHaveBeenCalledWith(
        'accounting_get_api_1_users_me',
        '[freee会計 API] Get current user',
        expect.any(Object),
        expect.any(Function)
      );

      expect(mockTool).toHaveBeenCalledWith(
        'accounting_get_api_1_deals_id',
        '[freee会計 API] Get deal by ID',
        expect.any(Object),
        expect.any(Function)
      );

      expect(mockTool).toHaveBeenCalledWith(
        'accounting_put_api_1_deals_id',
        '[freee会計 API] Update deal',
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should handle tool execution successfully', async () => {
      const mockMakeApiRequest = await import('../api/client.js');
      vi.mocked(mockMakeApiRequest.makeApiRequest).mockResolvedValue({ success: true });

      generateToolsFromOpenApi(mockServer);

      const getUserMeHandler = mockTool.mock.calls.find(call => call[0] === 'accounting_get_api_1_users_me')?.[3];
      expect(getUserMeHandler).toBeDefined();

      const result = await getUserMeHandler({ company_id: 12345 });

      expect(mockMakeApiRequest.makeApiRequest).toHaveBeenCalledWith(
        'GET',
        '/api/1/users/me',
        { company_id: 12345 },
        undefined,
        'https://api.freee.co.jp'
      );

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: true }, null, 2)
          }
        ]
      });
    });

    it('should handle path parameters correctly', async () => {
      const mockMakeApiRequest = await import('../api/client.js');
      vi.mocked(mockMakeApiRequest.makeApiRequest).mockResolvedValue({ deal: { id: 123 } });

      generateToolsFromOpenApi(mockServer);

      const getDealHandler = mockTool.mock.calls.find(call => call[0] === 'accounting_get_api_1_deals_id')?.[3];
      expect(getDealHandler).toBeDefined();

      await getDealHandler({ id: 123, company_id: 12345 });

      expect(mockMakeApiRequest.makeApiRequest).toHaveBeenCalledWith(
        'GET',
        '/api/1/deals/123',
        { company_id: 12345 },
        undefined,
        'https://api.freee.co.jp'
      );
    });

    it('should handle request body for POST/PUT requests', async () => {
      const mockMakeApiRequest = await import('../api/client.js');
      vi.mocked(mockMakeApiRequest.makeApiRequest).mockResolvedValue({ updated: true });

      generateToolsFromOpenApi(mockServer);

      const putDealHandler = mockTool.mock.calls.find(call => call[0] === 'accounting_put_api_1_deals_id')?.[3];
      expect(putDealHandler).toBeDefined();

      const requestBody = { name: 'Updated Deal' };
      await putDealHandler({ id: 123, body: requestBody });

      expect(mockMakeApiRequest.makeApiRequest).toHaveBeenCalledWith(
        'PUT',
        '/api/1/deals/123',
        {},
        requestBody,
        'https://api.freee.co.jp'
      );
    });

    it('should handle errors gracefully', async () => {
      const mockMakeApiRequest = await import('../api/client.js');
      vi.mocked(mockMakeApiRequest.makeApiRequest).mockRejectedValue(new Error('API Error'));

      generateToolsFromOpenApi(mockServer);

      const getUserMeHandler = mockTool.mock.calls.find(call => call[0] === 'accounting_get_api_1_users_me')?.[3];
      expect(getUserMeHandler).toBeDefined();

      const result = await getUserMeHandler({ company_id: 12345 });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Error: API Error'
          }
        ]
      });
    });

    it('should skip undefined query parameters', async () => {
      const mockMakeApiRequest = await import('../api/client.js');
      vi.mocked(mockMakeApiRequest.makeApiRequest).mockResolvedValue({ success: true });

      generateToolsFromOpenApi(mockServer);

      const getDealHandler = mockTool.mock.calls.find(call => call[0] === 'accounting_get_api_1_deals_id')?.[3];
      expect(getDealHandler).toBeDefined();

      await getDealHandler({ id: 123, company_id: undefined });

      expect(mockMakeApiRequest.makeApiRequest).toHaveBeenCalledWith(
        'GET',
        '/api/1/deals/123',
        {},
        undefined,
        'https://api.freee.co.jp'
      );
    });
  });
});