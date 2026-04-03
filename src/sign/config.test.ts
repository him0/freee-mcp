import fs from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setupTestTempDir } from '../test-utils/temp-dir.js';
import {
  type SignConfig,
  getSignCredentials,
  loadSignConfig,
  resetSignConfigCache,
} from './config.js';

const { setup: setupTempDir, cleanup: cleanupTempDir } = setupTestTempDir('sign-config-test-');

vi.mock('fs/promises');

const mockFs = vi.mocked(fs);

const originalXdgConfigHome = process.env.XDG_CONFIG_HOME;
const originalSignClientId = process.env.FREEE_SIGN_CLIENT_ID;
const originalSignClientSecret = process.env.FREEE_SIGN_CLIENT_SECRET;

describe('sign/config', () => {
  const validConfig: SignConfig = {
    clientId: 'sign-test-client-id',
    clientSecret: 'sign-test-client-secret',
    callbackPort: 54321,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const testTempDir = await setupTempDir();
    process.env.XDG_CONFIG_HOME = testTempDir;
    delete process.env.FREEE_SIGN_CLIENT_ID;
    delete process.env.FREEE_SIGN_CLIENT_SECRET;
    resetSignConfigCache();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    if (originalXdgConfigHome !== undefined) {
      process.env.XDG_CONFIG_HOME = originalXdgConfigHome;
    } else {
      delete process.env.XDG_CONFIG_HOME;
    }
    if (originalSignClientId !== undefined) {
      process.env.FREEE_SIGN_CLIENT_ID = originalSignClientId;
    } else {
      delete process.env.FREEE_SIGN_CLIENT_ID;
    }
    if (originalSignClientSecret !== undefined) {
      process.env.FREEE_SIGN_CLIENT_SECRET = originalSignClientSecret;
    } else {
      delete process.env.FREEE_SIGN_CLIENT_SECRET;
    }
    await cleanupTempDir();
  });

  describe('loadSignConfig', () => {
    it('sign-config.json から設定を読み込める', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(validConfig));

      const result = await loadSignConfig();
      expect(result).toEqual(validConfig);
    });

    it('sign-config.json 不存在 → デフォルト設定を作成', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(error);
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await loadSignConfig();
      expect(result.clientId).toBeUndefined();
    });

    it('sign-config.json 破損 → エラー + configure 誘導', async () => {
      mockFs.readFile.mockResolvedValue('broken json{{{');

      await expect(loadSignConfig()).rejects.toThrow();
    });
  });

  describe('getSignCredentials', () => {
    it('環境変数 FREEE_SIGN_CLIENT_ID / SECRET で上書きできる', async () => {
      process.env.FREEE_SIGN_CLIENT_ID = 'env-client-id';
      process.env.FREEE_SIGN_CLIENT_SECRET = 'env-client-secret';

      const result = await getSignCredentials();
      expect(result.clientId).toBe('env-client-id');
      expect(result.clientSecret).toBe('env-client-secret');
    });

    it('client_id 未設定 → configure 誘導エラー', async () => {
      mockFs.readFile.mockResolvedValue(
        JSON.stringify({}),
      );

      await expect(getSignCredentials()).rejects.toThrow('freee-sign-mcp configure');
    });

    it('環境変数が片方だけ → エラー', async () => {
      process.env.FREEE_SIGN_CLIENT_ID = 'only-id';

      await expect(getSignCredentials()).rejects.toThrow('両方設定してください');
    });
  });

  describe('freee config 非依存', () => {
    it('既存 loadConfig() を呼び出さない（freee credentials に依存しない）', async () => {
      // loadSignConfig が freee の loadConfig/loadFullConfig を import していないことを確認
      // (実装ファイルの import を検証)
      // getSignCredentials が freee の config.ts に依存しないことを間接的に確認:
      // env vars が設定されていれば、ファイル読み込みなしで credentials を取得できる
      process.env.FREEE_SIGN_CLIENT_ID = 'env-id';
      process.env.FREEE_SIGN_CLIENT_SECRET = 'env-secret';

      const result = await getSignCredentials();
      expect(result.clientId).toBe('env-id');
      // mockFs.readFile が呼ばれていない = loadFullConfig (freee) に依存していない
      expect(mockFs.readFile).not.toHaveBeenCalled();
    });
  });
});
