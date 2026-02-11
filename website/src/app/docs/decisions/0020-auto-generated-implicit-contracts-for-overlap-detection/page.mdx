# 20. Auto-Generated Implicit Contracts for Overlap Detection

Date: 2026-02-11
Status: Done

**Date:** 2026-02-11
**Status:** Done

### Context

Kind members are supposed to be disjoint — each file belongs to exactly one member. If two members claim the same file, architectural boundaries break down. For example, if both `domain/` and `infrastructure/` members include `src/logger.ts`, which layer does the logger belong to? Dependency rules become ambiguous.

Manual overlap constraints would be verbose (`overlap: [['domain', 'app'], ['domain', 'infra'], ...]` for every pair) and error-prone (easy to forget a pair when adding a new member). Overlap is a structural invariant of the Kind system itself, not a user-declared rule.

### Decision

Introduce `overlapPlugin` as the first **implicit constraint** — the binder automatically generates overlap contracts for every pair of sibling members, without requiring user declaration:

1. For each instance with 2+ members
2. For each unique pair of members `(A, B)` where `A < B` (lexicographically)
3. Skip pairs where one is a folder member and the other is a TypeKind member (see rationale)
4. Generate `Contract(Overlap, [A, B], instance)`

The checker validates that `resolvedFiles(A)` and `resolvedFiles(B)` are disjoint. Any shared file produces a diagnostic (DiagnosticCode.OverlappingMembers KS70006).

**Folder-TypeKind exclusion:**

If member A is a folder-based Kind and member B is a TypeKind, their "overlap" is intentional composition, not a violation:

```typescript
type System = Kind<"System", {
  ordering: Microservice;        // Folder: src/ordering/
  deciders: Decider;             // TypeKind: any file with `export const x: DeciderFn`
}>;
```

A file like `src/ordering/decider.ts` belongs to both members by design — it's in the ordering microservice AND contains a decider function. Folder members classify by location; TypeKind members classify by annotation. They operate on orthogonal axes.

### Rationale

**Why implicit:**

- **Universal invariant** — overlap is never desirable for same-axis members (two folders, two TypeKinds)
- **Zero configuration** — users don't need to learn or declare this constraint
- **Fail-safe** — can't be accidentally omitted (no "forgot to add overlap check" bugs)

**Why folder-TypeKind exclusion:**

- **Different classification axes** — folder = location-based, TypeKind = type-based
- **Intentional composition** — a file can be in a folder member AND have a typed export member
- **Real-world pattern** — common in projects with both structural layers (domain/) and cross-cutting classifications (pure functions, commands, queries)

**Alternative considered:**

Make overlap explicit in `Constraints`. Rejected: verbose, error-prone, and overlap is not optional — it's always wrong for same-axis members.

**Precedent:**

This is the first auto-generated constraint in KindScript. Previous constraints (noDependency, purity, noCycles, scope, exhaustiveness) are all explicitly declared. Overlap is different because it's a structural integrity check, not a user-defined rule.

### Impact

- Created `overlapPlugin` in `src/application/pipeline/plugins/overlap/`
- Plugin registered in `plugin-registry.ts`
- `BindService.generateImplicitContracts()` generates overlap contracts for all instances
- `BindService.skipOverlapCheck()` detects folder-TypeKind pairs
- `BindResult.contracts` includes auto-generated overlap contracts
- 12 tests in `overlap.plugin.test.ts`
- 4 tests verify folder-TypeKind exclusion
- 2 integration fixtures (overlap-clean, overlap-violation)
- 2 E2E tests in `cli.e2e.test.ts`
- 343 tests passing

---
