# M8 Implementation Plan: Standard Library Packages

## Context

M7 delivered Generator/Scaffolding (410 tests, version 0.7.0-m7). M8 adds standard library packages — pre-built Kind definitions and contracts for common architectural patterns (Clean Architecture, Hexagonal, Onion) that users can install and use immediately. This eliminates the need to author Kind definitions from scratch.

Implements V4 Part 7 (Standard Library Distribution) and BUILD_PLAN Milestone 8.

**Distribution model:** Follows Zod/TypeBox hybrid — type definitions (.d.ts) + runtime contract values (.js). Packages are npm packages with `kindscript` as a peer dependency. Each package is self-contained with its own Kind<N> and defineContracts stubs (matching fixture convention), making them independently compilable and testable.

---

## Key Challenge: Cross-File Classification

The classifier (ClassifyAST) processes definition files to find:
1. **Phase 1:** Kind definitions (interfaces extending `Kind<N>`)
2. **Phase 2:** Instance declarations (variables typed as Kind types)
3. **Phase 3:** Contract descriptors (`defineContracts<T>(...)` calls)

When users import definitions from standard library packages, the Kind definitions and contracts live in the **package** file while instances live in the **user's** `architecture.ts`. The classifier already supports multi-file processing, but has a Phase ordering issue: all three phases currently run sequentially per-file. If the package file (containing contracts) is processed before the user file (containing instances), Phase 3 can't bind contracts to instances because Phase 2 hasn't populated `instanceSymbols` for the user file yet.

**Fix:** Split classification into two passes — Phase 1+2 across all files first, then Phase 3 across all files. This ensures all instances are found before any contracts are bound.

---

## Design Decisions

### Self-contained package files

Package definition files inline the `Kind<N>` interface and `defineContracts` function stub (matching existing fixture convention). This avoids import resolution complexity — the files compile independently without requiring `kindscript` to be resolvable. When published as npm packages, these inlined types are structurally identical to the ones in `kindscript`, so TypeScript's structural typing ensures compatibility.

### `packages` field in kindscript.json

Rather than auto-detecting installed packages (fragile), users explicitly declare which standard library packages they use:

```json
{
  "definitions": ["architecture.ts"],
  "packages": ["@kindscript/clean-architecture"]
}
```

The CLI resolves each package name to its definition file (`node_modules/@kindscript/<name>/index.ts`) and includes it as an additional definition file for the classifier.

### Additive contracts

Package contracts and user contracts are additive. If the user wants the package's default contracts, they get them by including the package. If they want additional contracts, they define their own `defineContracts` call. If they want fewer contracts, they don't use the package's contracts and define their own from scratch.

### User consumption pattern

```typescript
// architecture.ts
import { CleanContext } from '@kindscript/clean-architecture';

export const ordering: CleanContext = {
  kind: "CleanContext",
  location: "src",
  domain: {
    kind: "DomainLayer",
    location: "src/domain",
    entities: "entities",
    ports: "ports",
  },
  application: {
    kind: "ApplicationLayer",
    location: "src/application",
    useCases: "use-cases",
  },
  infrastructure: {
    kind: "InfrastructureLayer",
    location: "src/infrastructure",
    adapters: "adapters",
  },
};
```

The user only declares instances — no interface definitions, no contracts. Both come from the package.

---

## Step 1: Package — `@kindscript/clean-architecture`

**Directory:** `packages/clean-architecture/`

### `packages/clean-architecture/index.ts`

