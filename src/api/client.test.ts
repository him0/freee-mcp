import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getUserAgent } from '../server/user-agent.js';
import { type BinaryFileResponse, isBinaryFileResponse, makeApiRequest } from './client.js';

// Test constants (defined after mocks due to hoisting)
const TEST_API_URL = 'https://api.freee.co.jp';
const TEST_COMPANY_ID = '12345';
const TEST_ACCESS_TOKEN = 'test-access-token';
const TEST_DOWNLOAD_DIR = '/tmp';

vi.mock('../config.js', () => ({
  getConfig: (): { freee: { apiUrl: string; companyId: string } } => ({
    freee: {
      apiUrl: 'https://api.freee.co.jp',
      companyId: '12345',
    },
  }),
}));

vi.mock('../config/companies.js', () => ({
  getCurrentCompanyId: vi.fn(),
  getDownloadDir: vi.fn(),
}));

const { getCurrentCompanyId, getDownloadDir } = await import('../config/companies.js');

vi.mock('../auth/tokens.js', () => ({
  getValidAccessToken: vi.fn(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

interface MockHeaders {
  get: (name: string) => string | null;
}

interface MockJsonResponse {
  ok: true;
  headers: MockHeaders;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}

interface MockErrorResponse {
  ok: false;
  status: number;
  json: () => Promise<unknown>;
}

interface MockBinaryResponse {
  ok: true;
  headers: MockHeaders;
  arrayBuffer: () => Promise<ArrayBufferLike>;
}

/**
 * Create mock headers with content-type
 */
function createMockHeaders(contentType: string): MockHeaders {
  return {
    get: (name: string) => (name === 'content-type' ? contentType : null),
  };
}

/**
 * Create a successful JSON response mock
 */
function createJsonResponse(data: unknown): MockJsonResponse {
  return {
    ok: true,
    headers: createMockHeaders('application/json'),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

/**
 * Create an error response mock
 */
function createErrorResponse(status: number, errorData: unknown): MockErrorResponse {
  return {
    ok: false,
    status,
    json: () => Promise.resolve(errorData),
  };
}

/**
 * Create a binary response mock
 */
function createBinaryResponse(contentType: string, data: Uint8Array): MockBinaryResponse {
  return {
    ok: true,
    headers: createMockHeaders(contentType),
    arrayBuffer: () => Promise.resolve(data.buffer),
  };
}

/**
 * Setup access token mock
 */
async function setupAccessToken(token: string | null): Promise<void> {
  const mockGetValidAccessToken = await import('../auth/tokens.js');
  vi.mocked(mockGetValidAccessToken.getValidAccessToken).mockResolvedValue(token);
}

describe('client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentCompanyId).mockResolvedValue(TEST_COMPANY_ID);
    vi.mocked(getDownloadDir).mockResolvedValue(TEST_DOWNLOAD_DIR);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('makeApiRequest', () => {
    it('should make successful API request', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);

      const mockResponse = { data: 'test-data' };
      mockFetch.mockResolvedValue(createJsonResponse(mockResponse));

      const result = await makeApiRequest('GET', '/api/1/users/me');

      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_API_URL}/api/1/users/me`,
        expect.objectContaining({
          method: 'GET',
          headers: {
            Authorization: `Bearer ${TEST_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'User-Agent': getUserAgent(),
          },
          body: undefined,
          signal: expect.any(AbortSignal),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it('should include query parameters', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);
      mockFetch.mockResolvedValue(createJsonResponse({}));

      const queryParams = { limit: 10, offset: 0 };
      await makeApiRequest('GET', '/api/1/deals', queryParams);

      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_API_URL}/api/1/deals?limit=10&offset=0`,
        expect.any(Object),
      );
    });

    it('should skip undefined parameters', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);
      mockFetch.mockResolvedValue(createJsonResponse({}));

      await makeApiRequest('GET', '/api/1/deals', { limit: 10, offset: undefined });

      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_API_URL}/api/1/deals?limit=10`,
        expect.any(Object),
      );
    });

    it('should include request body for POST requests', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);
      mockFetch.mockResolvedValue(createJsonResponse({}));

      const requestBody = { name: 'Test Deal' };
      await makeApiRequest('POST', '/api/1/deals', undefined, requestBody);

      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_API_URL}/api/1/deals`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: `Bearer ${TEST_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'User-Agent': getUserAgent(),
          },
          body: JSON.stringify(requestBody),
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it('should pass through matching company_id in params', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);
      mockFetch.mockResolvedValue(createJsonResponse({}));

      await makeApiRequest('GET', '/api/1/deals', { company_id: TEST_COMPANY_ID });

      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_API_URL}/api/1/deals?company_id=${TEST_COMPANY_ID}`,
        expect.any(Object),
      );
    });

    it('should throw error for mismatched company_id in params', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);

      await expect(makeApiRequest('GET', '/api/1/deals', { company_id: '99999' })).rejects.toThrow(
        'company_id の不整合',
      );
    });

    it('should pass through matching company_id in body', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);
      mockFetch.mockResolvedValue(createJsonResponse({}));

      const requestBody = { company_id: TEST_COMPANY_ID, name: 'Test' };
      await makeApiRequest('POST', '/api/1/deals', undefined, requestBody);

      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_API_URL}/api/1/deals`,
        expect.objectContaining({
          body: JSON.stringify(requestBody),
        }),
      );
    });

    it('should throw error for mismatched company_id in body', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);

      await expect(
        makeApiRequest('POST', '/api/1/deals', undefined, { company_id: '99999' }),
      ).rejects.toThrow('company_id の不整合');
    });

    it('should throw error when no access token available', async () => {
      await setupAccessToken(null);

      await expect(makeApiRequest('GET', '/api/1/users/me')).rejects.toThrow(
        '認証が必要です。freee_authenticate ツールを使用して認証を行ってください。',
      );
    });

    it('should throw authentication error for 401 response', async () => {
      await setupAccessToken('invalid-token');
      mockFetch.mockResolvedValue(createErrorResponse(401, { error: 'invalid_token' }));

      await expect(makeApiRequest('GET', '/api/1/users/me')).rejects.toThrow(
        '認証エラーが発生しました。freee_authenticate ツールを使用して再認証を行ってください。',
      );
    });

    it('should throw rate limit / permission error for 403 response', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);
      mockFetch.mockResolvedValue(createErrorResponse(403, { error: 'insufficient_scope' }));

      await expect(makeApiRequest('GET', '/api/1/users/me')).rejects.toThrow('アクセス拒否 (403)');
    });

    it('should include rate limit hint in 403 error message', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);
      mockFetch.mockResolvedValue(createErrorResponse(403, { error: 'rate_limit_exceeded' }));

      await expect(makeApiRequest('GET', '/api/1/users/me')).rejects.toThrow(
        'レートリミットの可能性があります',
      );
    });

    it('should throw generic error for other HTTP errors', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);
      mockFetch.mockResolvedValue(createErrorResponse(500, { error: 'internal_server_error' }));

      await expect(makeApiRequest('GET', '/api/1/users/me')).rejects.toThrow(
        'API request failed: 500',
      );
    });

    it('should handle JSON parsing errors in error responses', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(makeApiRequest('GET', '/api/1/users/me')).rejects.toThrow(
        'API request failed: 500\n\n詳細: (JSON parse failed: Invalid JSON)',
      );
    });

    it('should return null for 204 No Content response', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
        headers: createMockHeaders(''),
      });

      const result = await makeApiRequest('DELETE', '/api/1/deals/123');

      expect(result).toBeNull();
    });

    it('should return null for empty response body', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: createMockHeaders('application/json'),
        text: () => Promise.resolve(''),
      });

      const result = await makeApiRequest('DELETE', '/api/1/deals/123');

      expect(result).toBeNull();
    });

    it('should return binary response with buffer data for PDF', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);

      const pdfMagicBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
      mockFetch.mockResolvedValue(createBinaryResponse('application/pdf', pdfMagicBytes));

      const result = await makeApiRequest('GET', '/api/1/receipts/123/download');

      expect(isBinaryFileResponse(result)).toBe(true);
      const binaryResult = result as BinaryFileResponse;
      expect(binaryResult.type).toBe('binary');
      expect(binaryResult.mimeType).toBe('application/pdf');
      expect(binaryResult.size).toBe(4);
      expect(Buffer.isBuffer(binaryResult.data)).toBe(true);
      expect(binaryResult.data).toEqual(Buffer.from(pdfMagicBytes));
    });

    it('should return binary response with buffer data for CSV', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);

      const csvData = new TextEncoder().encode('id,name\n1,Test');
      mockFetch.mockResolvedValue(createBinaryResponse('text/csv', csvData));

      const result = await makeApiRequest('GET', '/api/1/reports/csv');

      expect(isBinaryFileResponse(result)).toBe(true);
      const binaryResult = result as BinaryFileResponse;
      expect(binaryResult.type).toBe('binary');
      expect(binaryResult.mimeType).toBe('text/csv');
      expect(binaryResult.size).toBe(csvData.byteLength);
      expect(binaryResult.data.toString('utf-8')).toBe('id,name\n1,Test');
    });

    it('should return binary response with buffer data for PNG', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);

      const pngMagicBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
      mockFetch.mockResolvedValue(createBinaryResponse('image/png', pngMagicBytes));

      const result = await makeApiRequest('GET', '/api/1/receipts/456/download');

      expect(isBinaryFileResponse(result)).toBe(true);
      const binaryResult = result as BinaryFileResponse;
      expect(binaryResult.type).toBe('binary');
      expect(binaryResult.mimeType).toBe('image/png');
      expect(binaryResult.data).toEqual(Buffer.from(pngMagicBytes));
    });
  });

  describe('makeApiRequest - recorder integration', () => {
    it('records an api_call with the success path pattern', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);
      // The shared createJsonResponse helper omits `status`, but the recorder
      // captures it verbatim — set it explicitly so the assertion is meaningful.
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: createMockHeaders('application/json'),
        json: (): Promise<unknown> => Promise.resolve({ ok: true }),
        text: (): Promise<string> => Promise.resolve(JSON.stringify({ ok: true })),
      });

      const { RequestRecorder, withRequestRecorder } = await import(
        '../server/request-context.js'
      );
      const recorder = new RequestRecorder({
        request_id: 'req-api-success',
        source_ip: '127.0.0.1',
        method: 'POST',
        path: '/mcp',
      });

      await withRequestRecorder(recorder, () =>
        makeApiRequest('GET', '/api/1/deals/98765', { limit: 10 }),
      );

      const payload = recorder.buildPayload({ status: 200, duration_ms: 1 });
      const apiCalls = payload.api_calls as Array<Record<string, unknown>>;
      expect(apiCalls).toHaveLength(1);
      expect(apiCalls[0]).toMatchObject({
        method: 'GET',
        path_pattern: '/api/:id/deals/:id',
        status_code: 200,
        error_type: null,
      });
      // Query values must not be in the path_pattern.
      expect(JSON.stringify(apiCalls[0])).not.toContain('limit=10');
    });

    it('records an api_call with error_type=http_error on 500 response', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);
      mockFetch.mockResolvedValue(createErrorResponse(500, { error: 'oops' }));

      const { RequestRecorder, withRequestRecorder } = await import(
        '../server/request-context.js'
      );
      const recorder = new RequestRecorder({
        request_id: 'req-api-500',
        source_ip: '127.0.0.1',
        method: 'POST',
        path: '/mcp',
      });

      await expect(
        withRequestRecorder(recorder, () => makeApiRequest('GET', '/api/1/users/me')),
      ).rejects.toThrow(/API request failed: 500/);

      const payload = recorder.buildPayload({ status: 200, duration_ms: 1 });
      const apiCalls = payload.api_calls as Array<Record<string, unknown>>;
      expect(apiCalls).toHaveLength(1);
      expect(apiCalls[0]).toMatchObject({
        method: 'GET',
        status_code: 500,
        error_type: 'http_error',
      });

      const errors = payload.errors as Array<{ source: string; chain: Array<{ message: string }> }>;
      expect(errors).toHaveLength(1);
      expect(errors[0].source).toBe('api_client');
      expect(errors[0].chain[0].message).toMatch(/API request failed: 500/);
    });

    it('records an api_call with error_type=auth_error on 401 response', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);
      mockFetch.mockResolvedValue(createErrorResponse(401, { error: 'invalid_token' }));

      const { RequestRecorder, withRequestRecorder } = await import(
        '../server/request-context.js'
      );
      const recorder = new RequestRecorder({
        request_id: 'req-api-401',
        source_ip: '127.0.0.1',
        method: 'POST',
        path: '/mcp',
      });

      await expect(
        withRequestRecorder(recorder, () => makeApiRequest('GET', '/api/1/users/me')),
      ).rejects.toThrow();

      const apiCalls = recorder.buildPayload({ status: 200, duration_ms: 1 }).api_calls as Array<
        Record<string, unknown>
      >;
      expect(apiCalls[0]).toMatchObject({ status_code: 401, error_type: 'auth_error' });
    });

    it('does nothing (null-safe) when no recorder is installed', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);
      mockFetch.mockResolvedValue(createJsonResponse({ ok: true }));

      // Called OUTSIDE of withRequestRecorder — getCurrentRecorder() returns undefined
      // (this is the CLI mode path). Must still succeed without throwing.
      const result = await makeApiRequest('GET', '/api/1/users/me');
      expect(result).toEqual({ ok: true });
    });
  });
});
