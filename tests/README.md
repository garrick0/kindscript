# Test Suite Documentation

## Overview

This directory contains the complete test suite for KindScript, organized into three layers following the testing pyramid:

- **Unit Tests** (`tests/unit/`) - Fast, isolated tests for individual components
- **Integration Tests** (`tests/integration/`) - Tests combining multiple components with real I/O
- **E2E Tests** (`tests/e2e/`) - End-to-end tests via CLI subprocess invocation

**Current Stats:** 33 test files, 392 tests, 100% passing (as of Phase 2C completion, 2026-02-07)

---

## Directory Structure

```
tests/
├── helpers/                      # 4 files - Shared test utilities
│   ├── factories.ts             # Test data builders (symbols, contracts, etc.)
│   ├── fixtures.ts              # Fixture path constants
│   ├── test-pipeline.ts         # Integration test pipeline helper
│   └── (E2E helpers in tests/e2e/helpers.ts)
│
├── unit/                         # 28 files - Component tests
│   ├── Domain entities/         # ArchSymbol, Contract, Diagnostic, etc.
│   ├── Services/                # All use case services
│   │   ├── classify-ast-kind-parsing.test.ts      # Kind definition parsing
│   │   ├── classify-ast-contracts.test.ts         # Contract parsing & validation
│   │   ├── classify-ast-locate.test.ts            # locate<T>() recognition
│   │   ├── check-contracts-dependency.test.ts     # noDependency + noCycles
│   │   ├── check-contracts-implementation.test.ts # mustImplement + colocated
│   │   ├── check-contracts-purity.test.ts         # purity + existence + general
│   │   └── ... (other services)
│   ├── Adapters/                # Infrastructure adapters
│   └── Value objects/           # value-objects.test.ts (consolidated)
│
├── integration/                  # 4 files - Multi-component tests
│   ├── check-contracts.integration.test.ts
│   ├── tier2-contracts.integration.test.ts
│   ├── tier2-locate.integration.test.ts
│   ├── infer-and-detect.integration.test.ts
│   └── fixtures/                # 26 fixture directories
│       └── README.md            # Complete fixture catalog
│
└── e2e/                          # 1 file - CLI tests (consolidated)
    ├── helpers.ts               # E2E test utilities (run, copyFixtureToTemp)
    └── cli.e2e.test.ts          # All CLI commands organized by command
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- check-contracts.service.test

# Run tests in watch mode
npm test -- --watch

# Run only unit tests
npm test -- tests/unit

# Run only integration tests
npm test -- tests/integration

# Run only E2E tests
npm test -- tests/e2e
```

---

## Test Layers

### Unit Tests (`tests/unit/`)

**Purpose:** Test individual components in isolation using mocks

**Characteristics:**
- Fast execution (<100ms per file)
- No file I/O
- Mocked dependencies
- Focus on business logic

**When to add:** New domain entities, services, or adapters

**Example:**
```typescript
// tests/unit/arch-symbol.test.ts
describe('ArchSymbol', () => {
  it('creates a symbol with members', () => {
    const symbol = new ArchSymbol('domain', ArchSymbolKind.Member);
    expect(symbol.name).toBe('domain');
  });
});
```

---

### Integration Tests (`tests/integration/`)

**Purpose:** Test multiple components working together with real dependencies

**Characteristics:**
- Moderate execution time (~500ms-2s per file)
- Real TypeScript compiler
- Real file system access
- Uses test fixtures

**When to add:** New workflows combining services, contract types, or pipelines

**Example:**
```typescript
// tests/integration/check-contracts.integration.test.ts
it('detects violation in fixture', () => {
  const fixturePath = FIXTURES.CLEAN_ARCH_VIOLATION;
  const result = checkService.execute({...});
  expect(result.violationsFound).toBeGreaterThan(0);
});
```

---

### E2E Tests (`tests/e2e/`)

**Purpose:** Test complete CLI workflows as users would invoke them

**Characteristics:**
- Slow execution (~3-5s per file)
- Spawns CLI subprocess
- Tests exit codes and output
- Modifies temp directories

**When to add:** New CLI commands or command flags (add to cli.e2e.test.ts)