```typescript
/**
 * @kindscript/clean-architecture
 *
 * Pre-built Kind definitions and contracts for the Clean Architecture pattern.
 *
 * Clean Architecture organizes code into three concentric layers:
 *   - Domain: Pure business logic with no external dependencies
 *   - Application: Use cases orchestrating domain objects
 *   - Infrastructure: Adapters connecting to external systems
 *
 * @see https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
 */

interface Kind<N extends string = string> {
  readonly kind: N;
  readonly location: string;
}

interface ContractConfig {
  noDependency?: [string, string][];
  mustImplement?: [string, string][];
  purity?: string[];
  noCycles?: string[];
  colocated?: [string, string][];
}
function defineContracts<_T = unknown>(config: ContractConfig): ContractConfig {
  return config;
}

/** A bounded context following Clean Architecture principles. */
export interface CleanContext extends Kind<"CleanContext"> {
  /** Pure business logic with no external dependencies. */
  domain: DomainLayer;
  /** Use cases orchestrating domain objects. */
  application: ApplicationLayer;
  /** Adapters connecting to external systems. */
  infrastructure: InfrastructureLayer;
}

/** Domain layer — pure business logic, no I/O. */
export interface DomainLayer extends Kind<"DomainLayer"> {}

/** Application layer — use case orchestration. */
export interface ApplicationLayer extends Kind<"ApplicationLayer"> {}

/** Infrastructure layer — external system adapters. */
export interface InfrastructureLayer extends Kind<"InfrastructureLayer"> {}

/** Pre-configured contracts enforcing Clean Architecture dependency rules. */
export const cleanArchitectureContracts = defineContracts<CleanContext>({
  noDependency: [
    ["domain", "infrastructure"],
    ["domain", "application"],
    ["application", "infrastructure"],
  ],
  purity: ["domain"],
});
```

### `packages/clean-architecture/package.json`

```json
{
  "name": "@kindscript/clean-architecture",
  "version": "0.1.0",
  "description": "Clean Architecture pattern definitions for KindScript",
  "main": "index.js",
  "types": "index.d.ts",
  "files": ["index.js", "index.d.ts"],
  "keywords": ["kindscript", "architecture", "clean-architecture"],
  "peerDependencies": {
    "kindscript": "^0.8.0"
  }
}
```

### `packages/clean-architecture/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "."
  },
  "include": ["index.ts"]
}
```

---

## Step 2: Package — `@kindscript/hexagonal`

**Directory:** `packages/hexagonal/`

### `packages/hexagonal/index.ts`

```typescript
/**
 * @kindscript/hexagonal
 *
 * Pre-built Kind definitions and contracts for the Hexagonal Architecture pattern
 * (Ports & Adapters).
 *
 * Hexagonal Architecture organizes code into:
 *   - Domain: Core business logic
 *   - Ports: Interfaces defining how the domain communicates with the outside
 *   - Adapters: Implementations of ports for specific technologies
 *
 * @see https://alistair.cockburn.us/hexagonal-architecture/
 */

interface Kind<N extends string = string> {
  readonly kind: N;
  readonly location: string;
}

interface ContractConfig {
  noDependency?: [string, string][];
  mustImplement?: [string, string][];
  purity?: string[];
  noCycles?: string[];
  colocated?: [string, string][];
}
function defineContracts<_T = unknown>(config: ContractConfig): ContractConfig {
  return config;
}

/** A bounded context following Hexagonal Architecture (Ports & Adapters). */
export interface HexagonalContext extends Kind<"HexagonalContext"> {
  /** Core business logic — pure, no external dependencies. */
  domain: DomainLayer;
  /** Port interfaces defining external communication contracts. */
  ports: PortsLayer;
  /** Adapter implementations connecting ports to technologies. */
  adapters: AdaptersLayer;
}

/** Domain layer — core business logic. */
export interface DomainLayer extends Kind<"DomainLayer"> {}

/** Ports layer — interface definitions. */
export interface PortsLayer extends Kind<"PortsLayer"> {}

/** Adapters layer — port implementations. */
export interface AdaptersLayer extends Kind<"AdaptersLayer"> {}

/** Pre-configured contracts enforcing Hexagonal Architecture rules. */
export const hexagonalContracts = defineContracts<HexagonalContext>({
  noDependency: [
    ["domain", "adapters"],
  ],
  mustImplement: [
    ["ports", "adapters"],
  ],
  purity: ["domain"],
});
```

### `packages/hexagonal/package.json`

```json
{
  "name": "@kindscript/hexagonal",
  "version": "0.1.0",
  "description": "Hexagonal Architecture (Ports & Adapters) pattern definitions for KindScript",
  "main": "index.js",
  "types": "index.d.ts",
  "files": ["index.js", "index.d.ts"],
  "keywords": ["kindscript", "architecture", "hexagonal", "ports-and-adapters"],
  "peerDependencies": {
    "kindscript": "^0.8.0"
  }
}
```

Same tsconfig.json pattern as clean-architecture.

---

## Step 3: Package — `@kindscript/onion`

**Directory:** `packages/onion/`

### `packages/onion/index.ts`

```typescript
/**
 * @kindscript/onion
 *
 * Pre-built Kind definitions and contracts for the Onion Architecture pattern.
 *
 * Onion Architecture organizes code into concentric rings:
 *   - Core: Domain model, entities, value objects
 *   - Domain Services: Domain logic that spans multiple entities
 *   - Application Services: Use case orchestration, application logic
 *   - Infrastructure: External concerns (persistence, messaging, UI)
 *
 * Dependencies point inward — outer rings depend on inner rings, never the reverse.
 *
 * @see https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/
 */

