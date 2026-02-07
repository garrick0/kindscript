# KindScript

> **TypeScript for Architecture** — Define architectural patterns as types, enforce them at compile time.

KindScript is a TypeScript-based architectural compiler that validates codebases against architectural contracts. Just as TypeScript validates that values conform to types, KindScript validates that codebases conform to architectural patterns.

## The Core Insight

Architecture has the same normative/descriptive split as types:

```typescript
// TypeScript: Types vs Values
type User = { name: string; age: number }  // ← Normative (what must be true)
const user: User = { name: "Alice", age: 30 }  // ← Descriptive (what is true)

// KindScript: Architectural Patterns vs Codebases
type CleanArchContext = Kind<"CleanArchContext"> & {
  domain: DomainLayer;      // ← Normative (what architecture must have)
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}

const ordering: CleanArchContext = {  // ← Descriptive (what codebase has)
  kind: "CleanArchContext",
  location: "src/contexts/ordering",
  domain: { kind: "DomainLayer", location: "src/contexts/ordering/domain" },
  // ... architectural violations detected at compile time
}
```

**TypeScript checks structure.** KindScript adds **behavioral contracts**:
- `noDependency(domain, infrastructure)` — domain can't import from infrastructure
- `mustImplement(ports, adapters)` — every port must have an adapter
- `purity(domain)` — domain layer has no side effects
- `noCycles(...)` — no circular dependencies between contexts

## Project Status

🚧 **Early Development** — M0 complete, M1 in progress.

### What's Done

✅ **Layer 1: Type Primitives** (Complete)
- `Kind<N>`, `IsLeaf<T>`, `Multiple<T>`, `WithLocation<T>`
- ~70 lines of pure TypeScript types
- Full IDE support (autocomplete, go-to-definition) for free

✅ **Architecture Design** (Complete)
- [V4 Architecture Document](docs/ANALYSIS_COMPILER_ARCHITECTURE_V4.md) — Complete architectural specification
- [Incremental Build Plan](docs/BUILD_PLAN_INCREMENTAL.md) — 8 milestones from prototype to production
- [Infrastructure Review](docs/REVIEW_LEVERAGING_TS_INFRASTRUCTURE.md) — Ecosystem analysis and design decisions

✅ **Milestone 0: Architecture Validation** (Complete)
- ✅ Core domain entities (ArchSymbol, Contract, Diagnostic)
- ✅ All ports defined (TypeScriptPort, FileSystemPort, ConfigPort, DiagnosticPort)
- ✅ Mock implementations for testing
- ✅ 20+ architecture validation tests
- ✅ **Zero** TypeScript API dependencies in domain/application
- ✅ **Zero** real file I/O in tests
- See [M0 Implementation Plan](docs/IMPLEMENTATION_PLAN_M0.md) for details

### What's Next

See [BUILD_PLAN_INCREMENTAL.md](docs/BUILD_PLAN_INCREMENTAL.md) for the detailed roadmap.

**Milestone 1** (2 weeks): Single Contract End-to-End — NEXT
- Real TypeScript and filesystem adapters
- Working CLI: `ksc check`
- Detects violations in real projects
- Exit code integration for CI

**Milestone 2** (3 weeks): Real Classifier
- Parse kind definitions from TypeScript
- Parse instance declarations
- Symbol-to-files resolution
- Type-safe definitions with full IDE support

**Milestones 3-8**: Full contracts, project references, plugin, inference, generator, standard library

**Total timeline**: ~16 weeks (4 months) to full feature set

## Quick Start (Current Capabilities)

Right now, you can use KindScript's type primitives to define architectural patterns:

```typescript
import type { Kind, IsLeaf, Multiple, WithLocation } from "./lib/mod.ts";

// Define your architecture as types
type Entity = Kind<"Entity">;
type Repository = Kind<"Repository">;

type DomainLayer = Kind<"DomainLayer"> & {
  entities: Multiple<Entity>;
  repositories: Multiple<Repository>;
};

type ApplicationLayer = Kind<"ApplicationLayer"> & {
  useCases: string;  // Directory path
};

type InfrastructureLayer = Kind<"InfrastructureLayer"> & {
  adapters: string;
};

type CleanArchContext = Kind<"CleanArchContext"> & {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
};

// TypeScript validates structural conformance automatically
const ordering: CleanArchContext = {
  kind: "CleanArchContext",
  domain: {
    kind: "DomainLayer",
    entities: [
      { kind: "Entity" },
      { kind: "Entity" },
    ],
    repositories: [
      { kind: "Repository" },
    ],
  },
  application: {
    kind: "ApplicationLayer",
    useCases: "use-cases",
  },
  infrastructure: {
    kind: "InfrastructureLayer",
    adapters: "adapters",
  },
};

// ❌ TypeScript error if structure is wrong:
const badApp: CleanArchContext = {
  kind: "CleanArchContext",
  domain: { kind: "DomainLayer", entities: [], repositories: [] },
  // Error: Property 'application' is missing
};
```

