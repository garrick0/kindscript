# 32. DeclarationOwnership for TypeKind Member Attribution

Date: 2026-02-11
Status: Done

**Date:** 2026-02-11
**Status:** Done

### Context

With TypeKind instances, multiple typed exports can coexist in the same source file, each belonging to different architectural units. For example, a file might contain both a `DeciderFn` (pure logic) and a `CommandHandler` (application layer), classified by their type annotations rather than their file location.

When the `noDependencyPlugin` detects cross-file imports between TypeKind members, it needs to handle the case where both members share the same file. In such cases, checking file-level imports is insufficient — the plugin needs declaration-level granularity to determine if a specific function/class in the file depends on another specific function/class that belongs to a different architectural unit.

### Decision

Introduce `declarationOwnership` as a new binder output — a nested map structure `Map<file, Map<declarationName, symbolId>>` that records which TypeKind member "owns" each top-level declaration within a file.

The binder populates this map during TypeKind resolution by:
1. Reading typed exports from each TypeKind member's resolved files
2. Extracting the declaration name (function/class/variable name)
3. Mapping `file → declarationName → symbolId` (the TypeKind member's ArchSymbol.id)

The checker passes `declarationOwnership` to contract plugins via `CheckerRequest`, alongside `containerFiles` and existing import graph data.

### Rationale

**Alternatives considered:**

1. **File-level checking only** — would fail to detect forbidden references between TypeKind members in the same file
2. **Compute ownership in checker** — violates separation of concerns; the binder is already the authority for name resolution
3. **Store ownership on ArchSymbol** — would couple domain entities to TypeScript-specific file analysis

**Why this approach:**

- **Binder is resolution authority** — consistent with D16 (resolution moves from parser to binder); the binder resolves all names, so it's natural for it to record declaration ownership
- **Enables declaration-level noDependency** — essential for D22 (intra-file dependency checking); without ownership data, the plugin cannot attribute declarations to members
- **Testable in isolation** — binder tests verify ownership maps are built correctly; checker tests can use mock ownership data
- **Clean separation** — binder does resolution (what belongs where), checker does analysis (what depends on what)

### Impact

- `BindResult` gains `declarationOwnership: Map<string, Map<string, string>>` field
- `BindService.resolveTypeKindMembers()` now calls `extractDeclarationOwnership()` for each resolved file
- `CheckerRequest` constructor takes `declarationOwnership` parameter
- `CheckerService` passes `declarationOwnership` through to plugin `check()` calls
- `noDependencyPlugin.check()` uses ownership map to filter intra-file edges (see D22)
- 3 new tests in `bind.service.test.ts` verify ownership extraction
- 343 tests passing, no behavioral changes to existing file-level checking

---