interface Kind<N extends string = string> {
  readonly kind: N;
  readonly location: string;
}

interface ContractConfig {
  noDependency?: [string, string][];
  mustImplement?: [string, string][];
  purity?: string[];
  noCycles?: string[];
  colocated?: [string, string][];
}
function defineContracts<_T = unknown>(config: ContractConfig): ContractConfig {
  return config;
}

/** A bounded context following Onion Architecture. */
export interface OnionContext extends Kind<"OnionContext"> {
  /** Innermost ring — domain model, entities, value objects. */
  core: CoreLayer;
  /** Domain services spanning multiple entities. */
  domainServices: DomainServicesLayer;
  /** Application services — use case orchestration. */
  applicationServices: ApplicationServicesLayer;
  /** Outermost ring — external system integration. */
  infrastructure: InfrastructureLayer;
}

/** Core layer — domain model. */
export interface CoreLayer extends Kind<"CoreLayer"> {}

/** Domain services layer. */
export interface DomainServicesLayer extends Kind<"DomainServicesLayer"> {}

/** Application services layer. */
export interface ApplicationServicesLayer extends Kind<"ApplicationServicesLayer"> {}

/** Infrastructure layer — external concerns. */
export interface InfrastructureLayer extends Kind<"InfrastructureLayer"> {}

/** Pre-configured contracts enforcing Onion Architecture dependency rules. */
export const onionContracts = defineContracts<OnionContext>({
  noDependency: [
    ["core", "domainServices"],
    ["core", "applicationServices"],
    ["core", "infrastructure"],
    ["domainServices", "infrastructure"],
    ["applicationServices", "infrastructure"],
  ],
  purity: ["core"],
});
```

### `packages/onion/package.json`

```json
{
  "name": "@kindscript/onion",
  "version": "0.1.0",
  "description": "Onion Architecture pattern definitions for KindScript",
  "main": "index.js",
  "types": "index.d.ts",
  "files": ["index.js", "index.d.ts"],
  "keywords": ["kindscript", "architecture", "onion"],
  "peerDependencies": {
    "kindscript": "^0.8.0"
  }
}
```

Same tsconfig.json pattern.

---

## Step 4: ClassifyAST two-pass refactor

**File:** `src/application/use-cases/classify-ast/classify-ast.service.ts`

**Change:** Split the single per-file loop into two passes so that contract binding happens after all instances are found.

**Current code (lines 43-91):**
```typescript
for (const sourceFile of request.definitionFiles) {
  const statements = this.astPort.getStatements(sourceFile);

  // Phase 1: Find Kind definitions
  for (const stmt of statements) { ... }

  // Phase 2: Find Instance declarations
  for (const stmt of statements) { ... }

  // Phase 3: Find Contract descriptors
  for (const stmt of statements) { ... }
}
```

**New code:**
```typescript
// First pass: Find Kind definitions and Instance declarations across all files
for (const sourceFile of request.definitionFiles) {
  const statements = this.astPort.getStatements(sourceFile);

  // Phase 1: Find Kind definitions
  for (const stmt of statements) { ... }

  // Phase 2: Find Instance declarations
  for (const stmt of statements) { ... }
}

