import nextra from 'nextra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const withNextra = nextra({});

export default withNextra({
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '../'),
  async headers() {
    return [
      {
        // Apply to ALL routes - required for cross-origin isolation
        // These headers must be on every resource (HTML, JS, CSS, etc)
        source: '/:path*',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
});
