import nextra from 'nextra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const withNextra = nextra({
  // Configure Nextra to work with App Router
  defaultShowCopyCode: true,
});

export default withNextra({
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '../'),
  // Use Turbopack for faster dev mode
  experimental: {
    turbo: {},
  },
  async headers() {
    return [
      {
        // Apply to /tutorial routes - required for WebContainer
        source: '/tutorial/:path*',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      {
        // Apply to /sandbox route - required for WebContainer
        source: '/sandbox',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
});
