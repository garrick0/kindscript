# Test Suite Documentation

## Overview

This directory contains the complete test suite for KindScript, organized to mirror the source directory structure:

- **Domain Tests** (`tests/domain/`) - Pure domain entity tests
- **Application Tests** (`tests/application/`) - Pipeline stage and contract plugin tests
- **Infrastructure Tests** (`tests/infrastructure/`) - Shared adapter tests
- **CLI Tests** (`tests/cli/`) - CLI command tests (unit + E2E)
- **Plugin Tests** (`tests/plugin/`) - Plugin service tests
- **Integration Tests** (`tests/integration/`) - Multi-component tests with real I/O
- **Helpers** (`tests/helpers/`) - Shared utilities, factories, mocks

**Current Stats:** 33 test files, 381 tests, 100% passing
**Test Runner:** Vitest v2.1.0 (migrated from Jest)

---

## Directory Structure

```
tests/
├── helpers/                         # Shared test utilities
│   ├── factories.ts                 # Test data builders (symbols, contracts, etc.)
│   ├── fixtures.ts                  # Fixture path constants
│   ├── test-pipeline.ts             # Integration test pipeline helper
│   └── mocks/                       # 3 mock adapters
│       ├── mock-typescript.adapter.ts
│       ├── mock-filesystem.adapter.ts
│       └── mock-ast.adapter.ts
│
├── domain/                          # 5 files - Domain entity tests
│   ├── arch-symbol.test.ts
│   ├── contract.test.ts
│   ├── diagnostic.test.ts
│   ├── domain-coverage.test.ts
│   └── source-ref.test.ts
│
├── application/                     # 12 files - Application layer tests
│   ├── classify-ast-kind-parsing.test.ts
│   ├── classify-ast-contracts.test.ts
│   ├── classify-ast-locate.test.ts
│   ├── classify-project.service.test.ts
│   ├── check-contracts-service.test.ts
│   ├── no-dependency.plugin.test.ts
│   ├── no-cycles.plugin.test.ts
│   ├── purity.plugin.test.ts
│   ├── scope.plugin.test.ts
│   ├── overlap.plugin.test.ts
│   ├── exhaustiveness.plugin.test.ts
│   └── ownership-tree.test.ts
│
├── infrastructure/                  # 3 files - Shared adapter tests
│   ├── ast.adapter.test.ts
│   ├── config-adapter.test.ts
│   └── path-utils.test.ts
│
├── cli/
│   ├── unit/                        # 2 files - CLI command tests
│   │   ├── check-command.test.ts
│   │   └── cli-diagnostic.adapter.test.ts
│   └── e2e/                         # 2 files - CLI subprocess tests
│       ├── helpers.ts
│       └── cli.e2e.test.ts
│
├── plugin/
│   └── unit/                        # 5 files - Plugin service tests
│       ├── get-plugin-diagnostics.service.test.ts
│       ├── get-plugin-code-fixes.service.test.ts
│       ├── plugin-loading.test.ts
│       ├── diagnostic-converter.test.ts
│       └── language-service-proxy.test.ts
│
└── integration/                     # 3 test files + 24 fixture dirs
    ├── check-contracts.integration.test.ts
    ├── tier2-contracts.integration.test.ts
    ├── tier2-locate.integration.test.ts
    └── fixtures/                    # See fixtures/README.md
```

---

## Running Tests

