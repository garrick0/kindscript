import { CheckContext } from '../../src/application/pipeline/plugins/contract-plugin';
import { MockTypeScriptAdapter } from './mocks/mock-typescript.adapter';
import { Program } from '../../src/domain/entities/program';
import { beforeEach, afterEach } from 'vitest';

/**
 * Creates a CheckContext for plugin testing with the provided MockTypeScriptAdapter.
 *
 * @param mockTS - The mock TypeScript adapter to use
 * @returns CheckContext with program and checker
 */
export function createPluginTestContext(mockTS: MockTypeScriptAdapter): CheckContext {
  const program = new Program([], {});
  return {
    tsPort: mockTS,
    program,
    checker: mockTS.getTypeChecker(program),
  };
}

/**
 * Sets up a plugin test environment with automatic mock lifecycle management.
 *
 * Call this at the top of your describe block for plugin tests.
 *
 * @returns Object with getMock() and makeContext() helpers
 *
 * @example
 * ```typescript
 * describe('myPlugin.check', () => {
 *   const { getMock, makeContext } = setupPluginTestEnv();
 *
 *   it('detects violation', () => {
 *     const mockTS = getMock();
 *     mockTS.withSourceFile('path.ts', 'content');
 *
 *     const result = myPlugin.check(contract, makeContext());
 *     expect(result.diagnostics).toHaveLength(1);
 *   });
 * });
 * ```
 */
export function setupPluginTestEnv() {
  let mockTS: MockTypeScriptAdapter;

  beforeEach(() => {
    mockTS = new MockTypeScriptAdapter();
  });

  afterEach(() => {
    mockTS.reset();
  });

  return {
    /**
     * Get the current MockTypeScriptAdapter instance.
     * Use this to configure the mock (withSourceFile, withImport, etc.).
     */
    getMock: () => mockTS,

    /**
     * Create a CheckContext using the current mock.
     * Pass this to plugin.check() calls.
     */
    makeContext: () => createPluginTestContext(mockTS),
  };
}
