import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { makeApiRequest } from './client.js';

vi.mock('../config.js', () => ({
  config: {
    freee: {
      apiUrl: 'https://api.freee.co.jp',
      companyId: '12345'
    }
  }
}));

vi.mock('../config/companies.js', () => ({
  getCurrentCompanyId: vi.fn().mockResolvedValue('12345')
}));

const { getCurrentCompanyId } = await import('../config/companies.js');

vi.mock('../auth/tokens.js', () => ({
  getValidAccessToken: vi.fn()
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // getCurrentCompanyIdのモックを確実に設定
    vi.mocked(getCurrentCompanyId).mockResolvedValue('12345');
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
  });
});