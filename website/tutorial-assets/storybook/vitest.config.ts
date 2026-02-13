import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  test: {
    globals: true,
    environment: 'jsdom', // Use jsdom for React component tests
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    // Limit to 2 cores to prevent resource exhaustion
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        isolate: true,
        minForks: 1,
        maxForks: 2,  // Limited to 2 cores/processes
      },
    },
    
    // Additional resource limits
    maxConcurrency: 5,
    watch: false,  // Disable watch by default
    
    // Prevent memory leaks
    clearMocks: true,
    restoreMocks: true,
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  optimizeDeps: {
    include: [
      '@testing-library/jest-dom',
      '@testing-library/react',
      '@testing-library/jest-dom/matchers',
      'next/router',
      'next/navigation'
    ],
  },
});