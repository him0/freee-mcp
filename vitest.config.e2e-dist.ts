import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for testing built dist files
 * Tests dynamic file loading and ensures dist is self-contained
 */
export default defineConfig({
  test: {
    globals: true,
    include: ['test/e2e-dist/**/*.test.ts'],
    // No mocks - we want to test the real dist files
    // No setup files to avoid interference
  },
});