**Example:**
```typescript
// tests/e2e/cli.e2e.test.ts
import { run, FIXTURES_DIR } from './helpers';

describe('CLI E2E', () => {
  describe('ksc check', () => {
    it('exits 1 when violations found', () => {
      const result = run(['check', path.join(FIXTURES_DIR, 'clean-arch-violation')]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('KS70001');
    });
  });
});
```

**Note:** All E2E tests are consolidated into a single `cli.e2e.test.ts` file, organized by command (check, infer).

---

## Shared Utilities

### Test Helpers (`tests/helpers/`)

**factories.ts** - Builders for common test objects:
```typescript
import { makeSymbol, noDependency, makeDiagnostic } from '../helpers/factories';

const domain = makeSymbol('domain');
const contract = noDependency(domain, infrastructure);
const diagnostic = makeDiagnostic({ code: 70001 });
```

**fixtures.ts** - Fixture path constants:
```typescript
import { FIXTURES, FIXTURE_NAMES } from '../helpers/fixtures';

const fixturePath = FIXTURES.CLEAN_ARCH_VIOLATION;
const cleanFixture = FIXTURE_NAMES.CLEAN_ARCH_VALID;
```

### E2E Helpers (`tests/e2e/helpers.ts`)

Utilities for CLI testing:
```typescript
import { run, copyFixtureToTemp, CLI_PATH, FIXTURES_DIR } from './helpers';

// Run CLI command
const result = run(['check', '/path/to/project']);
// Returns: { stdout: string, stderr: string, exitCode: number }

// Copy fixture to temp directory for --write tests
const tmpDir = copyFixtureToTemp('clean-arch-valid');
// Remember to clean up: fs.rmSync(tmpDir, { recursive: true });
```

### Integration Test Pipeline (`tests/helpers/test-pipeline.ts`)

Helper for integration tests:
```typescript
import { runPipeline, createTestPipeline, classifyFixture } from '../helpers/test-pipeline';
import { FIXTURES } from '../helpers/fixtures';

// Simple: classify + check in one call
const { classifyResult, checkResult } = runPipeline(FIXTURES.TIER2_CLEAN_ARCH);

// Advanced: create pipeline and reuse
const pipeline = createTestPipeline();
const classifyResult = classifyFixture(pipeline, FIXTURES.TIER2_CLEAN_ARCH);
```

---

## Test Fixtures

Test fixtures are located in `tests/integration/fixtures/`. See [fixtures/README.md](integration/fixtures/README.md) for a complete catalog.

**Fixture Naming Convention:**
- `*-clean` - Satisfies all contracts
- `*-violation` - Violates contracts
- `detect-*` - For architecture detection
- `tier2-*` - Kind-based definitions
- `locate-*` - Uses locate<T>() pattern
- `stdlib-*` - Uses @kindscript packages

---

## Writing New Tests

### 1. Determine Test Layer

| Question | Answer → Layer |
|----------|----------------|
| Does it test a single class/function? | Unit |
| Does it test multiple services together? | Integration |
| Does it test the CLI as a subprocess? | E2E |

### 2. Choose Appropriate Mocking Level

| Layer | TypeScript | FileSystem | CLI |
|-------|-----------|-----------|-----|
| Unit | Mock | Mock | N/A |
| Integration | Real | Real | N/A |
| E2E | Real | Real | Real subprocess |

### 3. Use Shared Utilities

✅ **Do:**
- Import from `tests/helpers/factories.ts`
- Use `FIXTURES` constants for fixture paths
- Reuse `run()` for E2E CLI invocation
- Follow existing test patterns

❌ **Don't:**
- Redefine test builders inline
- Hard-code fixture paths
- Create custom CLI runners
- Mix testing layers (e.g., real FS in unit tests)

---

## Coverage Requirements

```javascript
// jest.config.js
coverageThreshold: {
  'src/domain/': {
    branches: 75,
    functions: 90,
    lines: 90,
    statements: 90
  },
  'src/application/': {
    branches: 85,
    functions: 100,
    lines: 95,
    statements: 95
  }
}
```

Infrastructure adapters are covered via integration/E2E tests without strict thresholds.

---

## Common Patterns

### Testing Contracts

