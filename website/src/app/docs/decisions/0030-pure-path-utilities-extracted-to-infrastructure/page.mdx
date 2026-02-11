# 30. Pure Path Utilities Extracted to Infrastructure

Date: 2026-02-10
Status: Done

**Date:** 2026-02-10
**Status:** Done

### Context

Path operations like `isFileInSymbol`, `joinPath`, `dirnamePath`, and `resolvePath` were scattered across domain entities, adapters, and service classes. Some were in `domain/utils/path-matching.ts`, others inline in parser logic. They had no runtime dependencies (pure string manipulation), but they dealt with filesystem path semantics.

With the introduction of explicit `Instance<T, Path>` (D24), the parser needed more sophisticated path resolution — resolving relative paths like `'./ordering'` and `'./handlers.ts'` against the declaration file's directory.

### Decision

Extract all pure path operations into `infrastructure/path/path-utils.ts`. Implement them using only string manipulation (no Node.js `path` module). Expose 6 functions:

```typescript
export function isFileInSymbol(file: string, symbolRoot: string): boolean;
export function joinPath(base: string, relative: string): string;
export function dirnamePath(file: string): string;
export function resolvePath(from: string, to: string): string;
export function relativePath(from: string, to: string): string;
export function normalizePathSeparators(path: string): string;
```

Functions use forward slashes internally and normalize separators on input/output.

### Rationale

**Layer placement:**

Domain layer requires purity (zero dependencies, no external concepts). While these functions are pure (no Node.js dependencies), they encode filesystem path semantics — a platform/infrastructure concern. Placing them in infrastructure acknowledges that path manipulation is a technical detail, not a domain concept.

**No Node.js `path` module:**

Node's `path` module has platform-specific behavior (`path.sep`, `path.win32` vs `path.posix`). Using it would introduce platform variance in domain/application logic. Pure string manipulation with forward slash normalization ensures consistent behavior across platforms and makes the functions trivially testable without mocking Node.js modules.

**Alternative considered:**

Keep in domain layer as pure utilities. Rejected because path semantics are not architecture-agnostic — they're specific to how filesystems work, which is an infrastructure detail.

### Impact

- Created `infrastructure/path/path-utils.ts` with 6 exported functions
- Moved `isFileInSymbol` from `domain/utils/path-matching.ts`
- Removed inline path manipulation from `ParseService` and adapters
- Added 12 tests in `infrastructure/path-utils.test.ts`
- All services import from `infrastructure/path/path-utils`
- 298 tests passing after extraction

---
