/**
 * Type-safe subset of TypeScript compiler options.
 *
 * This is a domain abstraction - we don't depend on TypeScript's
 * actual CompilerOptions type to keep the domain layer pure.
 */
export interface CompilerOptions {
  rootDir?: string;
  outDir?: string;
  strict?: boolean;
  target?: string;
  module?: string;
  moduleResolution?: string;
  esModuleInterop?: boolean;
  skipLibCheck?: boolean;
  declaration?: boolean;
  composite?: boolean;
  baseUrl?: string;
  paths?: Record<string, string[]>;
}
