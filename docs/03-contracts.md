# Contracts

> All 6 contract types, the plugin architecture, and how contract checking works.

---

## Overview

KindScript enforces architectural rules through **contracts** — constraints declared on Kind types that are evaluated against the actual codebase. Each contract type checks a different property:

| Contract | Category | What It Checks | Diagnostic Code |
|----------|----------|----------------|-----------------|
| `noDependency` | Dependency | Layer A cannot import from Layer B | KS70001 |
| `mustImplement` | Dependency | Every port interface has an adapter | KS70002 |
| `purity` | Behavioral | Layer has no side-effect imports | KS70003 |
| `noCycles` | Dependency | No circular dependencies between layers | KS70004 |
| `filesystem.mirrors` | Filesystem | Related files exist in parallel directories | KS70005 |
| `filesystem.exists` | Filesystem | Member directories exist on disk | KS70010 |

---

## Declaring Constraints

Constraints are declared as the 3rd type parameter on `Kind<N, Members, Constraints>`:

```typescript
type OrderingContext = Kind<"OrderingContext", {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [
    ["domain", "infrastructure"],
    ["domain", "application"],
  ];
  mustImplement: [["domain", "infrastructure"]];
  noCycles: ["domain", "application", "infrastructure"];
  filesystem: {
    exists: ["domain", "application", "infrastructure"];
    mirrors: [["domain", "infrastructure"]];
  };
}>;
```

The `ConstraintConfig<Members>` type ensures member names are valid identifiers from the Kind's member map.

### Constraint Shapes

Constraints come in four shapes:

| Shape | Constraints | Declaration |
|-------|-------------|-------------|
| **Intrinsic** (applies to a member kind) | `pure` | `pure: true` on the member Kind |
| **Relational** (between two members) | `noDependency`, `mustImplement`, `filesystem.mirrors` | `[["from", "to"]]` |
| **Collective** (across a group) | `noCycles` | `["member1", "member2", ...]` |
| **Existence** (per member) | `filesystem.exists` | `["member1", "member2", ...]` |

---

## Contract Types

### noDependency — Forbidden Dependency (KS70001)

Forbids any file in member A from importing any file in member B. This is the core mechanism for enforcing dependency direction in Clean Architecture, Hexagonal, Onion, etc.

```typescript
type Context = Kind<"Context", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [["domain", "infrastructure"]];
}>;
```

**How it works:**
1. Resolves all files in the `from` member's directory (recursively)
2. Resolves all files in the `to` member's directory (into a Set)
3. For each file in `from`, uses the TypeScript type checker to resolve all imports
4. If any resolved import target is in the `to` member's file set, produces a violation

**Example violation:**
```
src/domain/service.ts:12:1 - error KS70001: Forbidden dependency: domain -> infrastructure

  12 import { Db } from '../infrastructure/database';
     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

**Notes:**
- Both `import` and `import type` are checked (type-only imports are not exempted)
- Dynamic imports (`import()` expressions) are not currently checked
- Re-exports through barrel files are detected at the resolved target level

### mustImplement — Missing Implementation (KS70002)

Checks that every interface exported from member A has a corresponding class implementing it in member B. This enforces the ports-and-adapters pattern.

```typescript
type Context = Kind<"Context", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}, {
  mustImplement: [["domain", "infrastructure"]];
}>;
```

**How it works:**
1. Finds all exported interfaces in the `from` member's files
2. Searches all files in the `to` member for classes with `implements` clauses
3. For each unimplemented interface, produces a violation

**Example violation:**
```
src/domain/ports/user-repo.ts:3:1 - error KS70002: Missing implementation: UserRepository

  Interface 'UserRepository' has no implementing class in infrastructure
```

### purity — Impure Import (KS70003)

Checks that a member marked `pure: true` does not import from Node.js built-in modules (fs, http, crypto, net, etc.). This enforces side-effect-free domain layers.

Purity is declared on the **member Kind** (not the parent Kind):

```typescript
type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;
```

**How it works:**
1. Resolves all files in the member's directory
2. For each file, extracts raw import module specifiers
3. Checks each specifier against the `NODE_BUILTINS` list (includes `node:` prefix variants)
4. If a file imports a built-in module, produces a violation

**Example violation:**
```
src/domain/service.ts:1:1 - error KS70003: Impure import in pure layer: 'fs'

  1 import { readFileSync } from 'fs';
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

### noCycles — Circular Dependency (KS70004)

Detects circular dependency chains between members. If member A imports from member B, and member B imports from member A (directly or transitively through other members), this is a violation.

```typescript
type Context = Kind<"Context", {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}, {
  noCycles: ["domain", "application", "infrastructure"];
}>;
```

