import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import {
  findLegacyTokenFiles,
  tryMigrateLegacyTokens,
  clearLegacyTokens
} from './token-migration.js';
import { TokenData } from './tokens.js';
import { setupTestTempDir } from '../test-utils/temp-dir.js';
import { APP_NAME } from '../constants.js';

const { tempDir, setup: setupTempDir, cleanup: cleanupTempDir } = setupTestTempDir('token-migration-test-');

vi.mock('fs/promises');

const mockFs = vi.mocked(fs);

const originalXdgConfigHome = process.env.XDG_CONFIG_HOME;

describe('token-migration', () => {
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

  describe('findLegacyTokenFiles', () => {
    it('should find legacy token files', async () => {
      mockFs.readdir.mockResolvedValue([
        'tokens-12345.json',
        'tokens-67890.json',
        'config.json',
        'tokens.json'
      ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

      const result = await findLegacyTokenFiles();

      expect(result).toEqual(['tokens-12345.json', 'tokens-67890.json']);
    });

    it('should return empty array when no legacy files exist', async () => {
      mockFs.readdir.mockResolvedValue([
        'config.json',
        'tokens.json'
      ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

      const result = await findLegacyTokenFiles();

      expect(result).toEqual([]);
    });

    it('should return empty array when directory read fails', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Permission denied'));

      const result = await findLegacyTokenFiles();

      expect(result).toEqual([]);
    });
  });

  describe('tryMigrateLegacyTokens', () => {
    it('should migrate legacy tokens and clean up old files', async () => {
      const mockSaveTokens = vi.fn().mockResolvedValue(undefined);

      mockFs.readdir.mockResolvedValue([
        'tokens-12345.json'
      ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTokenData));
      mockFs.unlink.mockResolvedValue(undefined);

      const result = await tryMigrateLegacyTokens(mockSaveTokens);

      expect(result).toEqual(mockTokenData);
      expect(mockSaveTokens).toHaveBeenCalledWith(mockTokenData);
      expect(mockFs.unlink).toHaveBeenCalledWith(
        path.join(tempDir.getPath(), APP_NAME, 'tokens-12345.json')
      );
      expect(console.error).toHaveBeenCalledWith(
        '[info] Migrated legacy company-specific tokens to user-based tokens'
      );
    });

    it('should return null when no legacy files exist', async () => {
      const mockSaveTokens = vi.fn();

      mockFs.readdir.mockResolvedValue([] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

      const result = await tryMigrateLegacyTokens(mockSaveTokens);

      expect(result).toBeNull();
      expect(mockSaveTokens).not.toHaveBeenCalled();
    });

    it('should return null when legacy token file is invalid', async () => {
      const mockSaveTokens = vi.fn();

      mockFs.readdir.mockResolvedValue([
        'tokens-12345.json'
      ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);
      mockFs.readFile.mockResolvedValue(JSON.stringify({ invalid: 'data' }));

      const result = await tryMigrateLegacyTokens(mockSaveTokens);

      expect(result).toBeNull();
      expect(mockSaveTokens).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        '[error] Invalid legacy token file:',
        expect.any(String)
      );
    });

    it('should handle errors gracefully', async () => {
      const mockSaveTokens = vi.fn();

      mockFs.readdir.mockRejectedValue(new Error('Read error'));

      const result = await tryMigrateLegacyTokens(mockSaveTokens);

      expect(result).toBeNull();
    });

    it('should continue cleanup even if some files fail to delete', async () => {
      const mockSaveTokens = vi.fn().mockResolvedValue(undefined);

      mockFs.readdir.mockResolvedValue([
        'tokens-12345.json',
        'tokens-67890.json'
      ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTokenData));
      mockFs.unlink
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Permission denied'));

      const result = await tryMigrateLegacyTokens(mockSaveTokens);

      expect(result).toEqual(mockTokenData);
      expect(console.error).toHaveBeenCalledWith(
        '[warn] Failed to clean up legacy token file tokens-67890.json:',
        expect.any(Error)
      );
    });
  });

  describe('clearLegacyTokens', () => {
    it('should clear all legacy token files', async () => {
      mockFs.readdir.mockResolvedValue([
        'tokens-12345.json',
        'tokens-67890.json'
      ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);
      mockFs.unlink.mockResolvedValue(undefined);

      await clearLegacyTokens();

      const configDir = path.join(tempDir.getPath(), APP_NAME);
      expect(mockFs.unlink).toHaveBeenCalledWith(path.join(configDir, 'tokens-12345.json'));
      expect(mockFs.unlink).toHaveBeenCalledWith(path.join(configDir, 'tokens-67890.json'));
      expect(console.error).toHaveBeenCalledWith('[info] Cleared legacy company-specific token files');
    });

    it('should not log when no legacy files exist', async () => {
      mockFs.readdir.mockResolvedValue([] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

      await clearLegacyTokens();

      expect(mockFs.unlink).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully when readdir fails', async () => {
      // findLegacyTokenFiles catches readdir errors and returns empty array
      // so clearLegacyTokens completes without logging an error
      mockFs.readdir.mockRejectedValue(new Error('Read error'));

      await expect(clearLegacyTokens()).resolves.toBeUndefined();

      // No error should be logged since findLegacyTokenFiles handles the error
      expect(mockFs.unlink).not.toHaveBeenCalled();
    });

    it('should continue cleanup even if some files fail to delete', async () => {
      mockFs.readdir.mockResolvedValue([
        'tokens-12345.json',
        'tokens-67890.json'
      ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);
      mockFs.unlink
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Permission denied'));

      await clearLegacyTokens();

      expect(console.error).toHaveBeenCalledWith(
        '[warn] Failed to clear legacy token file tokens-67890.json:',
        expect.any(Error)
      );
    });
  });
});