KindScript uses [Vitest](https://vitest.dev/) as its test runner.

```bash
# Run all tests (381 tests)
npm test

# Run with coverage report
npm run test:coverage

# Interactive UI mode (recommended for development)
npm run test:ui

# Watch mode (re-runs tests on file changes)
npm run test:watch

# Run specific test file (by name substring)
npm test -- check-contracts-service

# Run tests by layer
npm test -- tests/domain
npm test -- tests/application
npm test -- tests/infrastructure
npm test -- tests/cli
npm test -- tests/plugin
npm test -- tests/integration
```

---

## Test Framework

**Vitest** - Fast, ESM-native test runner with Jest-compatible API.

**Why Vitest:**
- ⚡ 20-40% faster than Jest
- 🎯 Native ESM support
- 🔄 Jest-compatible API (describe, it, expect, etc.)
- 🎨 Interactive UI mode for debugging
- 📊 Fast, accurate V8 coverage

**Mocking:** Use `vi.fn()` and `vi.spyOn()` (Vitest's Jest-compatible mocking API).

**Configuration:** See `vitest.config.ts` for coverage thresholds and test environment settings.

---

## Testing Philosophy

### Why Tests Mirror Architecture

KindScript's test structure mirrors the source architecture (`domain/`, `application/`, `infrastructure/`, `apps/`) for several reasons:

1. **Discoverability** - Easy to find tests for a specific source file
2. **Architectural validation** - Test organization itself validates layer separation
3. **Mental model alignment** - Same mental map for source and tests
4. **Refactoring support** - When moving files, tests move in parallel

**Example:**
```
src/application/pipeline/scan/scan.service.ts
tests/application/scan.service.test.ts  (mirrors structure)
```

---

### Behavior vs Implementation Testing

**✅ Good: Test Behavior (Outcomes)**
```typescript
it('detects forbidden dependency', () => {
  const result = plugin.check(contract, context);
  expect(result.diagnostics).toHaveLength(1);
  expect(result.diagnostics[0].code).toBe(70001);
});
```

**❌ Bad: Test Implementation (Internals)**
```typescript
it('calls private resolveSymbol method', () => {
  const spy = vi.spyOn(service as any, 'resolveSymbol');
  service.check(contract);
  expect(spy).toHaveBeenCalled();  // Brittle!
});
```

**Why behavior testing matters:**
- Survives refactoring (internal changes don't break tests)
- Documents what the code *does*, not how
- Focuses on contract, not implementation details

---

### When to Use Factories vs Hardcoded Values

**✅ Use Factories** (from `tests/helpers/factories.ts`):
```typescript
const domain = makeSymbol('domain');
const contract = noDependency(domain, infrastructure);
```

**Benefits:**
- Centralized defaults (change once, apply everywhere)
- Survives constructor changes
- Less brittle, less maintenance

**❌ Don't Hardcode**:
```typescript
const symbol = new ArchSymbol(
  'domain',
  'Kind',
  { type: 'path', value: './domain' },
  undefined,
  undefined
);  // Breaks when constructor signature changes!
```

**When to hardcode:**
- Testing edge cases that factories don't support
- When the specific value IS the test (e.g., testing validation)

---

### Writing Tests That Survive Refactoring

**Good practices:**
1. **Use factories** - `makeSymbol()`, `noDependency()`, etc.
2. **Test outcomes, not internals** - Check diagnostics, not private methods
3. **Use targeted assertions** - Assert what matters, not everything
4. **Import from public API when possible** - Not internal modules

**Example of refactoring-resistant test:**
```typescript
it('detects forbidden dependency', () => {
  // Setup using factories
  const domain = makeSymbol('domain');
  const infra = makeSymbol('infrastructure');

  mockTS
    .withSourceFile('src/domain/service.ts', '')
    .withImport('src/domain/service.ts', 'src/infrastructure/db.ts', '../infrastructure/db', 1);

  domain.files = ['src/domain/service.ts'];
  infra.files = ['src/infrastructure/db.ts'];

  // Test behavior, not implementation
  const result = noDependencyPlugin.check(noDependency(domain, infra), makeContext());

  // Targeted assertions
  expect(result.diagnostics).toHaveLength(1);
  expect(result.diagnostics[0].code).toBe(70001);
  // Don't assert on every property of the diagnostic!
});
```

---

### Integration vs E2E: When to Use Which

**Integration Tests** (`tests/integration/`):
- Test multiple services together
- Use real TypeScript compiler
- Use fixture projects
- Fast (< 500ms per test)
- **Use when:** Testing pipeline workflows, contract checking

**E2E Tests** (`tests/cli/e2e/`):
- Test CLI as subprocess
- Full environment simulation
- Slower (1-3 seconds per test)
- **Use when:** Testing CLI commands, exit codes, stdout/stderr

**Example decision:**
- Testing noDependency plugin logic → **Unit test** (`tests/application/no-dependency.plugin.test.ts`)
- Testing full pipeline with fixtures → **Integration test** (`tests/integration/check-contracts.integration.test.ts`)
- Testing `ksc check` command → **E2E test** (`tests/cli/e2e/cli.e2e.test.ts`)

---

## Where to Put New Tests

| What are you testing? | Where |
|-----------------------|-------|
| Domain entity / value object | `tests/domain/` |
| Pipeline stage service (scan, parse, bind, pipeline) | `tests/application/` |
| Contract plugin (checker) | `tests/application/` |
| Shared infrastructure adapter | `tests/infrastructure/` |
| CLI command or CLI adapter | `tests/cli/unit/` |
| Plugin service or plugin adapter | `tests/plugin/unit/` |
| Multiple services with real TS compiler | `tests/integration/` |
| CLI as subprocess | `tests/cli/e2e/cli.e2e.test.ts` |

---

## Shared Utilities

### Test Helpers (`tests/helpers/`)

**factories.ts** - Builders for common test objects:
```typescript
import { makeSymbol, noDependency } from '../helpers/factories';
// or from deeper: import { makeSymbol } from '../../helpers/factories';

const domain = makeSymbol('domain');
const contract = noDependency(domain, infrastructure);
```

**fixtures.ts** - Fixture path constants:
```typescript
import { FIXTURES } from '../helpers/fixtures';

const fixturePath = FIXTURES.CLEAN_ARCH_VIOLATION;
```

**mocks/** - Mock adapters for unit tests:
```typescript
import { MockTypeScriptAdapter } from '../helpers/mocks/mock-typescript.adapter';
import { MockASTAdapter } from '../helpers/mocks/mock-ast.adapter';
```

### Integration Test Pipeline (`tests/helpers/test-pipeline.ts`)

```typescript
import { runPipeline } from '../helpers/test-pipeline';
import { FIXTURES } from '../helpers/fixtures';

const { classifyResult, checkResult } = runPipeline(FIXTURES.TIER2_CLEAN_ARCH);
```

### E2E Helpers (`tests/cli/e2e/helpers.ts`)

```typescript
import { run } from './helpers';

const result = run(['check', '/path/to/project']);
// Returns: { stdout, stderr, exitCode }
```

---

## Adding New Constraint Types

1. **Domain layer** - Add contract type to `src/domain/types/contract-type.ts`
2. **Domain layer** - Add diagnostic code to `src/domain/constants/diagnostic-codes.ts`
3. **Application layer** - Create plugin in `src/application/pipeline/plugins/<name>/<name>.plugin.ts`
4. **Application layer** - Register plugin in `src/application/pipeline/plugins/plugin-registry.ts` (`createAllPlugins()`)
5. **Tests** - Add unit tests in `tests/application/<name>.plugin.test.ts`
6. **Tests** - Add integration tests in `tests/integration/tier2-contracts.integration.test.ts`
7. **Fixtures** - Create clean + violation fixtures in `tests/integration/fixtures/`
8. **Tests** - Add E2E tests in `tests/cli/e2e/cli.e2e.test.ts`
9. **Helpers** - Add factory function in `tests/helpers/factories.ts`
10. **Documentation** - Update fixture catalog

---

## Coverage Requirements

```javascript
coverageThreshold: {
  'src/domain/': { branches: 75, functions: 90, lines: 90, statements: 90 },
  'src/application/': { branches: 85, functions: 100, lines: 95, statements: 95 }
}
```

Infrastructure adapters are covered via integration/E2E tests without strict thresholds.

---

## File Size Guidelines

- No single test file should exceed 600 lines
- If a file grows too large, split it logically by feature or contract type
- Follow the pattern used in classify-ast splits (3 files by concern)

---

## Troubleshooting

### Tests Failing After Refactoring

**Problem:** Tests break when you rename/move files or refactor internals

**Common causes:**
1. Tests import from internal modules that moved
2. Tests check private method calls
3. Tests use hardcoded values instead of factories

**Solutions:**
- Use factories (`makeSymbol()`) instead of constructors
- Test behavior (outcomes) not implementation (internals)
- Import from public API when possible

**Example fix:**
```typescript
// Before (brittle)
import { BindService } from '../../src/application/pipeline/bind/bind.service';
const symbol = new ArchSymbol('domain', 'Kind', { type: 'path', value: './domain' });

// After (refactoring-resistant)
import { makeSymbol } from '../helpers/factories';
const symbol = makeSymbol('domain');
```

---

### Coverage Decreases

**Problem:** Coverage drops after changes

**Check:**
1. Run `npm run test:coverage` to see what's uncovered
2. Look for new files without tests
3. Check if test was accidentally removed

**Solution:**
- Add tests for new files
- Restore accidentally removed tests
- Or update coverage thresholds if intentional

---

### Slow Test Execution

**Problem:** Tests take too long to run

**Identify slow tests:**
```bash
npm test -- --reporter=verbose
# Look for tests taking > 1 second
```

**Common causes:**
1. Too many E2E tests (should be < 10% of suite)
2. Integration tests not using fixtures efficiently
3. Setup/teardown doing too much work

**Solutions:**
- Move slow tests to integration/E2E (fewer of them)
- Use shared fixtures instead of creating new ones
- Mock expensive operations in unit tests

---

### Flaky Tests

**Problem:** Tests pass/fail randomly

**Common causes:**
1. Tests depend on execution order
2. Tests share state (global variables, singletons)
3. Async timing issues

**Solutions:**
- Ensure each test is isolated (use `beforeEach` to reset state)
- Don't rely on test execution order
- Use `await` for all async operations
- Check that mocks are reset in `afterEach`

**Example:**
```typescript
let mockTS: MockTypeScriptAdapter;

beforeEach(() => {
  mockTS = new MockTypeScriptAdapter();  // Fresh mock each test
});

afterEach(() => {
  mockTS.reset();  // Clean up
});
```

---

### Vitest-Specific Issues

**Problem:** Migration from Jest causing issues

**Common gotchas:**
- Use `vi.fn()` instead of `jest.fn()`
- Use `vi.spyOn()` instead of `jest.spyOn()`
- Vitest globals must be enabled in `vitest.config.ts`

**Check config:**
```typescript
// vitest.config.ts
test: {
  globals: true,  // Enables describe, it, expect
}
```

---

### Fixture Not Found

**Problem:** Integration/E2E tests can't find fixtures

**Check:**
1. Fixture path is in `tests/helpers/fixtures.ts`
2. Fixture directory exists in `tests/integration/fixtures/`
3. Using correct constant name

**Example:**
```typescript
import { FIXTURES } from '../helpers/fixtures';

const result = runPipeline(FIXTURES.CLEAN_ARCH_VIOLATION);  // Use constant
// NOT: runPipeline('/some/hardcoded/path')
```

---

### Mock Not Working

**Problem:** Mock adapter not capturing data

**Check:**
1. Mock is created in `beforeEach`
2. Mock is reset in `afterEach`
3. Using correct mock methods

**Example:**
```typescript
beforeEach(() => {
  mockTS = new MockTypeScriptAdapter();
});

it('test', () => {
  mockTS.withSourceFile('path.ts', 'content');  // Setup
  mockTS.withImport('from.ts', 'to.ts', '../to', 1);  // Setup

  const result = service.check(contract, makeContext());
  // ...assertions
});

afterEach(() => {
  mockTS.reset();  // Important!
});
```