```typescript
// Unit test - mock everything
it('validates noDependency contract', () => {
  const contract = noDependency(domain, infrastructure);
  expect(contract.validate()).toBeNull();
});

// Integration test - real pipeline
it('detects noDependency violation', () => {
  const result = runPipeline(FIXTURES.CLEAN_ARCH_VIOLATION);
  expect(result.diagnostics[0].code).toBe(70001);
});

// E2E test - subprocess
it('exits 1 on violation', () => {
  const result = run(['check', FIXTURES.CLEAN_ARCH_VIOLATION]);
  expect(result.exitCode).toBe(1);
});
```

### Testing File Operations

```typescript
// Integration test
it('reads real files', () => {
  const files = fsAdapter.readDirectory(FIXTURES.CLEAN_ARCH_VALID, true);
  expect(files.length).toBeGreaterThan(0);
});

// E2E test with temp directory
it('writes files', () => {
  const tmpDir = copyFixtureToTemp('detect-clean-arch');
  const result = run(['infer', '--write', tmpDir]);
  expect(fs.existsSync(path.join(tmpDir, 'architecture.ts'))).toBe(true);
  fs.rmSync(tmpDir, { recursive: true });
});
```

---

## Debugging Tests

### Run Single Test

```bash
npm test -- -t "creates a symbol with members"
```

### Enable Verbose Output

```bash
npm test -- --verbose
```

### Debug in VS Code

Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Current File",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["${fileBasename}", "--runInBand"],
  "console": "integratedTerminal"
}
```

---

## Maintenance

### Adding a New Contract Type

1. **Domain layer** - Add contract type to `src/domain/types/contract-type.ts`
2. **Domain layer** - Add diagnostic code to `src/domain/constants/diagnostic-codes.ts`
3. **Application layer** - Implement validation in `src/application/use-cases/check-contracts/`
4. **Unit tests** - Add tests in appropriate `tests/unit/check-contracts-*.test.ts` file
5. **Integration tests** - Add tests in `tests/integration/tier2-contracts.integration.test.ts`
6. **Fixtures** - Create clean + violation fixtures in `tests/integration/fixtures/`
7. **E2E tests** - Add tests in `tests/e2e/cli.e2e.test.ts` under `describe('ksc check')`
8. **Helpers** - Add factory function in `tests/helpers/factories.ts`
9. **Documentation** - Update README.md and fixture catalog

### Adding a New CLI Command

1. **Command implementation** - Add command class in `src/infrastructure/cli/commands/`
2. **Unit tests** - Add tests for command class in `tests/unit/`
3. **E2E tests** - Add new `describe('ksc <command>')` block in `tests/e2e/cli.e2e.test.ts`
4. **Documentation** - Update README.md with command description

### File Size Guidelines

**Keep test files manageable:**
- No single test file should exceed 600 lines
- If a file grows too large, split it logically by feature or contract type
- Follow the pattern used in classify-ast and check-contracts splits

---

## Recent Improvements (Phase 2C - 2026-02-07)

**Major file splits completed:**
- Split `classify-ast.service.test.ts` (1,034 lines) → 3 focused files
- Split `check-contracts.service.test.ts` (686 lines) → 3 focused files
- Consolidated all E2E tests into single `cli.e2e.test.ts` file
- Largest file reduced from 1,034 to 570 lines (-45%)
- All 392 tests passing, 100% pass rate maintained

**Benefits:**
- Much easier navigation - tests grouped by feature/contract type
- Faster test execution - can run specific test groups independently
- No massive files - all files under 600 lines
- Clear organization - each file has a single, focused purpose

**See:** [TEST_CONSOLIDATION_PHASE2_SUMMARY.md](../docs/archive/test-consolidation/TEST_CONSOLIDATION_PHASE2_SUMMARY.md) for complete details

---

## Historical Context

See consolidation history in `docs/archive/test-consolidation/`:
- [TEST_AUDIT.md](../docs/archive/test-consolidation/TEST_AUDIT.md) - Initial audit (45 files)
- [TEST_CONSOLIDATION_SUMMARY.md](../docs/archive/test-consolidation/TEST_CONSOLIDATION_SUMMARY.md) - Phase 1 (45→34 files)
- [TEST_IMPROVEMENT_PLAN_V2.md](../docs/archive/test-consolidation/TEST_IMPROVEMENT_PLAN_V2.md) - Phase 2 planning
- [TEST_CONSOLIDATION_PHASE2_SUMMARY.md](../docs/archive/test-consolidation/TEST_CONSOLIDATION_PHASE2_SUMMARY.md) - Phase 2 implementation (34→33 files, major splits)
