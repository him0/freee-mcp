/**
 * vitest 共通セットアップファイル
 * テスト実行前に必要な初期化処理を行う
 */

import { vi } from 'vitest';

// テスト実行時にコンソール出力を抑制
global.console = {
  ...console,
  // 実際のテストでは必要に応じてコメントアウト
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// グローバルなfetchをモック（必要に応じて個別テストで上書き）
global.fetch = vi.fn();

// プロセス終了を防ぐため、process.exit をモック
vi.stubGlobal('process.exit', vi.fn());

// テスト環境でのタイムゾーン設定
process.env.TZ = 'UTC';