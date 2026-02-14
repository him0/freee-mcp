import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import {
  getMcpConfigPath,
  getTargetDisplayName,
  checkMcpConfigStatus,
  addFreeeMcpConfig,
  removeFreeeMcpConfig,
} from './mcp-config.js';

vi.mock('node:fs/promises');
vi.mock('node:os');

const mockFs = vi.mocked(fs);
const mockOs = vi.mocked(os);

describe('mcp-config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOs.homedir.mockReturnValue('/home/testuser');
    mockOs.platform.mockReturnValue('linux');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getMcpConfigPath', () => {
    it('should return Claude Code config path', () => {
      const path = getMcpConfigPath('claude-code');
      expect(path).toBe('/home/testuser/.claude.json');
    });

    it('should return Claude Desktop config path for Linux', () => {
      mockOs.platform.mockReturnValue('linux');
      const path = getMcpConfigPath('claude-desktop');
      expect(path).toBe('/home/testuser/.config/Claude/claude_desktop_config.json');
    });

    it('should return Claude Desktop config path for macOS', () => {
      mockOs.platform.mockReturnValue('darwin');
      const path = getMcpConfigPath('claude-desktop');
      expect(path).toBe('/home/testuser/Library/Application Support/Claude/claude_desktop_config.json');
    });

    it('should return Claude Desktop config path for Windows', () => {
      mockOs.platform.mockReturnValue('win32');
      const originalAppData = process.env.APPDATA;
      process.env.APPDATA = 'C:\\Users\\testuser\\AppData\\Roaming';

      const path = getMcpConfigPath('claude-desktop');
      expect(path).toBe('C:\\Users\\testuser\\AppData\\Roaming/Claude/claude_desktop_config.json');

      if (originalAppData !== undefined) {
        process.env.APPDATA = originalAppData;
      } else {
        delete process.env.APPDATA;
      }
    });

    it('should use fallback path for Windows when APPDATA is not set', () => {
      mockOs.platform.mockReturnValue('win32');
      const originalAppData = process.env.APPDATA;
      delete process.env.APPDATA;

      const path = getMcpConfigPath('claude-desktop');
      expect(path).toBe('/home/testuser/AppData/Roaming/Claude/claude_desktop_config.json');

      if (originalAppData !== undefined) {
        process.env.APPDATA = originalAppData;
      }
    });
  });

  describe('getTargetDisplayName', () => {
    it('should return "Claude Code" for claude-code target', () => {
      expect(getTargetDisplayName('claude-code')).toBe('Claude Code');
    });

    it('should return "Claude Desktop" for claude-desktop target', () => {
      expect(getTargetDisplayName('claude-desktop')).toBe('Claude Desktop');
    });
  });

  describe('checkMcpConfigStatus', () => {
    it('should return exists=false when config file does not exist', async () => {
      mockFs.access.mockRejectedValue(new Error('ENOENT'));

      const status = await checkMcpConfigStatus('claude-code');

      expect(status.path).toBe('/home/testuser/.claude.json');
      expect(status.exists).toBe(false);
      expect(status.hasFreeeConfig).toBe(false);
    });

    it('should return hasFreeeConfig=false when config exists but has no freee-mcp', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify({ mcpServers: {} }));

      const status = await checkMcpConfigStatus('claude-code');

      expect(status.exists).toBe(true);
      expect(status.hasFreeeConfig).toBe(false);
    });

    it('should return hasFreeeConfig=true when freee-mcp is configured', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(
        JSON.stringify({
          mcpServers: {
            'freee-mcp': { command: 'npx', args: ['@him0/freee-mcp'] },
          },
        })
      );

      const status = await checkMcpConfigStatus('claude-code');

      expect(status.exists).toBe(true);
      expect(status.hasFreeeConfig).toBe(true);
    });

    it('should handle malformed JSON gracefully', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('invalid json');

      const status = await checkMcpConfigStatus('claude-code');

      expect(status.exists).toBe(true);
      expect(status.hasFreeeConfig).toBe(false);
    });
  });

  describe('addFreeeMcpConfig', () => {
    it('should create new config file when it does not exist', async () => {
      mockFs.readFile.mockRejectedValue(new Error('ENOENT'));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await addFreeeMcpConfig('claude-code');

      expect(mockFs.mkdir).toHaveBeenCalledWith('/home/testuser', { recursive: true });
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '/home/testuser/.claude.json',
        expect.stringContaining('"freee-mcp"'),
        'utf-8'
      );

      const writtenContent = JSON.parse(
        (mockFs.writeFile.mock.calls[0][1] as string).trim()
      );
      expect(writtenContent.mcpServers['freee-mcp']).toEqual({
        command: 'npx',
        args: ['@him0/freee-mcp'],
      });
    });

    it('should preserve existing config when adding freee-mcp', async () => {
      const existingConfig = {
        someOtherSetting: true,
        mcpServers: {
          'other-mcp': { command: 'npx', args: ['other-mcp'] },
        },
      };
      mockFs.readFile.mockResolvedValue(JSON.stringify(existingConfig));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await addFreeeMcpConfig('claude-code');

      const writtenContent = JSON.parse(
        (mockFs.writeFile.mock.calls[0][1] as string).trim()
      );
      expect(writtenContent.someOtherSetting).toBe(true);
      expect(writtenContent.mcpServers['other-mcp']).toEqual({
        command: 'npx',
        args: ['other-mcp'],
      });
      expect(writtenContent.mcpServers['freee-mcp']).toEqual({
        command: 'npx',
        args: ['@him0/freee-mcp'],
      });
    });

    it('should create mcpServers object when config exists without it', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify({ someOtherSetting: true }));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await addFreeeMcpConfig('claude-code');

      const writtenContent = JSON.parse(
        (mockFs.writeFile.mock.calls[0][1] as string).trim()
      );
      expect(writtenContent.mcpServers['freee-mcp']).toBeDefined();
    });
  });

  describe('removeFreeeMcpConfig', () => {
    it('should do nothing when config file does not exist', async () => {
      mockFs.readFile.mockRejectedValue(new Error('ENOENT'));

      await removeFreeeMcpConfig('claude-code');

      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('should do nothing when freee-mcp is not configured', async () => {
      mockFs.readFile.mockResolvedValue(
        JSON.stringify({
          mcpServers: {
            'other-mcp': { command: 'npx', args: ['other-mcp'] },
          },
        })
      );

      await removeFreeeMcpConfig('claude-code');

      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('should remove freee-mcp while preserving other servers', async () => {
      mockFs.readFile.mockResolvedValue(
        JSON.stringify({
          mcpServers: {
            'other-mcp': { command: 'npx', args: ['other-mcp'] },
            'freee-mcp': { command: 'npx', args: ['@him0/freee-mcp'] },
          },
        })
      );
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await removeFreeeMcpConfig('claude-code');

      const writtenContent = JSON.parse(
        (mockFs.writeFile.mock.calls[0][1] as string).trim()
      );
      expect(writtenContent.mcpServers['other-mcp']).toBeDefined();
      expect(writtenContent.mcpServers['freee-mcp']).toBeUndefined();
    });

    it('should remove mcpServers object when it becomes empty', async () => {
      mockFs.readFile.mockResolvedValue(
        JSON.stringify({
          someOtherSetting: true,
          mcpServers: {
            'freee-mcp': { command: 'npx', args: ['@him0/freee-mcp'] },
          },
        })
      );
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await removeFreeeMcpConfig('claude-code');

      const writtenContent = JSON.parse(
        (mockFs.writeFile.mock.calls[0][1] as string).trim()
      );
      expect(writtenContent.someOtherSetting).toBe(true);
      expect(writtenContent.mcpServers).toBeUndefined();
    });
  });

  describe('integration scenarios', () => {
    it('should handle full add-check-remove cycle', async () => {
      // Step 1: Config does not exist
      mockFs.access.mockRejectedValueOnce(new Error('ENOENT'));
      const initialStatus = await checkMcpConfigStatus('claude-code');
      expect(initialStatus.exists).toBe(false);
      expect(initialStatus.hasFreeeConfig).toBe(false);

      // Step 2: Add freee-mcp
      mockFs.readFile.mockRejectedValueOnce(new Error('ENOENT'));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
      await addFreeeMcpConfig('claude-code');

      // Step 3: Check again (simulate file now exists with freee-mcp)
      mockFs.access.mockResolvedValueOnce(undefined);
      mockFs.readFile.mockResolvedValueOnce(
        JSON.stringify({
          mcpServers: {
            'freee-mcp': { command: 'npx', args: ['@him0/freee-mcp'] },
          },
        })
      );
      const afterAddStatus = await checkMcpConfigStatus('claude-code');
      expect(afterAddStatus.exists).toBe(true);
      expect(afterAddStatus.hasFreeeConfig).toBe(true);

      // Step 4: Remove freee-mcp
      mockFs.readFile.mockResolvedValueOnce(
        JSON.stringify({
          mcpServers: {
            'freee-mcp': { command: 'npx', args: ['@him0/freee-mcp'] },
          },
        })
      );
      await removeFreeeMcpConfig('claude-code');

      // Step 5: Verify final state
      mockFs.access.mockResolvedValueOnce(undefined);
      mockFs.readFile.mockResolvedValueOnce(JSON.stringify({}));
      const finalStatus = await checkMcpConfigStatus('claude-code');
      expect(finalStatus.exists).toBe(true);
      expect(finalStatus.hasFreeeConfig).toBe(false);
    });
  });
});
