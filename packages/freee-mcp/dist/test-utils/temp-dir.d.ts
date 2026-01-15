/**
 * テスト用の一時ディレクトリを作成・管理するユーティリティ
 */
export declare class TestTempDir {
    private tempDir;
    private created;
    constructor(prefix?: string);
    /**
     * 一時ディレクトリを作成
     */
    create(): Promise<string>;
    /**
     * 一時ディレクトリのパスを取得
     */
    getPath(): string;
    /**
     * 一時ディレクトリ内のファイルパスを取得
     */
    getFilePath(filename: string): string;
    /**
     * 一時ディレクトリとその中身を削除
     */
    cleanup(): Promise<void>;
}
/**
 * vitest用のテスト一時ディレクトリ管理ヘルパー
 */
export declare function setupTestTempDir(prefix?: string): {
    tempDir: TestTempDir;
    setup(): Promise<string>;
    cleanup(): Promise<void>;
};
