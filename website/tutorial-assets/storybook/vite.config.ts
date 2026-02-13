import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../packages/design-system/src'),
      '@/components': path.resolve(__dirname, '../../packages/design-system/src/components'),
      '@/utils': path.resolve(__dirname, '../../packages/design-system/src/utils'),
      '@/styles': path.resolve(__dirname, '../../packages/design-system/src/styles'),
    },
  },
});