**What works today:**
- ✅ Define architectural patterns as TypeScript types
- ✅ TypeScript validates structural conformance
- ✅ Full IDE support (autocomplete, refactoring, type checking)
- ✅ Derive properties (IsLeaf, etc.) from structure

**What's coming:**
- 🚧 Behavioral contract validation (`noDependency`, `mustImplement`, etc.)
- 🚧 CLI tool (`ksc check`, `ksc infer`, `ksc scaffold`)
- 🚧 IDE plugin (violations shown inline)
- 🚧 Inference engine (generate definitions from existing code)
- 🚧 Code generation (scaffold structure from definitions)

## Documentation

### Core Documents

- **[Architecture V4](docs/ANALYSIS_COMPILER_ARCHITECTURE_V4.md)** — Complete architectural specification
  - How KindScript maps to TypeScript compiler architecture
  - Build/Wrap/Skip decisions with ecosystem evidence
  - Plugin-based language service (not custom LSP)
  - Incremental compilation strategy
  - Standard library distribution (npm packages)

- **[Incremental Build Plan](docs/BUILD_PLAN_INCREMENTAL.md)** — Implementation roadmap
  - 8 milestones with customer validation gates
  - Clean Architecture with ports/adapters throughout
  - Jupyter notebooks for UX validation
  - 16-week timeline to full feature set

- **[Infrastructure Review](docs/REVIEW_LEVERAGING_TS_INFRASTRUCTURE.md)** — Design decisions
  - Evaluation of "leverage TypeScript vs build custom" for each component
  - Analysis of plugin vs LSP approach
  - Project references as zero-config tier
  - ts-morph decision (no dependency, use raw API)

### Archive

Older design iterations preserved in [docs/archive/](docs/archive/):
- V1, V2, V3 architecture documents (superseded by V4)
- Early design explorations

## Architecture Principles

KindScript follows **strict Clean Architecture**:

```
Domain Layer (Pure Business Logic)
  └─ Entities: ArchSymbol, Contract, Diagnostic
  └─ Value Objects: ImportEdge, Location

Application Layer (Use Cases + Ports)
  └─ Ports: TypeScriptPort, FileSystemPort, ConfigPort
  └─ Use Cases: ClassifyAST, CheckContracts, InferArchitecture

Infrastructure Layer (Adapters)
  └─ TypeScriptAdapter (wraps ts.Program)
  └─ FileSystemAdapter (wraps fs)
  └─ CLIAdapter, PluginAdapter
```

