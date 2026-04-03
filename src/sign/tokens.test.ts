import fs from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setupTestTempDir } from '../test-utils/temp-dir.js';
import {
  type TokenData,
  clearSignTokens,
  getValidSignAccessToken,
  isSignTokenValid,
  loadSignTokens,
  refreshSignAccessToken,
  saveSignTokens,
} from './tokens.js';

const { setup: setupTempDir, cleanup: cleanupTempDir } = setupTestTempDir('sign-tokens-test-');

vi.mock('fs/promises');
vi.mock('./config.js', () => ({
  SIGN_TOKEN_ENDPOINT: 'https://ninja-sign.com/oauth/token',
  SIGN_OAUTH_SCOPE: 'all',
  getSignCredentials: (): Promise<{ clientId: string; clientSecret: string; callbackPort: number }> =>
    Promise.resolve({
      clientId: 'sign-client-id',
      clientSecret: 'sign-client-secret',
      callbackPort: 54321,
    }),
}));

const mockFs = vi.mocked(fs);
const mockFetch = vi.fn();
global.fetch = mockFetch;

const originalXdgConfigHome = process.env.XDG_CONFIG_HOME;

describe('sign/tokens', () => {
  const mockTokenData: TokenData = {
    access_token: 'sign-access-token',
    refresh_token: 'sign-refresh-token',
    expires_at: Date.now() + 7200000,
    token_type: 'Bearer',
    scope: 'all',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const testTempDir = await setupTempDir();
    process.env.XDG_CONFIG_HOME = testTempDir;
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    if (originalXdgConfigHome !== undefined) {
      process.env.XDG_CONFIG_HOME = originalXdgConfigHome;
    } else {
      delete process.env.XDG_CONFIG_HOME;
    }
    await cleanupTempDir();
  });

  describe('saveSignTokens / loadSignTokens', () => {
    it('saveSignTokens → loadSignTokens で往復できる', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await saveSignTokens(mockTokenData);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('sign-tokens.json'),
        JSON.stringify(mockTokenData, null, 2),
        expect.objectContaining({ mode: 0o600 }),
      );
    });

    it('sign-tokens.json 不存在 → null（クラッシュしない）', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(error);

      const result = await loadSignTokens();
      expect(result).toBeNull();
    });

    it('sign-tokens.json 破損 → null（JSON parse error をキャッチ）', async () => {
      mockFs.readFile.mockResolvedValue('invalid json{{{');

      const result = await loadSignTokens();
      expect(result).toBeNull();
    });
  });

  describe('isSignTokenValid', () => {
    it('有効期限内 → true', () => {
      expect(isSignTokenValid(mockTokenData)).toBe(true);
    });

    it('有効期限切れ → false', () => {
      const expired = { ...mockTokenData, expires_at: Date.now() - 1000 };
      expect(isSignTokenValid(expired)).toBe(false);
    });
  });

  describe('refreshSignAccessToken', () => {
    it('新トークンが保存される', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
            expires_in: 7200,
            token_type: 'Bearer',
          }),
      });

      const result = await refreshSignAccessToken('old-refresh-token');

      expect(result.access_token).toBe('new-access-token');
      expect(result.scope).toBe('all');
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('access_token + refresh_token 両方期限切れ → Token refresh failed エラー', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'invalid_grant' }),
      });

      await expect(refreshSignAccessToken('expired-token')).rejects.toThrow(
        'Token refresh failed: 401',
      );
    });
  });

  describe('getValidSignAccessToken', () => {
    it('有効なトークンを返す', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTokenData));

      const result = await getValidSignAccessToken();
      expect(result).toBe('sign-access-token');
    });

    it('トークン不存在 → null', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(error);

      const result = await getValidSignAccessToken();
      expect(result).toBeNull();
    });

    it('access_token 期限切れ + refresh_token 有効 → 自動リフレッシュ成功', async () => {
      const expiredTokenData = {
        ...mockTokenData,
        expires_at: Date.now() - 1000,
      };
      mockFs.readFile.mockResolvedValue(JSON.stringify(expiredTokenData));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'refreshed-access-token',
            refresh_token: 'new-refresh-token',
            expires_in: 7200,
          }),
      });

      const result = await getValidSignAccessToken();
      expect(result).toBe('refreshed-access-token');
    });
  });

  describe('clearSignTokens', () => {
    it('トークンファイルを削除する', async () => {
      mockFs.unlink.mockResolvedValue(undefined);

      await clearSignTokens();
      expect(mockFs.unlink).toHaveBeenCalledWith(expect.stringContaining('sign-tokens.json'));
    });

    it('ファイルが存在しない場合もエラーにならない', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockFs.unlink.mockRejectedValue(error);

      await expect(clearSignTokens()).resolves.not.toThrow();
    });
  });
});
