import fs from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setupTestTempDir } from '../test-utils/temp-dir.js';
import {
  getSignCredentials,
  loadSignConfig,
  resetSignConfigCache,
  type SignConfig,
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
    callbackPort: 54322,
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
      mockFs.readFile.mockResolvedValue(JSON.stringify({}));

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

describe('loadSignRemoteServerConfig', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env.SIGN_ISSUER_URL = 'https://sign-mcp.example.com';
    process.env.SIGN_JWT_SECRET = 'a-sign-test-secret-that-is-at-least-32-characters-long';
    process.env.FREEE_SIGN_CLIENT_ID = 'sign-client-id';
    process.env.FREEE_SIGN_CLIENT_SECRET = 'sign-client-secret';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('全環境変数が設定されている場合は正常に Config が返る', async () => {
    const { loadSignRemoteServerConfig } = await import('./config.js');
    const config = loadSignRemoteServerConfig();

    expect(config).toEqual({
      port: 3002,
      issuerUrl: 'https://sign-mcp.example.com',
      jwtSecret: 'a-sign-test-secret-that-is-at-least-32-characters-long',
      signClientId: 'sign-client-id',
      signClientSecret: 'sign-client-secret',
      signAuthorizationEndpoint: 'https://ninja-sign.com/oauth/authorize',
      signTokenEndpoint: 'https://ninja-sign.com/oauth/token',
      signScope: 'all',
      redisUrl: 'redis://localhost:6379',
      corsAllowedOrigins: undefined,
      rateLimitEnabled: true,
      logLevel: 'info',
    });
  });

  it('SIGN_RATE_LIMIT_ENABLED 未設定 → デフォルト true（secure-by-default）', async () => {
    delete process.env.SIGN_RATE_LIMIT_ENABLED;
    const { loadSignRemoteServerConfig } = await import('./config.js');
    const config = loadSignRemoteServerConfig();

    expect(config.rateLimitEnabled).toBe(true);
  });

  it('SIGN_RATE_LIMIT_ENABLED=false で明示的に無効化できる', async () => {
    process.env.SIGN_RATE_LIMIT_ENABLED = 'false';
    const { loadSignRemoteServerConfig } = await import('./config.js');
    const config = loadSignRemoteServerConfig();

    expect(config.rateLimitEnabled).toBe(false);
  });

  it('SIGN_RATE_LIMIT_ENABLED が不正値 → エラー', async () => {
    process.env.SIGN_RATE_LIMIT_ENABLED = 'maybe';
    const { loadSignRemoteServerConfig } = await import('./config.js');

    expect(() => loadSignRemoteServerConfig()).toThrow('SIGN_RATE_LIMIT_ENABLED');
  });

  it('SIGN_LOG_LEVEL が pino で許容されない値 → エラー', async () => {
    process.env.SIGN_LOG_LEVEL = 'verbose';
    const { loadSignRemoteServerConfig } = await import('./config.js');

    expect(() => loadSignRemoteServerConfig()).toThrow('SIGN_LOG_LEVEL');
  });

  it('SIGN_ISSUER_URL が URL 形式でない → エラー', async () => {
    process.env.SIGN_ISSUER_URL = 'not-a-url';
    const { loadSignRemoteServerConfig } = await import('./config.js');

    expect(() => loadSignRemoteServerConfig()).toThrow('SIGN_ISSUER_URL');
  });

  it('SIGN_ISSUER_URL 未設定 → エラー', async () => {
    delete process.env.SIGN_ISSUER_URL;
    const { loadSignRemoteServerConfig } = await import('./config.js');

    expect(() => loadSignRemoteServerConfig()).toThrow('SIGN_ISSUER_URL');
  });

  it('SIGN_JWT_SECRET 未設定 → エラー', async () => {
    delete process.env.SIGN_JWT_SECRET;
    const { loadSignRemoteServerConfig } = await import('./config.js');

    expect(() => loadSignRemoteServerConfig()).toThrow('SIGN_JWT_SECRET');
  });

  it('SIGN_JWT_SECRET が 32 文字未満 → エラー', async () => {
    process.env.SIGN_JWT_SECRET = 'short';
    const { loadSignRemoteServerConfig } = await import('./config.js');

    expect(() => loadSignRemoteServerConfig()).toThrow('at least 32 characters');
  });

  it('FREEE_SIGN_CLIENT_ID / SECRET 未設定 → エラー', async () => {
    delete process.env.FREEE_SIGN_CLIENT_ID;
    delete process.env.FREEE_SIGN_CLIENT_SECRET;
    const { loadSignRemoteServerConfig } = await import('./config.js');

    expect(() => loadSignRemoteServerConfig()).toThrow('FREEE_SIGN_CLIENT_ID');
  });
});

describe('summarizeSignRemoteServerConfig', () => {
  it('jwtSecret と signClientSecret はマスクされる', async () => {
    const { summarizeSignRemoteServerConfig } = await import('./config.js');
    const summary = summarizeSignRemoteServerConfig({
      port: 3002,
      issuerUrl: 'https://sign-mcp.example.com',
      jwtSecret: 'a-sign-test-secret-that-is-at-least-32-characters-long',
      signClientId: 'cid',
      signClientSecret: 'csec',
      signAuthorizationEndpoint: 'https://ninja-sign.com/oauth/authorize',
      signTokenEndpoint: 'https://ninja-sign.com/oauth/token',
      signScope: 'all',
      redisUrl: 'redis://localhost:6379',
      rateLimitEnabled: true,
      logLevel: 'info',
    });

    expect(summary.jwtSecret).toBe('<redacted>');
    expect(summary.signClientSecret).toBe('<redacted>');
    expect(summary.signClientId).toBe('cid');
    expect(summary.rateLimitEnabled).toBe(true);
  });
});
