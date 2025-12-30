import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { makeApiRequest, BinaryFileResponse } from './client.js';
import fs from 'fs/promises';

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

describe('client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // モックを確実に設定
    vi.mocked(getCurrentCompanyId).mockResolvedValue('12345');
    vi.mocked(getDownloadDir).mockResolvedValue('/tmp');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('makeApiRequest', () => {
    it('should make successful API request', async () => {
      const mockGetValidAccessToken = await import('../auth/tokens.js');
      vi.mocked(mockGetValidAccessToken.getValidAccessToken).mockResolvedValue('test-access-token');
      
      const mockResponse = { data: 'test-data' };
      mockFetch.mockResolvedValue({
        ok: true,
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null
        },
        json: () => Promise.resolve(mockResponse)
      });

      const result = await makeApiRequest('GET', '/api/1/users/me');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.freee.co.jp/api/1/users/me?company_id=12345',
        {
          method: 'GET',
          headers: {
            Authorization: 'Bearer test-access-token',
            'Content-Type': 'application/json',
          },
          body: undefined,
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should include query parameters', async () => {
      const mockGetValidAccessToken = await import('../auth/tokens.js');
      vi.mocked(mockGetValidAccessToken.getValidAccessToken).mockResolvedValue('test-access-token');

      mockFetch.mockResolvedValue({
        ok: true,
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null
        },
        json: () => Promise.resolve({})
      });

      await makeApiRequest('GET', '/api/1/deals', { limit: 10, offset: 0 });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.freee.co.jp/api/1/deals?limit=10&offset=0&company_id=12345',
        expect.any(Object)
      );
    });

    it('should skip undefined parameters', async () => {
      const mockGetValidAccessToken = await import('../auth/tokens.js');
      vi.mocked(mockGetValidAccessToken.getValidAccessToken).mockResolvedValue('test-access-token');

      mockFetch.mockResolvedValue({
        ok: true,
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null
        },
        json: () => Promise.resolve({})
      });

      await makeApiRequest('GET', '/api/1/deals', { limit: 10, offset: undefined });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.freee.co.jp/api/1/deals?limit=10&company_id=12345',
        expect.any(Object)
      );
    });

    it('should include request body for POST requests', async () => {
      const mockGetValidAccessToken = await import('../auth/tokens.js');
      vi.mocked(mockGetValidAccessToken.getValidAccessToken).mockResolvedValue('test-access-token');

      mockFetch.mockResolvedValue({
        ok: true,
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null
        },
        json: () => Promise.resolve({})
      });

      const requestBody = { name: 'Test Deal' };
      await makeApiRequest('POST', '/api/1/deals', undefined, requestBody);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.freee.co.jp/api/1/deals?company_id=12345',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer test-access-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: 'Test Deal' }),
        }
      );
    });

    it('should throw error when no access token available', async () => {
      const mockGetValidAccessToken = await import('../auth/tokens.js');
      vi.mocked(mockGetValidAccessToken.getValidAccessToken).mockResolvedValue(null);

      await expect(makeApiRequest('GET', '/api/1/users/me')).rejects.toThrow(
        '認証が必要です。freee_authenticate ツールを使用して認証を行ってください。'
      );
    });

    it('should throw authentication error for 401 response', async () => {
      const mockGetValidAccessToken = await import('../auth/tokens.js');
      vi.mocked(mockGetValidAccessToken.getValidAccessToken).mockResolvedValue('invalid-token');
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'invalid_token' })
      });

      await expect(makeApiRequest('GET', '/api/1/users/me')).rejects.toThrow(
        '認証エラーが発生しました。freee_authenticate ツールを使用して再認証を行ってください。'
      );
    });

    it('should throw authentication error for 403 response', async () => {
      const mockGetValidAccessToken = await import('../auth/tokens.js');
      vi.mocked(mockGetValidAccessToken.getValidAccessToken).mockResolvedValue('test-token');
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: 'insufficient_scope' })
      });

      await expect(makeApiRequest('GET', '/api/1/users/me')).rejects.toThrow(
        '認証エラーが発生しました。freee_authenticate ツールを使用して再認証を行ってください。'
      );
    });

    it('should throw generic error for other HTTP errors', async () => {
      const mockGetValidAccessToken = await import('../auth/tokens.js');
      vi.mocked(mockGetValidAccessToken.getValidAccessToken).mockResolvedValue('test-token');
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'internal_server_error' })
      });

      await expect(makeApiRequest('GET', '/api/1/users/me')).rejects.toThrow(
        'API request failed: 500'
      );
    });

    it('should handle JSON parsing errors in error responses', async () => {
      const mockGetValidAccessToken = await import('../auth/tokens.js');
      vi.mocked(mockGetValidAccessToken.getValidAccessToken).mockResolvedValue('test-token');

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
      const mockGetValidAccessToken = await import('../auth/tokens.js');
      vi.mocked(mockGetValidAccessToken.getValidAccessToken).mockResolvedValue('test-access-token');

      const binaryData = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // PDF magic bytes
      mockFetch.mockResolvedValue({
        ok: true,
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/pdf' : null
        },
        arrayBuffer: () => Promise.resolve(binaryData.buffer)
      });

      const result = await makeApiRequest('GET', '/api/1/receipts/123/download') as BinaryFileResponse;

      expect(result.type).toBe('binary');
      expect(result.mimeType).toBe('application/pdf');
      expect(result.size).toBe(4);
      expect(result.filePath).toContain('.pdf');

      // Clean up: delete the created file
      await fs.unlink(result.filePath).catch(() => {});
    });

    it('should save image response to file with correct extension', async () => {
      const mockGetValidAccessToken = await import('../auth/tokens.js');
      vi.mocked(mockGetValidAccessToken.getValidAccessToken).mockResolvedValue('test-access-token');

      const imageData = new Uint8Array([0x89, 0x50, 0x4E, 0x47]); // PNG magic bytes
      mockFetch.mockResolvedValue({
        ok: true,
        headers: {
          get: (name: string) => name === 'content-type' ? 'image/png' : null
        },
        arrayBuffer: () => Promise.resolve(imageData.buffer)
      });

      const result = await makeApiRequest('GET', '/api/1/receipts/456/download') as BinaryFileResponse;

      expect(result.type).toBe('binary');
      expect(result.mimeType).toBe('image/png');
      expect(result.filePath).toContain('.png');

      // Clean up: delete the created file
      await fs.unlink(result.filePath).catch(() => {});
    });
  });
});