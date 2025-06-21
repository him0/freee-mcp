import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { 
  TokenData, 
  saveTokens, 
  loadTokens, 
  isTokenValid, 
  refreshAccessToken, 
  clearTokens, 
  getValidAccessToken 
} from './tokens.js';
import { setupTestTempDir } from '../test-utils/temp-dir.js';

// テスト用一時ディレクトリの設定
const { tempDir, setup: setupTempDir, cleanup: cleanupTempDir } = setupTestTempDir('tokens-test-');

vi.mock('fs/promises');
vi.mock('../config.js', () => ({
  config: {
    oauth: {
      tokenEndpoint: 'https://test.freee.co.jp/token',
      scope: 'read write'
    },
    freee: {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret'
    }
  }
}));


// osモジュールをモックして、テスト用ディレクトリを返すようにする
vi.mock('os', () => ({
  default: {
    homedir: vi.fn(),
    tmpdir: vi.fn().mockReturnValue('/tmp')
  }
}));
const mockOs = vi.mocked(os);

const mockFs = vi.mocked(fs);
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('tokens', () => {
  const mockTokenData: TokenData = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_at: Date.now() + 3600000,
    token_type: 'Bearer',
    scope: 'read write'
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // テスト用一時ディレクトリを設定
    const testTempDir = await setupTempDir();
    mockOs.homedir.mockReturnValue(testTempDir);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    // テスト用一時ディレクトリをクリーンアップ
    await cleanupTempDir();
  });

  describe('saveTokens', () => {
    it('should save tokens to file', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await saveTokens(mockTokenData);

      const expectedConfigDir = path.join(tempDir.getPath(), '.config', 'freee-mcp');
      const expectedTokenPath = path.join(expectedConfigDir, 'tokens.json');

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expectedConfigDir,
        { recursive: true }
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expectedTokenPath,
        JSON.stringify(mockTokenData, null, 2),
        { mode: 0o600 }
      );
    });

    it('should throw error if saving fails', async () => {
      const error = new Error('Permission denied');
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockRejectedValue(error);

      await expect(saveTokens(mockTokenData)).rejects.toThrow('Permission denied');
    });
  });

  describe('loadTokens', () => {
    it('should load tokens from file', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTokenData));

      const result = await loadTokens();

      expect(result).toEqual(mockTokenData);
      expect(mockFs.readFile).toHaveBeenCalledWith(
        path.join(tempDir.getPath(), '.config', 'freee-mcp', 'tokens.json'),
        'utf8'
      );
    });

    it('should return null if file does not exist', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(error);

      const result = await loadTokens();

      expect(result).toBeNull();
    });

    it('should throw error for other file errors', async () => {
      const error = new Error('Permission denied');
      mockFs.readFile.mockRejectedValue(error);

      await expect(loadTokens()).rejects.toThrow('Permission denied');
    });
  });

  describe('isTokenValid', () => {
    it('should return true for valid token', () => {
      const validToken: TokenData = {
        ...mockTokenData,
        expires_at: Date.now() + 3600000
      };

      expect(isTokenValid(validToken)).toBe(true);
    });

    it('should return false for expired token', () => {
      const expiredToken: TokenData = {
        ...mockTokenData,
        expires_at: Date.now() - 3600000
      };

      expect(isTokenValid(expiredToken)).toBe(false);
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      const refreshResponse = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'read write'
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(refreshResponse)
      });
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await refreshAccessToken('old-refresh-token');

      expect(result.access_token).toBe('new-access-token');
      expect(result.refresh_token).toBe('new-refresh-token');
      expect(mockFetch).toHaveBeenCalledWith('https://test.freee.co.jp/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: 'old-refresh-token',
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
        }),
      });
    });

    it('should throw error if refresh fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'invalid_grant' })
      });

      await expect(refreshAccessToken('invalid-token')).rejects.toThrow('Token refresh failed: 401');
    });
  });

  describe('clearTokens', () => {
    it('should clear tokens successfully', async () => {
      mockFs.unlink.mockResolvedValue(undefined);

      await clearTokens();

      expect(mockFs.unlink).toHaveBeenCalledWith(
        path.join(tempDir.getPath(), '.config', 'freee-mcp', 'tokens.json')
      );
    });

    it('should handle file not found gracefully', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockFs.unlink.mockRejectedValue(error);

      await expect(clearTokens()).resolves.toBeUndefined();
    });
  });

  describe('getValidAccessToken', () => {
    it('should return valid access token', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTokenData));

      const result = await getValidAccessToken();

      expect(result).toBe('test-access-token');
    });

    it('should return null if no tokens exist', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(error);

      const result = await getValidAccessToken();

      expect(result).toBeNull();
    });

    it('should refresh expired token', async () => {
      const expiredToken = {
        ...mockTokenData,
        expires_at: Date.now() - 3600000
      };
      
      mockFs.readFile.mockResolvedValue(JSON.stringify(expiredToken));
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600
        })
      });
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await getValidAccessToken();

      expect(result).toBe('new-access-token');
    });
  });
});