// Second pass: Find Contract descriptors (all instances now available)
for (const sourceFile of request.definitionFiles) {
  const statements = this.astPort.getStatements(sourceFile);

  // Phase 3: Find Contract descriptors
  for (const stmt of statements) { ... }
}
```

**Why:** When package definition files contain `defineContracts<CleanContext>(...)` and the user's `architecture.ts` contains the instance declaration `const ordering: CleanContext = {...}`, the contracts need the instance to exist in `instanceSymbols` before they can be bound. The two-pass approach ensures this.

**Backward compatibility:** This changes no behavior for single-file cases. Multi-file cases already work for Phases 1+2 (kindDefs and instanceSymbols persist across files). Only Phase 3 ordering is affected.

---

## Step 5: `packages` field in KindScriptConfig

### `src/application/ports/config.port.ts` — modify `KindScriptConfig`

Add `packages` field to the existing config interface:

```typescript
export interface KindScriptConfig {
  definitions?: string[];
  packages?: string[];   // ← NEW: standard library package names
}
```

### `src/infrastructure/adapters/config/config.adapter.ts` — modify parsing

Add parsing for the `packages` field. The ConfigAdapter.readKindScriptConfig already reads the JSON file and extracts `definitions`. Add:

```typescript
const packages = config.packages ?? [];
```

### Package resolution utility

Add a helper method to the ConfigAdapter (or as a standalone function in the CLI layer) for resolving package names to definition file paths:

```typescript
resolvePackageDefinition(packageName: string, projectRoot: string): string | undefined {
  // @kindscript/clean-architecture → <projectRoot>/node_modules/@kindscript/clean-architecture/index.ts
  const candidate = path.join(projectRoot, 'node_modules', packageName, 'index.ts');
  if (fs.existsSync(candidate)) return candidate;
  return undefined;
}
```

This keeps resolution simple — just look for `index.ts` in the installed package.

---

## Step 6: CLI command updates

### `src/infrastructure/cli/main.ts` — modify `runCheck` and `runScaffold`

Both commands need to include resolved package definition files alongside user definition files.

**Pattern (in both runCheck and runScaffold):**

```typescript
// After reading config
const packageDefs: string[] = [];
for (const pkg of config.packages ?? []) {
  const resolved = resolvePackageDefinition(pkg, resolvedPath);
  if (resolved) {
    packageDefs.push(resolved);
  } else {
    process.stderr.write(`Warning: package '${pkg}' not found in node_modules\n`);
  }
}

// Combine: package definitions first, then user definitions
const allDefinitionPaths = [...packageDefs, ...definitionPaths];

// Create program from all definition paths
const rootFiles = allDefinitionPaths.map(p => path.resolve(resolvedPath, p));
// ... pass to classifier
```

**Why package definitions first:** The classifier processes files in order. Package files are processed first so their Kind definitions are in `kindDefs` before user files' instances try to reference them. (Phase 1+2 pass already handles this, but ordering still makes the flow clearer.)

### Also update `runInfer`

When `ksc infer --write` generates output and detects a pattern that matches a standard library package:
- If the package is installed: generate import-based architecture.ts and add `packages` to kindscript.json
- If not installed: generate inline-stubs architecture.ts (current behavior)

Add a helper:

```typescript
function findInstalledPatternPackage(pattern: ArchitecturePattern, projectRoot: string): string | undefined {
  const packageMap: Record<string, string> = {
    'clean-architecture': '@kindscript/clean-architecture',
    'hexagonal': '@kindscript/hexagonal',
  };
  const pkg = packageMap[pattern];
  if (!pkg) return undefined;
  const candidate = path.join(projectRoot, 'node_modules', pkg, 'index.ts');
  if (fs.existsSync(candidate)) return pkg;
  return undefined;
}
```

If the package is found, the InferArchitectureService should generate architecture.ts with:
```typescript
import { CleanContext } from '@kindscript/clean-architecture';

export const app: CleanContext = {
  kind: "CleanContext",
  location: "src",
  ...
};
```

(No boilerplate, no contract section — both come from the package.)

And kindscript.json:
```json
{
  "definitions": ["architecture.ts"],
  "packages": ["@kindscript/clean-architecture"]
}
```

---

## Step 7: Unit tests — ClassifyAST two-pass

**File:** `tests/unit/classify-ast.service.test.ts` — add test

```typescript
it('binds contracts from package file to instances in user file', () => {
  // Package file: Kind defs + contracts
  // User file: instance declaration only
  // Verify: contracts are bound to the instance
});
```

This test creates two mock source files:
1. Package file with `CleanContext extends Kind<"CleanContext">` and `defineContracts<CleanContext>({...})`
2. User file with `const ordering: CleanContext = {...}`

Verifies that contracts are correctly associated with the instance symbol.

Also add a test confirming the existing single-file behavior is unchanged.

---

## Step 8: Unit tests — Config parsing

**File:** `tests/unit/config-symbol-builder.test.ts` or new file

Add tests for:
1. `readKindScriptConfig` parses `packages` field
2. Empty `packages` defaults to `[]`
3. Missing `packages` field defaults to `[]`

---

## Step 9: Integration test fixture — `stdlib-clean-arch`

**Directory:** `tests/integration/fixtures/stdlib-clean-arch/`

```
stdlib-clean-arch/
  kindscript.json
  tsconfig.json
  architecture.ts
  node_modules/
    @kindscript/
      clean-architecture/
        index.ts      ← copy of packages/clean-architecture/index.ts
  src/
    domain/
      entity.ts
    application/
      handler.ts       ← imports from domain (allowed)
    infrastructure/
      repository.ts    ← imports from domain (allowed)
