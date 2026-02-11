# 9. Drop `.k.ts`, Piggyback on TypeScript Type Checker

Date: 2026-02-08
Status: Done

**Date:** 2026-02-08
**Status:** Done

### Context

KindScript used a `.k.ts` file extension as a convention to identify definition files. The classifier used `fileName.endsWith('.k.ts')` to filter which files to analyze. The AST extraction itself already worked on any TypeScript file.

### Decision

Drop the `.k.ts` extension entirely. Use TypeScript's type checker (`checker.getSymbolAtLocation()` + `getAliasedSymbol()`) to discover Kind definitions and Instance declarations. This makes KindScript invisible — definitions live in regular `.ts` files with no special extension, no config file, and no naming convention.

### Rationale

- The `.k.ts` extension was unfamiliar and made KindScript feel like a separate language
- The AST extraction logic was already extension-agnostic
- TypeScript's type checker already resolves all imports, aliases, and re-exports — piggybacking on it is more robust than string matching
- Dropping `.k.ts` means zero artifacts in a project beyond `import type` statements
- Discovery through the type checker handles aliased imports (`import { Kind as K }`) correctly

### Impact

- All `.k.ts` fixture files renamed to `.ts`
- 4 extension filters removed from source
- `ASTAdapter` rewritten to use type checker for Kind/Instance identification
- ~5 lines of code changed in the core pipeline

---
