# Constraints

> All 6 constraint types, the plugin architecture, and how constraint checking works.

---

## Overview

KindScript enforces architectural rules through **constraints** — rules declared on Kind types that are evaluated against the actual codebase. Each constraint type checks a different property.

> **Terminology:** Users declare *constraints* on Kind types. Internally, the compiler generates *contracts* — evaluable rules produced by `ConstraintProvider` plugins in the bind stage. The docs use "constraint" for the user-facing concept and "contract" for the internal domain entity.

| Constraint | Category | What It Checks | Diagnostic Code |
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

The `Constraints<Members>` type ensures member names are valid identifiers from the Kind's member map.

### Constraint Shapes

Constraints come in four shapes:

| Shape | Constraints | Declaration |
|-------|-------------|-------------|
| **Intrinsic** (applies to a member kind) | `pure` | `pure: true` on the member Kind |
| **Relational** (between two members) | `noDependency`, `mustImplement`, `filesystem.mirrors` | `[["from", "to"]]` |
| **Collective** (across a group) | `noCycles` | `["member1", "member2", ...]` |
| **Existence** (per member) | `filesystem.exists` | `["member1", "member2", ...]` |

---

## Constraint Types

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

## Intrinsic Constraints

Most constraints are declared on a parent Kind and reference its members by name (e.g., `noDependency: [["domain", "infrastructure"]]`). **Intrinsic constraints** work differently — they are declared on a member Kind itself and automatically propagate to every parent instance that uses that member.

Currently only `purity` supports intrinsic propagation.

### How It Works

1. **Declare purity on the member Kind:**

```typescript
type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;
```

2. **Use it as a member in a parent Kind:**

```typescript
type OrderingContext = Kind<"OrderingContext", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}>;
```

3. **The binder detects and propagates:**

During the bind stage, `BindService` inspects each member Kind's constraints. When it finds `pure: true` on `DomainLayer`, it calls `purityPlugin.intrinsic.propagate()` to create a `Purity` contract targeting the `domain` member in every `OrderingContext` instance — without the parent Kind needing to declare purity explicitly.

### Why Intrinsic?

Some constraints are properties of the member itself, not relationships between members. Purity is inherent to `DomainLayer` — it should be pure everywhere it's used, not just in contexts that remember to declare it. Intrinsic propagation makes this automatic.

### Plugin Support

A plugin supports intrinsic behavior by providing an `intrinsic` object with two methods:

- `detect(view: TypeNodeView): boolean` — returns true if the member Kind's constraints contain this intrinsic (e.g., has a `pure` boolean property)
- `propagate(memberSymbol, memberName, location): Contract` — creates the contract for this member

The binder deduplicates: if a parent Kind explicitly declares the same constraint, the intrinsic propagation is skipped.

---

## Constraint Plugin Architecture

Each constraint type is implemented as a `ContractPlugin` — a self-contained object with validation, checking, and optional generation logic.

### Plugin Interface

Each `ContractPlugin` extends `ConstraintProvider` (the bind-stage view) with enforcement capabilities:

```typescript
interface ConstraintProvider {
  readonly constraintName: string;
  generate?: (value: TypeNodeView, instanceSymbol: ArchSymbol, kindName: string, location: string) => GeneratorResult;
  intrinsic?: {
    detect(view: TypeNodeView): boolean;
    propagate(memberSymbol: ArchSymbol, memberName: string, location: string): Contract;
  };
}

interface ContractPlugin extends ConstraintProvider {
  readonly type: ContractType;
  readonly diagnosticCode: number;

  validate(args: ArchSymbol[]): string | null;
  check(contract: Contract, ctx: CheckContext): CheckResult;

  codeFix?: { fixName: string; description: string };
}
```

### Plugin Registry

All 6 plugins are registered in `plugin-registry.ts`. Each plugin is a singleton object (not a factory function):

```typescript
function createAllPlugins(): ContractPlugin[] {
  return [
    noDependencyPlugin,
    purityPlugin,
    noCyclesPlugin,
    mustImplementPlugin,
    existsPlugin,
    mirrorsPlugin,
  ];
}
```

