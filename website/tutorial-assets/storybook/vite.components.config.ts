import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/**/*'],
      exclude: ['src/**/*.stories.tsx', 'src/**/*.test.tsx', 'src/**/*.test.ts'],
      outDir: 'dist',
      insertTypesEntry: true,
    }),
    {
      name: 'preserve-use-client',
      generateBundle(options, bundle) {
        for (const fileName in bundle) {
          const chunk = bundle[fileName];
          if (chunk.type === 'chunk' && (fileName === 'index.js' || fileName === 'index.cjs')) {
            chunk.code = `'use client';\n${chunk.code}`;
          }
        }
      }
    }
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'InductionStorybook',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@storybook/react',
        '@storybook/blocks',
        '@radix-ui/react-compose-refs',
        '@tanstack/query-core',
        '@tanstack/react-query',
        'next-auth/react',
        'next/navigation',
        'next/link',
        'zustand'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    },
    outDir: 'dist',
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    },
    preserveSymlinks: true
  }
})