```

### `kindscript.json`

```json
{
  "definitions": ["architecture.ts"],
  "packages": ["@kindscript/clean-architecture"]
}
```

### `architecture.ts`

```typescript
import { CleanContext } from '@kindscript/clean-architecture';

export const app: CleanContext = {
  kind: "CleanContext",
  location: "src",
  domain: {
    kind: "DomainLayer",
    location: "src/domain",
  },
  application: {
    kind: "ApplicationLayer",
    location: "src/application",
  },
  infrastructure: {
    kind: "InfrastructureLayer",
    location: "src/infrastructure",
  },
};
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### Source files

Same as existing `detect-clean-arch` fixture:
- `src/domain/entity.ts` — pure domain class
- `src/application/handler.ts` — imports from domain
- `src/infrastructure/repository.ts` — imports from domain

---

## Step 10: Integration test fixture — `stdlib-clean-arch-violation`

**Directory:** `tests/integration/fixtures/stdlib-clean-arch-violation/`

Same structure as `stdlib-clean-arch`, but with a violation:
- `src/domain/entity.ts` imports from `../infrastructure/repository` (violates noDependency contract from package)

This verifies that contracts from the standard library are actually enforced.

---

## Step 11: Integration tests

**File:** `tests/integration/stdlib-packages.integration.test.ts`

```typescript
describe('Standard Library Packages Integration', () => {
  it('classifies Kind definitions from package file + instances from user file', () => {
    // Classify both package index.ts and user architecture.ts
    // Verify: CleanContext found as Kind, app found as Instance, contracts bound
  });

  it('check detects violations using contracts from package', () => {
    // Run check on stdlib-clean-arch-violation fixture
    // Verify: noDependency violation detected (domain → infrastructure)
  });

  it('check passes on compliant project using package contracts', () => {
    // Run check on stdlib-clean-arch fixture
    // Verify: exit 0, no violations
  });

  it('scaffold works with package-provided Kind definitions', () => {
    // Copy stdlib-clean-arch fixture to temp
    // Run scaffold service with package-provided Kind defs
    // Verify: scaffold plan has correct directories
  });

  it('warns when package not found in node_modules', () => {
    // Create fixture with packages: ["@kindscript/nonexistent"]
    // Verify: warning about missing package, graceful degradation
  });
});
```

---

## Step 12: E2E tests

**File:** `tests/e2e/cli-stdlib.e2e.test.ts`

```typescript
describe('CLI stdlib E2E', () => {
  it('ksc check with @kindscript/clean-architecture exits 0 on compliant project', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'stdlib-clean-arch');
    const result = run(['check', fixturePath]);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain('contracts satisfied');
  });

  it('ksc check with @kindscript/clean-architecture exits 1 on violation', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'stdlib-clean-arch-violation');
    const result = run(['check', fixturePath]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('domain');
    expect(result.stderr).toContain('infrastructure');
  });

  it('ksc scaffold with stdlib package plans correct operations', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'stdlib-clean-arch');
    const result = run(['scaffold', fixturePath]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('domain');
    expect(result.stdout).toContain('application');
    expect(result.stdout).toContain('infrastructure');
  });

  it('ksc --version outputs 0.8.0-m8', () => {
    const result = run(['--version']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('0.8.0-m8');
  });
});
```

---

## Step 13: Version bump and build

