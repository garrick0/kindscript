/**
 * Node.js built-in modules that indicate impure imports.
 *
 * Includes bare names, `node:` prefixed variants, and `/promises` subpaths.
 * Used by purity checking.
 */
const BARE_BUILTINS = [
  'fs', 'path', 'http', 'https', 'net', 'child_process', 'crypto', 'os',
  'process', 'stream', 'url', 'util', 'zlib', 'dns', 'tls', 'dgram',
  'cluster', 'readline', 'repl', 'vm', 'worker_threads', 'perf_hooks',
  'async_hooks', 'inspector', 'trace_events', 'v8', 'assert',
];

const SUBPATH_BUILTINS = [
  'fs/promises', 'stream/promises', 'dns/promises', 'readline/promises',
];

export const NODE_BUILTINS = new Set([
  ...BARE_BUILTINS,
  ...BARE_BUILTINS.map(m => `node:${m}`),
  ...SUBPATH_BUILTINS,
  ...SUBPATH_BUILTINS.map(m => `node:${m}`),
]);