**Key decisions:**
- Use TypeScript's parser (don't rebuild it)
- Use TypeScript's module resolution (don't reimplement it)
- Use TypeScript's language service plugin API (not custom LSP)
- Use ts.Diagnostic format (native integration)
- Publish standard library as npm packages (like @types/*)

See [V4 Architecture](docs/ANALYSIS_COMPILER_ARCHITECTURE_V4.md) for complete rationale.

## Examples

### Clean Architecture Pattern

```typescript
type CleanArchContext = Kind<"CleanArchContext"> & {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
};

const contracts = defineContracts<CleanArchContext>({
  noDependency: [
    ["domain", "infrastructure"],
    ["domain", "application"],
  ],
  mustImplement: [
    ["domain.ports", "infrastructure.adapters"],
  ],
  purity: ["domain"],
});
```

### Hexagonal Architecture Pattern

```typescript
type HexagonalContext = Kind<"HexagonalContext"> & {
  core: CoreLayer;
  ports: PortsLayer;
  adapters: AdaptersLayer;
};

const contracts = defineContracts<HexagonalContext>({
  noDependency: [
    ["core", "adapters"],
    ["ports", "adapters"],
  ],
  mustImplement: [
    ["ports", "adapters"],
  ],
});
```

### Modular Monolith Pattern

```typescript
type ModularMonolith = Kind<"ModularMonolith"> & {
  contexts: Multiple<BoundedContext>;
};

type BoundedContext = Kind<"BoundedContext"> & {
  domain: string;
  api: string;
  infrastructure: string;
};

const contracts = defineContracts<ModularMonolith>({
  noCycles: ["contexts"],  // No circular dependencies between contexts
});
```

## Planned CLI Usage

(Not yet implemented — see build plan for timeline)

```bash
# Check architectural contracts
$ ksc check
src/ordering/domain/service.ts:12:1 - error KS70001: Forbidden dependency: domain → infrastructure
Found 1 architectural violation.

# Infer architecture from existing codebase
$ ksc infer
Detected pattern: Clean Architecture
Generated architecture.ts with 2 violations.

# Generate structure from definitions
$ ksc scaffold
Created src/contexts/ordering/domain/
Created src/contexts/ordering/application/
✓ Scaffold complete.

# Zero-config quick start with project references
$ ksc init --detect
Detected layers: domain, application, infrastructure
Generated tsconfig.json files for project references.
TypeScript will now enforce dependency boundaries.
```

## Development

### Project Structure

```
lib/
  mod.ts       # Public exports
  types.ts     # Type primitives (Kind, IsLeaf, etc.)

notebooks/
  01-define-kinds.ipynb       # Interactive examples
  02-declare-instances.ipynb

docs/
  ANALYSIS_COMPILER_ARCHITECTURE_V4.md  # Architecture spec
  BUILD_PLAN_INCREMENTAL.md             # Build plan
  REVIEW_LEVERAGING_TS_INFRASTRUCTURE.md # Design decisions
  archive/                               # Old versions

src/  (coming in M0+)
  domain/
    entities/     # ArchSymbol, Contract, Diagnostic
    value-objects/ # ImportEdge, Location

  application/
    ports/        # TypeScriptPort, FileSystemPort, etc.
    use-cases/    # ClassifyAST, CheckContracts, etc.

  infrastructure/
    adapters/     # TypeScriptAdapter, FileSystemAdapter, etc.
```

### Running Examples

```bash
# Run Jupyter notebooks
deno jupyter --install
jupyter notebook

# Run tests (coming in M0)
deno test

# Check types
deno check lib/mod.ts
```

## Why KindScript?

**Problem:** Architectural rules live in documentation, Confluence pages, and senior engineers' heads. They're not enforced, they drift, and new developers violate them unknowingly.

**Solution:** Define architecture as types, validate at compile time.

**Benefits:**
- ✅ Architecture violations caught in IDE (before PR)
- ✅ Refactoring-safe (rename a layer → all violations surface)
- ✅ Self-documenting (architecture.ts is the source of truth)
- ✅ Gradual adoption (works on existing codebases)
- ✅ Zero runtime overhead (compile-time only)

**Comparison to other tools:**

| Tool | Approach | KindScript Difference |
|------|----------|----------------------|
| ArchUnit (Java) | Runtime reflection + rules | Compile-time validation, type-safe definitions |
| dependency-cruiser | Config-based rules | Type-safe definitions, full IDE support |
| Nx boundaries | ESLint + tags | TypeScript integration, behavioral contracts |
| Madge | Visualization only | Enforcement + validation |

**KindScript is TypeScript-native:** Definitions are real TypeScript types, contracts are checked by a TypeScript plugin, errors appear as TypeScript diagnostics. No new language to learn.

## Contributing

This project is in early development. The architecture is complete (see [docs/](docs/)), implementation is beginning.

**Current phase:** Milestone 0 (Domain + Ports + Test Infrastructure)

**How to contribute:**
1. Read [ANALYSIS_COMPILER_ARCHITECTURE_V4.md](docs/ANALYSIS_COMPILER_ARCHITECTURE_V4.md)
2. Read [BUILD_PLAN_INCREMENTAL.md](docs/BUILD_PLAN_INCREMENTAL.md)
3. Check current milestone in build plan
4. Implement following Clean Architecture (ports/adapters)
5. Write tests using mock implementations

## License

MIT

---

## Type System Primitives Reference

(Current implementation — Layer 1 complete)

### `Kind<N>`
Base type with kind discriminator:
```typescript
type MyKind = Kind<"MyKind">;  // → { kind: "MyKind" }
```

### `IsLeaf<T>`
Derives whether a kind has children:
```typescript
type Entity = Kind<"Entity">;
type IsLeaf<Entity>  // → true (no children)

type Layer = Kind<"Layer"> & { entities: Entity[] };
type IsLeaf<Layer>  // → false (has children)
```

### `Multiple<T>`
Alias for `T[]` (documentation):
```typescript
type Layer = Kind<"Layer"> & {
  entities: Multiple<Entity>;  // Same as Entity[], but clearer intent
};
```

### `WithLocation<T>`
Adds filesystem location:
```typescript
type Layer = Kind<"Layer">;
type LayerWithLocation = WithLocation<Layer>;
// → { kind: "Layer"; location: string }
```

### `File`
Represents a file:
```typescript
type File = { kind: "File"; path: string };
```

## Links

- [Architecture V4](docs/ANALYSIS_COMPILER_ARCHITECTURE_V4.md)
- [Build Plan](docs/BUILD_PLAN_INCREMENTAL.md)
- [Design Review](docs/REVIEW_LEVERAGING_TS_INFRASTRUCTURE.md)
- [Deno Documentation](https://deno.land)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
