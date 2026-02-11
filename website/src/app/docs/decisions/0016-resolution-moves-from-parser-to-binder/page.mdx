# 16. Resolution Moves from Parser to Binder

Date: 2026-02-10
Status: Done

**Date:** 2026-02-10
**Status:** Done

### Context

The parser (`ParseService`) had two responsibilities: building ArchSymbol trees from scan output (structural) and resolving those symbols to actual files on disk (I/O). This meant the parser depended on `FileSystemPort`, which violated its role as a structural transformation stage. It also meant resolution logic was split between parser (filesystem resolution) and binder (TypeKind declaration resolution), making the data flow harder to follow.

### Decision

Move all name resolution from the parser to the binder. The parser becomes purely structural (no I/O dependencies). The binder performs unified resolution using a three-strategy approach:

1. **TypeKind declaration resolution** — scan for typed exports within the parent scope
2. **Folder resolution** — `readDirectory()` on the derived path
3. **File resolution** — single file check

### Rationale

- **Parser purity** — the parser is now a pure function from scan output to ArchSymbol trees, with zero I/O
- **Unified resolution** — all three resolution strategies live in one place (the binder), making the data flow clear
- **Aligned with TypeScript's model** — TypeScript's binder is where names are resolved to declarations
- **Single source of `resolvedFiles`** — `BindResult.resolvedFiles` is the one authoritative map; `ParseResult` no longer carries it

### Impact

- `ParseService`: constructor takes zero arguments (was `FileSystemPort`); removed `resolveSymbolFiles()` and `resolveTypeKindFiles()`
- `ParseResult`: removed `resolvedFiles` field
- `BindService`: constructor takes `(plugins, fsPort)`; new `resolveMembers()` method
- `BindResult`: now includes `resolvedFiles: Map<string, string[]>`
- `PipelineService`: uses `bindResult.resolvedFiles` directly (no merge)
- `engine-factory.ts`: `new ParseService()` (no args), `new BindService(plugins, fs)`
- All 263 tests passing, 5 test files updated for new constructors

---
