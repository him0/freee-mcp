import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['node_modules/', 'dist/', 'build.ts', '**/*.test.ts', '**/*.spec.ts'],
    },
    // テスト実行時の環境変数設定
    env: {
      NODE_ENV: 'test',
      // テスト用のデフォルト値を設定
      FREEE_CLIENT_ID: 'test-client-id',
      FREEE_CLIENT_SECRET: 'test-client-secret',
      FREEE_DEFAULT_COMPANY_ID: '12345',
      FREEE_CALLBACK_PORT: '54321'
    },
    // テスト実行時のセットアップ
    setupFiles: ['src/test-utils/setup.ts'],
  },
});