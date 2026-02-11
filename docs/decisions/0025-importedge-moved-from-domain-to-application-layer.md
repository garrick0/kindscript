# 25. ImportEdge Moved from Domain to Application Layer

Date: 2026-02-10
Status: Done

**Date:** 2026-02-10
**Status:** Done

### Context

`ImportEdge` was originally a domain value object in `src/domain/value-objects/import-edge.ts`. It represented a directed edge in the import graph between two source files. The domain layer contained `ImportEdge.fromFile`, `ImportEdge.toFile`, `ImportEdge.line`, and `ImportEdge.equals()`.

As KindScript evolved, the architectural layering principles became clearer:
- **Domain layer** — pure, technology-agnostic entities (ArchSymbol, Contract, Diagnostic)
- **Application layer** — use case orchestration and technology-specific models (pipeline, ports)
- **Infrastructure layer** — adapters to external systems (TypeScript compiler, filesystem)

Import edges are specific to how TypeScript's module system works. They are extracted by the TypeScript adapter parsing `import` declarations and `import()` expressions. They are not a universal architectural concept — other languages have different import semantics (e.g., Go's package imports, Python's module imports).

With the introduction of `IntraFileEdge` (D22) for declaration-level references, it became clear that both edge types are pipeline-internal data structures used by the checker, not domain concepts that apply universally.

### Decision

Move `ImportEdge` from `src/domain/value-objects/` to `src/application/pipeline/check/import-edge.ts`. When `IntraFileEdge` was created in the same commit, it was placed directly in `application/pipeline/check/` without ever being considered for the domain layer.

### Rationale

**Why not domain:**

- **Technology-specific** — import edges are TypeScript/JavaScript-specific. Other languages (Go, Rust, Python) have different module systems. Domain entities should be architecture-universal.
- **Pipeline-internal** — import edges are created by the TypeScript adapter and consumed by the checker. They never leave the application layer. Domain entities like `Contract` and `Diagnostic` are referenced across all layers.
- **Not a domain concept** — the domain is "architectural symbols and constraints." Import edges are an implementation detail of how we detect violations.

**Why application layer:**

- **Used by checker stage** — import edges are constructed by `TypeScriptAdapter.getImports()` and consumed by checker plugins (noDependency, noCycles). They are pipeline data.
- **Alongside IntraFileEdge** — intra-file edges were never considered for domain placement. Both edge types serve the same role (dependency detection) and belong together.
- **Matches TypeScript compiler** — TypeScript's own compiler doesn't treat imports as domain concepts; they're intermediate data in the binding phase.

**Alternative considered:**

Keep ImportEdge in domain but move it to `domain/pipeline-models/`. Rejected: would create a new category within domain for "kind of domain, kind of not" concepts, which violates layer purity.

### Impact

- `src/domain/value-objects/import-edge.ts` deleted
- `src/application/pipeline/check/import-edge.ts` created with identical implementation
- All import statements updated (`domain/value-objects/import-edge` → `application/pipeline/check/import-edge`)
- No logic changes, no test changes
- `IntraFileEdge` placed in same directory (`application/pipeline/check/intra-file-edge.ts`)
- 298 tests passing after move

---
