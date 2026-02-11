# 22. Intra-File Dependency Checking for TypeKind Members

Date: 2026-02-11
Status: Done

**Date:** 2026-02-11
**Status:** Done

### Context

The `noDependencyPlugin` checks that members of one Kind don't import from members of another Kind. It works by:
1. Getting the import graph (file-level: `ImportEdge[]`)
2. For each contract `noDependency(from, to)`, checking if any file in `from` imports any file in `to`

This works well when architectural units are directories or files. However, with TypeKind (D15), architectural units can be typed exports within a single file. For example:

```typescript
// handlers.ts
export const validateOrder: DeciderFn = (...) => {...};  // Pure logic
export const handleOrder: CommandHandler = (...) => {...};  // Application layer
```

If a Kind declares `noDependency(['Decider', 'CommandHandler'])`, the plugin should detect if `handleOrder` references `validateOrder` (or vice versa) — even though both are in the same file.

File-level import checking can't handle this. The plugin needs **declaration-level granularity** to attribute references to the correct TypeKind member.

### Decision

Extend `noDependencyPlugin` to check intra-file references when source and target files are the same:

1. Add `getIntraFileReferences()` to `CodeAnalysisPort`:
   ```typescript
   getIntraFileReferences(sourceFile: SourceFile): IntraFileEdge[];
   ```
   Returns edges between top-level declarations in the same file (e.g., `handleOrder` → `validateOrder`).

2. Create `IntraFileEdge` value object:
   ```typescript
   class IntraFileEdge {
     constructor(
       public readonly fromDeclaration: string,
       public readonly toDeclaration: string,
       public readonly line: number,
       public readonly column: number
     ) {}
   }
   ```

3. Use `declarationOwnership` (D32) to map declarations to members:
   ```typescript
   const fromMember = declarationOwnership.get(file)?.get(edge.fromDeclaration);
   const toMember = declarationOwnership.get(file)?.get(edge.toDeclaration);
   if (fromMember === sourceId && toMember === targetId) {
     // Violation: declaration in source member references declaration in target member
   }
   ```

4. In `noDependencyPlugin.check()`:
   - First, check file-level imports (existing logic)
   - Then, for each shared file, check intra-file edges

### Rationale

**Why extend noDependency:**

Intra-file checking is a natural extension of the same constraint — "members shouldn't depend on each other." The plugin already handles cross-file dependencies; adding intra-file dependencies keeps the logic centralized.

**Why declaration-level:**

TypeKind members are defined by their type annotations, not their file locations. To attribute dependencies correctly, the checker needs to know which declarations belong to which members. File-level checking would report false positives (all TypeKind members in a file would appear to depend on each other).

**Why IntraFileEdge:**

Separate from `ImportEdge` because:
- Different structure (declaration names, not file paths)
- Different source (TypeScript's call graph analysis, not import statement parsing)
- Different semantics (usage reference, not import declaration)

**Alternative considered:**

Create a unified `DependencyEdge` type with variants. Rejected: would complicate the import graph logic and conflate two different concepts (imports vs. references).

### Impact

- `CodeAnalysisPort` gains `getIntraFileReferences()` method
- `TypeScriptAdapter` implements intra-file reference extraction using type checker call graph
- Created `src/application/pipeline/check/intra-file-edge.ts`
- `noDependencyPlugin.check()` adds intra-file checking loop (27 new lines)
- `CheckerRequest` passes `declarationOwnership` to plugins (prerequisite: D32)
- 8 new tests in `no-dependency.plugin.test.ts` for intra-file violations
- 2 new integration tests for TypeKind with shared files
- 343 tests passing

---
