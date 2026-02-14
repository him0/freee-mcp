import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['node_modules/', 'dist/', 'build.ts', '**/*.test.ts', '**/*.spec.ts'],
    },
    // テスト実行時の環境変数設定
    env: {
      NODE_ENV: 'test',
    },
    // テスト実行時のセットアップ
    setupFiles: ['src/test-utils/setup.ts'],
  },
});