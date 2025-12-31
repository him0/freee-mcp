import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { makeApiRequest, BinaryFileResponse } from './client.js';
import fs from 'fs/promises';

// Test constants (defined after mocks due to hoisting)
const TEST_API_URL = 'https://api.freee.co.jp';
const TEST_COMPANY_ID = '12345';
const TEST_ACCESS_TOKEN = 'test-access-token';
const TEST_DOWNLOAD_DIR = '/tmp';

vi.mock('../config.js', () => ({
  config: {
    freee: {
      apiUrl: 'https://api.freee.co.jp',
      companyId: '12345'
    }
  }
}));

vi.mock('../config/companies.js', () => ({
  getCurrentCompanyId: vi.fn(),
  getDownloadDir: vi.fn()
}));

const { getCurrentCompanyId, getDownloadDir } = await import('../config/companies.js');

vi.mock('../auth/tokens.js', () => ({
  getValidAccessToken: vi.fn()
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

/**
 * Create mock headers with content-type
 */
function createMockHeaders(contentType: string) {
  return {
    get: (name: string) => name === 'content-type' ? contentType : null
  };
}

/**
 * Create a successful JSON response mock
 */
function createJsonResponse(data: unknown) {
  return {
    ok: true,
    headers: createMockHeaders('application/json'),
    json: () => Promise.resolve(data)
  };
}

/**
 * Create an error response mock
 */
function createErrorResponse(status: number, errorData: unknown) {
  return {
    ok: false,
    status,
    json: () => Promise.resolve(errorData)
  };
}

/**
 * Create a binary response mock
 */
function createBinaryResponse(contentType: string, data: Uint8Array) {
  return {
    ok: true,
    headers: createMockHeaders(contentType),
    arrayBuffer: () => Promise.resolve(data.buffer)
  };
}

/**
 * Setup access token mock
 */
async function setupAccessToken(token: string | null) {
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
        `${TEST_API_URL}/api/1/users/me?company_id=${TEST_COMPANY_ID}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${TEST_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: undefined,
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should include query parameters', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);
      mockFetch.mockResolvedValue(createJsonResponse({}));

      const queryParams = { limit: 10, offset: 0 };
      await makeApiRequest('GET', '/api/1/deals', queryParams);

      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_API_URL}/api/1/deals?limit=10&offset=0&company_id=${TEST_COMPANY_ID}`,
        expect.any(Object)
      );
    });

    it('should skip undefined parameters', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);
      mockFetch.mockResolvedValue(createJsonResponse({}));

      await makeApiRequest('GET', '/api/1/deals', { limit: 10, offset: undefined });

      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_API_URL}/api/1/deals?limit=10&company_id=${TEST_COMPANY_ID}`,
        expect.any(Object)
      );
    });

    it('should include request body for POST requests', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);
      mockFetch.mockResolvedValue(createJsonResponse({}));

      const requestBody = { name: 'Test Deal' };
      await makeApiRequest('POST', '/api/1/deals', undefined, requestBody);

      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_API_URL}/api/1/deals?company_id=${TEST_COMPANY_ID}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${TEST_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );
    });

    it('should throw error when no access token available', async () => {
      await setupAccessToken(null);

      await expect(makeApiRequest('GET', '/api/1/users/me')).rejects.toThrow(
        '認証が必要です。freee_authenticate ツールを使用して認証を行ってください。'
      );
    });

    it('should throw authentication error for 401 response', async () => {
      await setupAccessToken('invalid-token');
      mockFetch.mockResolvedValue(createErrorResponse(401, { error: 'invalid_token' }));

      await expect(makeApiRequest('GET', '/api/1/users/me')).rejects.toThrow(
        '認証エラーが発生しました。freee_authenticate ツールを使用して再認証を行ってください。'
      );
    });

    it('should throw authentication error for 403 response', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);
      mockFetch.mockResolvedValue(createErrorResponse(403, { error: 'insufficient_scope' }));

      await expect(makeApiRequest('GET', '/api/1/users/me')).rejects.toThrow(
        '認証エラーが発生しました。freee_authenticate ツールを使用して再認証を行ってください。'
      );
    });

    it('should throw generic error for other HTTP errors', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);
      mockFetch.mockResolvedValue(createErrorResponse(500, { error: 'internal_server_error' }));

      await expect(makeApiRequest('GET', '/api/1/users/me')).rejects.toThrow(
        'API request failed: 500'
      );
    });

    it('should handle JSON parsing errors in error responses', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      await expect(makeApiRequest('GET', '/api/1/users/me')).rejects.toThrow(
        'API request failed: 500\n\n詳細: {}'
      );
    });

    it('should save binary response to file and return file info', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);

      const pdfMagicBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
      mockFetch.mockResolvedValue(createBinaryResponse('application/pdf', pdfMagicBytes));

      const result = await makeApiRequest('GET', '/api/1/receipts/123/download');

      expect(isBinaryFileResponse(result)).toBe(true);
      const binaryResult = result as BinaryFileResponse;
      expect(binaryResult.type).toBe('binary');
      expect(binaryResult.mimeType).toBe('application/pdf');
      expect(binaryResult.size).toBe(4);
      expect(binaryResult.filePath).toContain('.pdf');

      await fs.unlink(binaryResult.filePath).catch(() => {});
    });

    it('should save image response to file with correct extension', async () => {
      await setupAccessToken(TEST_ACCESS_TOKEN);

      const pngMagicBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47]);
      mockFetch.mockResolvedValue(createBinaryResponse('image/png', pngMagicBytes));

      const result = await makeApiRequest('GET', '/api/1/receipts/456/download');

      expect(isBinaryFileResponse(result)).toBe(true);
      const binaryResult = result as BinaryFileResponse;
      expect(binaryResult.type).toBe('binary');
      expect(binaryResult.mimeType).toBe('image/png');
      expect(binaryResult.filePath).toContain('.png');

      await fs.unlink(binaryResult.filePath).catch(() => {});
    });
  });
});

/**
 * Type guard for BinaryFileResponse
 */
function isBinaryFileResponse(result: unknown): result is BinaryFileResponse {
  return (
    typeof result === 'object' &&
    result !== null &&
    'type' in result &&
    (result as BinaryFileResponse).type === 'binary'
  );
}
