# 24. Instance\<T, Path\> — Explicit Location Replaces Convention-Based Derivation

Date: 2026-02-10
Status: Done

**Date:** 2026-02-10
**Status:** Done
**Supersedes:** D14

### Context

Previously, instance locations were derived from the declaring file's position and the Kind's structure:
- **Leaf Kinds** (no members) — instance location = declaring file itself (D14)
- **Composite Kinds** (with members) — instance location = parent directory of declaring file

This convention had problems:

1. **Implicit and surprising** — `satisfies Instance<MyKind>` in `src/foo/context.ts` meant "everything in src/foo/" (not obvious from reading the code)
2. **Limited expressiveness** — couldn't declare instances in sibling directories, parent directories, or arbitrary paths
3. **Heuristic brittleness** — the presence/absence of members determined location behavior (a structural detail affecting semantic meaning)
4. **Blocked multi-instance** — couldn't have multiple instances of the same Kind in different directories without moving definition files around

### Decision

Change `Instance<T>` to `Instance<T, Path>` where `Path` is a required string literal type parameter specifying the instance's location **relative to the declaring file's directory**.

**Path syntax:**

- **Current directory:** `'.'` — instance is the directory containing the declaring file
- **Relative folder:** `'./ordering'` — instance is a subdirectory
- **Relative file:** `'./helpers.ts'` — instance is a single file
- **Sub-file scope:** `'./handlers.ts#validate'` — instance is a specific declaration within a file (enables declaration-level architectural boundaries)

The parser resolves paths at bind time using `resolvePath(declaringFileDir, relativePath)`.

**Examples:**

```typescript
// src/context.ts
export const shopContext = {
  ordering: {} satisfies Instance<Microservice, './ordering'>,
  billing: {} satisfies Instance<Microservice, './billing'>,
} satisfies Instance<System, '.'>;

// src/ordering/ordering.ts
export const decider = () => {...} satisfies Instance<Decider, './ordering.ts#decider'>;
```

### Rationale

**Why explicit paths:**

- **Readability** — location is obvious from reading the code, no mental model of heuristics required
- **Flexibility** — supports sibling instances, parent-relative paths, explicit file/folder choice
- **Sub-file scope** — enables TypeKind-style boundaries within a single file (declaration-level)
- **Multi-instance** — same Kind can be instantiated multiple times with different paths from same definition file

**Why relative paths:**

- **Portability** — projects can be moved/renamed without breaking instance declarations
- **Locality** — paths are relative to the declaring file, which is visible in the same file
- **Natural fit** — matches how developers think about project structure ("the ordering directory")

**Alternative considered:**

Keep convention-based derivation, add explicit path override. Rejected: creates two ways to do the same thing, implicit rule still surprising for newcomers.

**Trade-offs:**

- **Verbosity** — `Instance<T, '.'>` is longer than `Instance<T>`. Accepted: explicitness over conciseness.
- **Type-level requirement** — Path must be a string literal type. Accepted: compile-time validation is a feature.

### Impact

- Public API: `Instance<T>` → `Instance<T, Path extends string>`
- `InstanceDeclarationView` gains `path: string` field (extracted by AST adapter)
- `ParseService` uses explicit path instead of deriving from members/file location
- D14's structural derivation rule (members → directory scope) no longer applies
- 22 integration fixtures updated to use explicit paths
- `'.'` is the most common path (replaces the old "parent directory" default)
- `'./subdir'` used for multi-instance scenarios
- `'./file.ts#name'` used for sub-file TypeKind instances
- 298 tests passing after migration

### Supersession of D14

D14 (file-scoped leaf instances) established that Kinds without members should default to file-level scope. With explicit paths, this heuristic is no longer needed — users write `Instance<T, './file.ts'>` when they want file scope. D14's research on directory vs. file scope remains valid (informed the path syntax design), but the decision's implementation is superseded by explicit paths.

---
