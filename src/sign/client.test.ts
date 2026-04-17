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

      await expect(makeSignApiRequest('GET', '/v1/documents')).rejects.toThrow('sign_authenticate');
    });

    it('401 → 再認証誘導', async () => {
      const { getValidSignAccessToken } = await import('./tokens.js');
      vi.mocked(getValidSignAccessToken).mockResolvedValue('test-token');

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'unauthorized' }),
      });

      await expect(makeSignApiRequest('GET', '/v1/documents')).rejects.toThrow('sign_authenticate');
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

  describe('tokenContext', () => {
    it('tokenContext 未指定時は getValidSignAccessToken が呼ばれる', async () => {
      const { getValidSignAccessToken } = await import('./tokens.js');
      vi.mocked(getValidSignAccessToken).mockResolvedValue('file-token');

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve(JSON.stringify({ ok: true })),
      });

      await makeSignApiRequest('GET', '/v1/documents');

      expect(getValidSignAccessToken).toHaveBeenCalled();
      expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer file-token');
    });

    it('tokenContext 指定時は tokenStore.getValidAccessToken が呼ばれる', async () => {
      const { getValidSignAccessToken } = await import('./tokens.js');
      vi.mocked(getValidSignAccessToken).mockResolvedValue(null);

      const mockTokenStore = {
        getValidAccessToken: vi.fn().mockResolvedValue('redis-token'),
        loadTokens: vi.fn(),
        saveTokens: vi.fn(),
        clearTokens: vi.fn(),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve(JSON.stringify({ ok: true })),
      });

      await makeSignApiRequest('GET', '/v1/documents', undefined, undefined, {
        userId: 'user-1',
        tokenStore: mockTokenStore,
      });

      expect(getValidSignAccessToken).not.toHaveBeenCalled();
      expect(mockTokenStore.getValidAccessToken).toHaveBeenCalledWith('user-1');
      expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer redis-token');
    });

    it('tokenContext 指定時で tokenStore が null を返す → 認証エラー', async () => {
      const mockTokenStore = {
        getValidAccessToken: vi.fn().mockResolvedValue(null),
        loadTokens: vi.fn(),
        saveTokens: vi.fn(),
        clearTokens: vi.fn(),
      };

      await expect(
        makeSignApiRequest('GET', '/v1/documents', undefined, undefined, {
          userId: 'user-1',
          tokenStore: mockTokenStore,
        }),
      ).rejects.toThrow('認証が必要です');
    });
  });

  describe('canonical log の query_keys 連携', () => {
    it('クエリキー名のみが api.calls[].query_keys に記録され、値は流出しない', async () => {
      // makeSignApiRequest 経由でも api.calls[].query_keys にキー名のみが
      // 入り、値はペイロードに漏れないことを保証する
      const { getValidSignAccessToken } = await import('./tokens.js');
      vi.mocked(getValidSignAccessToken).mockResolvedValue('test-token');

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve('[]'),
      });

      const { RequestRecorder, withRequestRecorder } = await import('../server/request-context.js');
      const recorder = new RequestRecorder({
        request_id: 'req-sign-success',
        source_ip: '127.0.0.1',
        method: 'POST',
        path: '/mcp',
      });

      await withRequestRecorder(recorder, () =>
        makeSignApiRequest('GET', '/v1/documents', { page: 1, per: 10 }),
      );

      const payload = recorder.buildPayload({ status: 200, duration_ms: 1 });
      const apiCalls = payload.api.calls as Array<Record<string, unknown>>;
      expect(apiCalls).toHaveLength(1);
      expect(apiCalls[0]).toMatchObject({
        method: 'GET',
        status_code: 200,
        error_type: null,
        query_keys: ['page', 'per'],
      });
      const serialized = JSON.stringify(apiCalls[0]);
      expect(serialized).not.toContain('page=1');
      expect(serialized).not.toContain('per=10');
      expect(serialized).not.toMatch(/"1"/);
      expect(serialized).not.toMatch(/"10"/);
    });

    it('params が {} のときは query_keys を記録しない', async () => {
      const { getValidSignAccessToken } = await import('./tokens.js');
      vi.mocked(getValidSignAccessToken).mockResolvedValue('test-token');

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve('{}'),
      });

      const { RequestRecorder, withRequestRecorder } = await import('../server/request-context.js');
      const recorder = new RequestRecorder({
        request_id: 'req-sign-empty-params',
        source_ip: '127.0.0.1',
        method: 'POST',
        path: '/mcp',
      });

      await withRequestRecorder(recorder, () => makeSignApiRequest('GET', '/v1/documents', {}));

      const payload = recorder.buildPayload({ status: 200, duration_ms: 1 });
      const apiCalls = payload.api.calls as Array<Record<string, unknown>>;
      expect(apiCalls).toHaveLength(1);
      expect(apiCalls[0]?.query_keys).toBeUndefined();
    });
  });
});
