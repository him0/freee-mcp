import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeSignApiRequest } from './client.js';

vi.mock('./tokens.js', () => ({
  getValidSignAccessToken: vi.fn(),
}));

vi.mock('./config.js', () => ({
  SIGN_API_URL: 'https://ninja-sign.com',
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('sign/client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('正常系', () => {
    it('GET リクエストが正しい URL + Bearer token で送信される', async () => {
      const { getValidSignAccessToken } = await import('./tokens.js');
      vi.mocked(getValidSignAccessToken).mockResolvedValue('test-token');

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve(JSON.stringify({ documents: [] })),
      });

      const result = await makeSignApiRequest('GET', '/v1/documents');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://ninja-sign.com/v1/documents',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            'User-Agent': expect.stringMatching(/^freee-mcp\//),
          }),
        }),
      );
      expect(result).toEqual({ documents: [] });
    });

    it('POST リクエストが body 付きで送信される', async () => {
      const { getValidSignAccessToken } = await import('./tokens.js');
      vi.mocked(getValidSignAccessToken).mockResolvedValue('test-token');

      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve(JSON.stringify({ id: '123' })),
      });

      const result = await makeSignApiRequest('POST', '/v1/documents/uploads', undefined, {
        title: 'test',
      });

      const call = mockFetch.mock.calls[0];
      expect(call[1].body).toBe(JSON.stringify({ title: 'test' }));
      expect(result).toEqual({ id: '123' });
    });

    it('DELETE リクエストで 204 → null が返る', async () => {
      const { getValidSignAccessToken } = await import('./tokens.js');
      vi.mocked(getValidSignAccessToken).mockResolvedValue('test-token');

      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
        headers: new Headers(),
      });

      const result = await makeSignApiRequest('DELETE', '/v1/documents/123');
      expect(result).toBeNull();
    });

    it('クエリパラメータが URL に付加される', async () => {
      const { getValidSignAccessToken } = await import('./tokens.js');
      vi.mocked(getValidSignAccessToken).mockResolvedValue('test-token');

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve('[]'),
      });

      await makeSignApiRequest('GET', '/v1/documents', { page: 1, per: 10 });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('page=1');
      expect(url).toContain('per=10');
    });
  });

  describe('異常系', () => {
    it('未認証で API → sign_authenticate 誘導メッセージ', async () => {
      const { getValidSignAccessToken } = await import('./tokens.js');
      vi.mocked(getValidSignAccessToken).mockResolvedValue(null);

      await expect(makeSignApiRequest('GET', '/v1/documents')).rejects.toThrow(
        'sign_authenticate',
      );
    });

    it('401 → 再認証誘導', async () => {
      const { getValidSignAccessToken } = await import('./tokens.js');
      vi.mocked(getValidSignAccessToken).mockResolvedValue('test-token');

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'unauthorized' }),
      });

      await expect(makeSignApiRequest('GET', '/v1/documents')).rejects.toThrow(
        'sign_authenticate',
      );
    });

    it('400 → エラー詳細が含まれる', async () => {
      const { getValidSignAccessToken } = await import('./tokens.js');
      vi.mocked(getValidSignAccessToken).mockResolvedValue('test-token');

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'bad_request', message: 'invalid params' }),
      });

      await expect(makeSignApiRequest('POST', '/v1/documents', undefined, {})).rejects.toThrow(
        '400',
      );
    });
  });

  describe('エッジケース', () => {
    it('API path 先頭スラッシュ有無が正規化される', async () => {
      const { getValidSignAccessToken } = await import('./tokens.js');
      vi.mocked(getValidSignAccessToken).mockResolvedValue('test-token');

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve('{}'),
      });

      await makeSignApiRequest('GET', 'v1/documents');
      const url1 = mockFetch.mock.calls[0][0] as string;

      mockFetch.mockClear();
      await makeSignApiRequest('GET', '/v1/documents');
      const url2 = mockFetch.mock.calls[0][0] as string;

      expect(url1).toBe(url2);
    });

    it('空配列レスポンスが正常に処理される', async () => {
      const { getValidSignAccessToken } = await import('./tokens.js');
      vi.mocked(getValidSignAccessToken).mockResolvedValue('test-token');

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve('[]'),
      });

      const result = await makeSignApiRequest('GET', '/v1/documents');
      expect(result).toEqual([]);
    });
  });

  describe('レートリミット', () => {
    it('429 Too Many Requests → RateLimit 情報を含むエラーメッセージ', async () => {
      const { getValidSignAccessToken } = await import('./tokens.js');
      vi.mocked(getValidSignAccessToken).mockResolvedValue('test-token');

      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({ 'RateLimit-Reset': '30' }),
        json: () => Promise.resolve({ error: 'rate_limited' }),
      });

      await expect(makeSignApiRequest('GET', '/v1/documents')).rejects.toThrow('429');
    });
  });
});
