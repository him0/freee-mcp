import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * テスト用の一時ディレクトリを作成・管理するユーティリティ
 */
export class TestTempDir {
  private tempDir: string;
  private created = false;

  constructor(prefix = 'freee-mcp-test-') {
    // テスト用の一時ディレクトリパスを生成
    const tmpDir = os.tmpdir() || '/tmp';
    this.tempDir = path.join(tmpDir, `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  }

  /**
   * 一時ディレクトリを作成
   */
  async create(): Promise<string> {
    if (!this.created) {
      await fs.mkdir(this.tempDir, { recursive: true });
      this.created = true;
    }
    return this.tempDir;
  }

  /**
   * 一時ディレクトリのパスを取得
   */
  getPath(): string {
    return this.tempDir;
  }

  /**
   * 一時ディレクトリ内のファイルパスを取得
   */
  getFilePath(filename: string): string {
    return path.join(this.tempDir, filename);
  }

  /**
   * 一時ディレクトリとその中身を削除
   */
  async cleanup(): Promise<void> {
    if (this.created) {
      try {
        await fs.rm(this.tempDir, { recursive: true, force: true });
        this.created = false;
      } catch (error) {
        // クリーンアップエラーは警告として出力
        console.warn(`Failed to cleanup temp directory ${this.tempDir}:`, error);
      }
    }
  }
}

/**
 * vitest用のテスト一時ディレクトリ管理ヘルパー
 */
export function setupTestTempDir(prefix?: string): { tempDir: TestTempDir; setup(): Promise<string>; cleanup(): Promise<void> } {
  const tempDir = new TestTempDir(prefix);
  
  return {
    tempDir,
    /**
     * beforeEach で呼び出す用のセットアップ関数
     */
    async setup(): Promise<string> {
      return await tempDir.create();
    },
    /**
     * afterEach で呼び出す用のクリーンアップ関数
     */
    async cleanup(): Promise<void> {
      await tempDir.cleanup();
    }
  };
}