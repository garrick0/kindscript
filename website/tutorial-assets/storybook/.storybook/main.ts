import type { StorybookConfig } from '@storybook/react-vite';
import { join, dirname } from "path";

/**
* This function is used to resolve the absolute path of a package.
* It is needed in projects that use Yarn PnP or are set up within a monorepo.
*/
function getAbsolutePath(value: string): string {
  return dirname(require.resolve(join(value, 'package.json')));
}

const config: StorybookConfig = {
  "stories": [
    // Only include versioned directories (v*) to avoid duplicates from symlinks
    "../src/components/**/v*/*.stories.@(js|jsx|ts|tsx|mdx)",
    "../src/components/**/v*/*.docs.mdx",
    
    // Also include non-versioned components (Card, etc.)
    "../src/components/molecules/Card/*.stories.@(js|jsx|ts|tsx|mdx)"
  ],
  "addons": [
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('msw-storybook-addon')
  ],
  "framework": {
    "name": getAbsolutePath('@storybook/react-vite'),
    "options": {}
  },
  async viteFinal(config) {
    // Add path aliases for design-system imports
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': '../src',
      '@/components': '../src/components',
      '@/utils': '../src/utils',
      '@/styles': '../src/styles',
    };
    return config;
  },
  "core": {
    "disableTelemetry": true // Disable telemetry for cleaner output
  }
};
export default config;