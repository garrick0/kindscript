import nextra from 'nextra';

const withNextra = nextra({});

export default withNextra({
  output: 'standalone',
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/tutorial/:path*',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
});
