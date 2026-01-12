import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import {
  loadFullConfig,
  saveFullConfig,
  getCurrentCompanyId,
  setCurrentCompany,
  getCompanyInfo,
  FullConfig,
} from './companies.js';
import { setupTestTempDir } from '../test-utils/temp-dir.js';
import { APP_NAME } from '../constants.js';

const { tempDir, setup: setupTempDir, cleanup: cleanupTempDir } = setupTestTempDir('companies-test-');

vi.mock('fs/promises');

const mockFs = vi.mocked(fs);

const originalXdgConfigHome = process.env.XDG_CONFIG_HOME;

describe('companies', () => {
  const validConfig: FullConfig = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    callbackPort: 8080,
    defaultCompanyId: '123',
    currentCompanyId: '123',
    companies: {
      '123': {
        id: '123',
        name: 'Test Company',
        addedAt: Date.now(),
      },
    },
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

  describe('loadFullConfig', () => {
    it('should load valid config from file', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(validConfig));

      const result = await loadFullConfig();

      expect(result).toEqual(validConfig);
    });

    it('should create default config if file does not exist', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(error);
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await loadFullConfig();

      expect(result.defaultCompanyId).toBe('0');
      expect(result.currentCompanyId).toBe('0');
      expect(result.companies).toEqual({});
    });

    it('should throw error for invalid config structure', async () => {
      const invalidData = { invalid: 'data' };
      mockFs.readFile.mockResolvedValue(JSON.stringify(invalidData));

      await expect(loadFullConfig()).rejects.toThrow('Invalid config file:');
    });

    it('should throw error when config is missing required fields', async () => {
      const incompleteConfig = {
        clientId: 'test',
        // missing defaultCompanyId, currentCompanyId, companies
      };
      mockFs.readFile.mockResolvedValue(JSON.stringify(incompleteConfig));

      await expect(loadFullConfig()).rejects.toThrow('Invalid config file:');
    });

    it('should throw error when config has wrong field types', async () => {
      const wrongTypeConfig = {
        clientId: 'test', // Include clientId to avoid legacy migration path
        defaultCompanyId: 123, // should be string
        currentCompanyId: '456',
        companies: {},
      };
      mockFs.readFile.mockResolvedValue(JSON.stringify(wrongTypeConfig));

      await expect(loadFullConfig()).rejects.toThrow('Invalid config file:');
    });

    it('should throw error when company config has invalid structure', async () => {
      const invalidCompanyConfig = {
        clientId: 'test', // Include clientId to avoid legacy migration path
        defaultCompanyId: '123',
        currentCompanyId: '123',
        companies: {
          '123': {
            id: '123',
            name: 'Test',
            addedAt: 'not-a-number', // should be number
          },
        },
      };
      mockFs.readFile.mockResolvedValue(JSON.stringify(invalidCompanyConfig));

      await expect(loadFullConfig()).rejects.toThrow('Invalid config file:');
    });

    it('should migrate legacy config format', async () => {
      const legacyConfig = {
        defaultCompanyId: '456',
        currentCompanyId: '456',
        companies: {
          '456': {
            id: '456',
            name: 'Legacy Company',
            addedAt: Date.now(),
          },
        },
      };
      mockFs.readFile.mockResolvedValue(JSON.stringify(legacyConfig));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await loadFullConfig();

      expect(result.defaultCompanyId).toBe('456');
      expect(result.currentCompanyId).toBe('456');
      expect(result.clientId).toBeUndefined();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('古い設定形式を検出しました')
      );
    });
  });

  describe('saveFullConfig', () => {
    it('should save config to file', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await saveFullConfig(validConfig);

      expect(mockFs.mkdir).toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(tempDir.getPath(), APP_NAME, 'config.json'),
        JSON.stringify(validConfig, null, 2),
        expect.any(Object)
      );
    });
  });

  describe('getCurrentCompanyId', () => {
    it('should return current company ID', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(validConfig));

      const result = await getCurrentCompanyId();

      expect(result).toBe('123');
    });
  });

  describe('setCurrentCompany', () => {
    it('should set current company', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(validConfig));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await setCurrentCompany('456', 'New Company');

      expect(mockFs.writeFile).toHaveBeenCalled();
    });
  });

  describe('getCompanyInfo', () => {
    it('should return company info', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(validConfig));

      const result = await getCompanyInfo('123');

      expect(result?.id).toBe('123');
      expect(result?.name).toBe('Test Company');
    });

    it('should return null for unknown company', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(validConfig));

      const result = await getCompanyInfo('999');

      expect(result).toBeNull();
    });
  });
});