**How it works:**
1. Builds an import graph between the specified members
2. Runs Tarjan's SCC (strongly connected components) algorithm
3. Any SCC with more than one member is a cycle → violation

**Example violation:**
```
error KS70004: Circular dependency detected: domain -> infrastructure -> domain
```

### filesystem.mirrors — Missing Counterpart File (KS70005)

Checks that for every file in member A, a corresponding file exists in member B. This is useful for ensuring every component has a test file, every interface has an implementation file, etc.

```typescript
type Context = Kind<"Context", {
  components: ComponentsLayer;
  tests: TestsLayer;
}, {
  filesystem: {
    mirrors: [["components", "tests"]];
  };
}>;
```

**How it works:**
1. Lists all files in member A's directory
2. Lists all files in member B's directory
3. For each file in A, checks if a file with the same relative path (basename) exists in B
4. Missing counterparts are violations

**Example violation:**
```
error KS70005: Missing counterpart: 'components/Button.tsx' has no counterpart in 'tests/'
```

### filesystem.exists — Member Directory Not Found (KS70010)

Checks that each declared member's derived directory actually exists on the filesystem.

```typescript
type Context = Kind<"Context", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}, {
  filesystem: {
    exists: ["domain", "infrastructure"];
  };
}>;
```

**How it works:**
1. For each member named in the constraint, checks if the derived directory path exists
2. Missing directories are violations

**Example violation:**
```
error KS70010: Member directory not found: 'src/infrastructure' does not exist
```

**Note:** This is an explicit, opt-in constraint — directories are NOT checked automatically. Only members listed in `filesystem.exists` are verified.

---

## Contract Plugin Architecture

Each contract type is implemented as a `ContractPlugin` — a self-contained object with validation, checking, and optional generation logic.

### Plugin Interface

```typescript
interface ContractPlugin {
  type: ContractType;              // e.g., 'noDependency'
  constraintName: string;          // e.g., 'noDependency' (matches ConstraintConfig key)
  diagnosticCode: number;          // e.g., 70001

  validate(args: ArchSymbol[]): string | null;  // Validate contract arguments
  check(request: CheckRequest): Diagnostic[];    // Evaluate the contract
  generate?(view: TypeNodeView): Contract[];     // Parse constraints from AST
  intrinsic?(symbol: ArchSymbol): Contract[];    // Create contracts from intrinsic markers
}
```

### Plugin Registry

All 6 plugins are registered in `plugin-registry.ts`:

```typescript
function createAllPlugins(tsPort: TypeScriptPort): ContractPlugin[] {
  return [
    noDependencyPlugin(tsPort),
    mustImplementPlugin(tsPort),
    purityPlugin(),
    noCyclesPlugin(tsPort),
    existsPlugin(),
    mirrorsPlugin(),
  ];
}
```

The `CheckContractsService` is a thin dispatcher (~60 lines) that:
1. Receives contracts and resolved files
2. Looks up the appropriate plugin for each contract's type
3. Delegates checking to the plugin
4. Aggregates all diagnostics

### Adding a New Contract Type

1. Add the contract type to `src/domain/types/contract-type.ts`
2. Add the diagnostic code to `src/domain/constants/diagnostic-codes.ts`
3. Create the plugin in `src/application/enforcement/check-contracts/<name>/<name>.plugin.ts`
4. Register it in `plugin-registry.ts`
5. Add unit tests in `tests/application/<name>.plugin.test.ts`
6. Add integration tests and fixtures
7. Add E2E tests in `tests/cli/e2e/cli.e2e.test.ts`

---

## How Contract Checking Works

### Data Flow

```
ClassifyProjectService
    → discovers source files
    → creates TS program

ClassifyASTService (binder)
    → walks AST with type checker
    → finds Kind definitions → ArchSymbol[]
    → extracts constraints from 3rd type parameter → Contract[]
    → finds instance declarations → links to Kind symbols
    → derives locations from file paths

resolveSymbolFiles
    → walks ArchSymbol tree
    → readDirectory() for each member path
    → produces Map<location, files[]>

CheckContractsService (checker)
    → for each Contract:
        → validate arguments (plugin.validate)
        → evaluate against resolved files and imports (plugin.check)
        → collect Diagnostic[]
    → return all diagnostics
```

### What the Checker Receives

The checker receives **pre-resolved data** — it does zero live I/O during checking:

- `contracts: Contract[]` — all contracts to evaluate
- `symbols: ArchSymbol[]` — all architectural symbols
- `resolvedFiles: Map<string, string[]>` — location → file list mapping
- `tsPort: TypeScriptPort` — for import resolution and interface analysis

This separation means:
- The checker is testable with mock data (no filesystem needed)
- File resolution happens once, not per-contract
- The checker focuses purely on evaluation logic
