import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,              // Enable Jest-compatible globals (describe, it, expect)
    environment: 'node',        // Node.js test environment
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'website'],

    // Coverage configuration (matches Jest thresholds)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'src/**/*.ts',
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/**/index.ts',
        'src/apps/cli/main.ts',  // Exclude CLI entry point (tested via E2E)
      ],
      thresholds: {
        // Domain layer
        'src/domain/**/*.ts': {
          branches: 75,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        // Application layer
        'src/application/**/*.ts': {
          branches: 85,
          functions: 100,
          lines: 95,
          statements: 95,
        },
      },
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