The `CheckerService` is a thin dispatcher (~60 lines) that:
1. Receives contracts and resolved files
2. Looks up the appropriate plugin for each contract's type
3. Delegates checking to the plugin
4. Aggregates all diagnostics

### Adding a New Constraint Type

1. Add the contract type to `src/domain/types/contract-type.ts`
2. Add the diagnostic code to `src/domain/constants/diagnostic-codes.ts`
3. Create the plugin in `src/application/pipeline/plugins/<name>/<name>.plugin.ts`
4. Register it in `plugins/plugin-registry.ts`
5. Add unit tests in `tests/application/<name>.plugin.test.ts`
6. Add integration tests and fixtures
7. Add E2E tests in `tests/cli/e2e/cli.e2e.test.ts`

### Walkthrough: Implementing a Plugin

This walkthrough shows the structure of a typical plugin using `existsPlugin` as a reference — the simplest real plugin.

**Step 1: Domain types**

```typescript
// src/domain/types/contract-type.ts — add to the enum
export enum ContractType {
  // ... existing types
  Exists = 'Exists',
}

// src/domain/constants/diagnostic-codes.ts — add a code
export const DiagnosticCode = {
  // ... existing codes
  MemberNotFound: 70010,
} as const;
```

**Step 2: Plugin file** (`src/application/pipeline/plugins/exists/exists.plugin.ts`)

Every plugin is a singleton object implementing `ContractPlugin`:

```typescript
import { ContractPlugin } from '../contract-plugin';
import { ContractType } from '../../../../domain/types/contract-type';
import { DiagnosticCode } from '../../../../domain/constants/diagnostic-codes';

export const existsPlugin: ContractPlugin = {
  type: ContractType.Exists,
  constraintName: 'filesystem.exists',       // dotted name matching constraint tree path
  diagnosticCode: DiagnosticCode.MemberNotFound,

  // generate(): called by the Binder to create Contract[] from constraint values
  generate: {
    fromStringList: true,  // uses the shared generateFromStringList() helper
  },

  // validate(): called by the Checker before check(). Return null if valid.
  validate(args) {
    if (args.length === 0) return 'exists requires at least one symbol';
    return null;
  },

  // check(): called by the Checker to evaluate the contract
  check(contract, ctx) {
    const diagnostics = [];
    for (const symbol of contract.args) {
      if (!ctx.resolvedFiles.has(symbol.declaredLocation)) {
        diagnostics.push(new Diagnostic(
          `Member directory not found: '${symbol.declaredLocation}'`,
          DiagnosticCode.MemberNotFound,
          '',    // empty string = structural (not file-specific)
          0, 0,
        ));
      }
    }
    return { diagnostics, filesAnalyzed: 0 };
  },
};
```

**Step 3: Register** in `src/application/pipeline/plugins/plugin-registry.ts`:

```typescript
import { existsPlugin } from './exists/exists.plugin';

export function createAllPlugins(): ContractPlugin[] {
  return [
    // ... existing plugins
    existsPlugin,
  ];
}
```

**Step 4: Tests** — every plugin needs three test categories:

```typescript
// tests/application/exists.plugin.test.ts
describe('existsPlugin', () => {
  // 1. Validation tests
  it('validates with at least one arg', () => { ... });
  it('rejects empty args', () => { ... });

  // 2. Check tests (with mock resolved files)
  it('passes when directory exists', () => { ... });
  it('reports missing directory', () => { ... });

  // 3. Generate tests (contract generation from constraint values)
  it('generates contracts from string list', () => { ... });
});
```

All 6 existing plugins follow this exact pattern. See any plugin in `src/application/pipeline/plugins/` for a complete reference.

---

## How Contract Checking Works

### Data Flow

```
PipelineService (orchestrator)
    → reads config, discovers source files, creates TS program

ScanService (scanner)
    → walks AST with type checker via ASTViewPort
    → extracts KindDefinitionView[] and InstanceDeclarationView[]

ParseService (parser)
    → builds ArchSymbol trees from scan output
    → derives filesystem locations from member names
    → resolves files for each member path (readDirectory)
    → produces Map<location, files[]>

BindService (binder)
    → walks constraint trees from Kind definitions
    → generates Contract[] via ConstraintProvider plugins
    → propagates intrinsic constraints (e.g., pure: true)

CheckerService (checker)
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
