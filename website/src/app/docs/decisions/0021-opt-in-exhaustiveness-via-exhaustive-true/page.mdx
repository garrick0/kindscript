# 21. Opt-In Exhaustiveness via `exhaustive: true`

Date: 2026-02-11
Status: Done

**Date:** 2026-02-11
**Status:** Done

### Context

KindScript validates architectural constraints by checking relationships between members: noDependency (cross-member imports), purity (external imports), noCycles (circular dependencies). These constraints assume that **if a file isn't assigned to any member, that's acceptable** — the file is outside the architectural scope.

This assumption fails for container-style Kinds where every file **must** belong to some member. For example, a Clean Architecture Kind with domain/application/infrastructure members expects all files in the project to fall into one of these layers. An "orphan" file (e.g., `src/utils.ts` not in any layer) represents a design flaw, not a deliberate omission.

Without exhaustiveness checking, orphaned files are invisible — KindScript never reports them.

### Decision

Add `exhaustive?: true` to the `Constraints` type, enabling opt-in exhaustiveness checking:

```typescript
type CleanArch = Kind<"CleanArch", {
  domain: Domain;
  app: Application;
  infra: Infrastructure;
}, {
  noDependency: [['domain', 'app'], ['domain', 'infra'], ['app', 'infra']];
  exhaustive: true;  // All files must belong to some member
}>;
```

Create `exhaustivenessPlugin` (ContractType.Exhaustiveness, DiagnosticCode.UnassignedFile KS70007):

1. The binder generates exhaustiveness contracts for instances with `exhaustive: true`
2. The checker computes unassigned files as:
   ```typescript
   const allFiles = containerFiles.get(instanceId);
   const assignedFiles = union(resolvedFiles.get(memberId) for all members);
   const unassigned = allFiles - assignedFiles;
   ```
3. Each unassigned file produces a diagnostic

**Hardcoded exclusions:**

- `context.ts` (architectural definition file, not application code)
- `*.test.ts`, `*.spec.ts` (test files)
- `**/__tests__/**` (test directories)

### Rationale

**Why opt-in:**

Not all architectural patterns need exhaustiveness. A `DesignSystem` Kind with versioned atoms (`v1.0.0`, `v2.0.0`) deliberately allows unversioned files (e.g., shared utilities). Making exhaustiveness mandatory would force artificial member assignments.

**Why in Constraints:**

Exhaustiveness is a constraint on the Kind's member set, similar to how `noDependency` constrains relationships between members. It belongs in the `Constraints` type parameter, not in `KindConfig`, because it's an opt-in rule, not a structural property of the Kind.

**Why hardcoded exclusions:**

- **Simplicity** — avoids adding a configuration API for exclusion patterns
- **Sensible defaults** — 95% of projects want to exclude test files and context files
- **Fail-safe** — users can always refactor exclusions into a dedicated member if needed (e.g., `tests: TestSuite`)

**Alternative considered:**

Add `exclude: string[]` parameter to exhaustiveness. Rejected: premature complexity; hardcoded patterns cover the common case, and we can add configurability later if needed.

**Why different from noDependency/purity/noCycles:**

- **Completeness vs. relationships** — checks that all files are covered, not how members relate
- **Single instance, not pairs** — operates on the instance as a whole, not on member pairs
- **Uses containerFiles** — requires D28 (container resolution) to compute total scope

### Impact

- `Constraints` type gains optional `exhaustive?: true` field
- Created `exhaustivenessPlugin` in `src/application/pipeline/plugins/exhaustiveness/`
- Plugin registered in `plugin-registry.ts`
- `BindService` generates exhaustiveness contracts from `exhaustive: true` constraints
- `CheckerRequest` includes `containerFiles` (prerequisite: D28)
- 13 tests in `exhaustiveness.plugin.test.ts`
- 2 integration fixtures (exhaustiveness-clean, exhaustiveness-violation)
- 2 E2E tests in `cli.e2e.test.ts`
- 343 tests passing

---
