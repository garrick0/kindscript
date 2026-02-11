# 31. Intrinsic Constraint Propagation Pattern

Date: 2026-02-10
Status: Done

**Date:** 2026-02-10
**Status:** Done

### Context

Kind hierarchies are common — a parent Kind has members that reference child Kinds. For example, a `CleanArchitecture` Kind might have a `domain` member that references a `DomainLayer` Kind. If `DomainLayer` declares `pure: true`, it's natural to expect that constraint to propagate automatically to the parent's `domain` member.

Without propagation, users must redeclare every child constraint on the parent:

```typescript
type CleanArch = Kind<"CleanArch", {
  domain: DomainLayer;
  app: AppLayer;
  infra: InfraLayer;
}, {
  noDependency: [['domain', 'app'], ['domain', 'infra'], ['app', 'infra']];
  pure: ['domain'];  // ❌ Must redeclare purity
}>;
```

This is error-prone (easy to forget) and violates DRY (the constraint is already declared on `DomainLayer`).

### Decision

Add an `intrinsic` extension point to `ConstraintProvider`:

```typescript
interface ConstraintProvider {
  readonly constraintName: string;
  generate?(args: TypeNodeView[], parent: ArchSymbol): GeneratorResult;
  intrinsic?: {
    detect(childConstraints: TypeNodeView): boolean;
    propagate(member: ArchSymbol, childKind: ArchSymbol): Contract;
  };
}
```

When a constraint declares `intrinsic`, the binder automatically generates contracts for parent members that reference child Kinds with that constraint:

1. For each member in a Kind instance
2. If the member references a child Kind (detected via `kindMemberReferences`)
3. Check if the child Kind has constraints
4. For each `intrinsicPlugin`, call `plugin.intrinsic.detect(childConstraints)`
5. If detected, call `plugin.intrinsic.propagate(member, childKind)` to generate the contract

Implemented by `purityPlugin` — when a member references a child Kind with `pure: true`, the binder generates a purity contract for that member without requiring explicit declaration.

### Rationale

**Alternatives considered:**

1. **Manual redeclaration only** — verbose, error-prone, violates DRY
2. **Automatic propagation for all constraints** — would break noDependency (siblings shouldn't inherit each other's dependency rules)
3. **Constraint-specific binder logic** — would violate Open-Closed Principle; adding a new intrinsic constraint requires modifying the binder

**Why this approach:**

- **Opt-in per constraint** — only purity uses intrinsic today; noDependency and noCycles don't, preserving their semantics
- **Plugin extension point** — follows D5 (self-registering plugins); adding intrinsic propagation for a new constraint doesn't modify the binder
- **Clear protocol** — `detect` (does this child have the constraint?) + `propagate` (generate the contract for the parent member)
- **Testable** — 5 tests in `purity.plugin.test.ts` verify intrinsic detection and propagation

**Why purity is intrinsic:**

Purity is a property that naturally propagates upward. If a child layer is pure, any parent member containing that layer must also be pure (you can't have impure code in a pure container). This is different from noDependency (which is about relationships between siblings, not parent-child) and noCycles (which is about the member set as a whole).

### Impact

- `ConstraintProvider` interface gains optional `intrinsic` field
- `BindService` gains `intrinsicPlugins` list (filtered from all plugins)
- `BindService.bind()` walks intrinsic plugins for each member with child Kind references
- `purityPlugin` implements `intrinsic.detect()` and `intrinsic.propagate()`
- Public API unchanged (propagation is automatic, invisible to users)
- 5 new tests verify intrinsic purity propagation
- 298 tests passing after implementation

---