- `package.json`: `0.7.0-m7` → `0.8.0-m8`
- `src/infrastructure/cli/main.ts`: version string → `0.8.0-m8`
- `tests/e2e/cli-subprocess.e2e.test.ts`: version assertion → `0.8.0-m8`
- `tests/e2e/cli-init-detect.e2e.test.ts`: version assertion → `0.8.0-m8`
- `tests/e2e/cli-infer.e2e.test.ts`: version assertion → `0.8.0-m8`
- `tests/e2e/cli-scaffold.e2e.test.ts`: version assertion → `0.8.0-m8`
- `npm run build` → clean compilation
- `npx jest --coverage` → all tests pass

---

## Implementation Order

1. Step 1 (Clean Architecture package) — create package files
2. Step 2 (Hexagonal package) — create package files
3. Step 3 (Onion package) — create package files
4. Step 4 (ClassifyAST two-pass refactor) — enable cross-file contract binding
5. Step 7 (ClassifyAST unit tests) — verify two-pass works
6. Step 5 (Config packages field) — add packages to KindScriptConfig
7. Step 8 (Config unit tests) — verify parsing
8. Step 6 (CLI command updates) — resolve and include package defs
9. Step 9 (stdlib-clean-arch fixture) — compliant project using package
10. Step 10 (stdlib-clean-arch-violation fixture) — violation project
11. Step 11 (Integration tests) — real adapter tests
12. Step 12 (E2E tests) — subprocess tests
13. Step 13 (Version bump, build, verify)

---

## Files Created (11 new files)

1. `packages/clean-architecture/index.ts`
2. `packages/clean-architecture/package.json`
3. `packages/clean-architecture/tsconfig.json`
4. `packages/hexagonal/index.ts`
5. `packages/hexagonal/package.json`
6. `packages/hexagonal/tsconfig.json`
7. `packages/onion/index.ts`
8. `packages/onion/package.json`
9. `packages/onion/tsconfig.json`
10. `tests/integration/stdlib-packages.integration.test.ts`
11. `tests/e2e/cli-stdlib.e2e.test.ts`

## Fixture directories created (2 new)

12. `tests/integration/fixtures/stdlib-clean-arch/` (architecture.ts, kindscript.json, tsconfig.json, node_modules/@kindscript/clean-architecture/index.ts, src/)
13. `tests/integration/fixtures/stdlib-clean-arch-violation/` (same structure, with violation in src/domain/)

## Files Modified (7 existing)

14. `src/application/use-cases/classify-ast/classify-ast.service.ts` — two-pass refactor
15. `src/application/ports/config.port.ts` — add `packages` field to KindScriptConfig
16. `src/infrastructure/adapters/config/config.adapter.ts` — parse `packages` field
17. `src/infrastructure/cli/main.ts` — package resolution + inclusion, version bump
18. `package.json` — version bump to `0.8.0-m8`
19. `tests/e2e/cli-subprocess.e2e.test.ts` — version assertion
20. `tests/e2e/cli-init-detect.e2e.test.ts` — version assertion
21. `tests/e2e/cli-infer.e2e.test.ts` — version assertion
22. `tests/e2e/cli-scaffold.e2e.test.ts` — version assertion

---

## Verification

1. `npx tsc --noEmit` — clean compilation
2. `npx jest --coverage` — all tests pass, thresholds met
3. Existing 410+ tests continue passing (no regressions)
4. `node dist/infrastructure/cli/main.js check tests/integration/fixtures/stdlib-clean-arch` → exit 0, contracts satisfied
5. `node dist/infrastructure/cli/main.js check tests/integration/fixtures/stdlib-clean-arch-violation` → exit 1, violation detected
6. `node dist/infrastructure/cli/main.js --version` → `0.8.0-m8`
7. Package definition files compile independently: `cd packages/clean-architecture && npx tsc --noEmit`

---

## Key Design Decisions Summary

| Decision | Choice | Rationale |
|---|---|---|
| Package files | Self-contained (inline Kind + defineContracts) | Avoids import resolution complexity, matches fixture convention |
| Package discovery | Explicit `packages` field in kindscript.json | Predictable, no magic; user declares what they use |
| Cross-file contracts | Two-pass ClassifyAST refactor | Minimal change, preserves single-file behavior |
| Contract model | Additive only | Simple; users who want fewer contracts define their own |
| Package resolution | `node_modules/<name>/index.ts` | Standard npm layout, works with all package managers |
| Version | 0.8.0-m8 | Continues milestone versioning scheme |
