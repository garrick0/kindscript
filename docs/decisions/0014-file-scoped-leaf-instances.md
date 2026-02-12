# 14. File-Scoped Leaf Instances

Date: 2026-02-08
Status: Superseded by D24

**Date:** 2026-02-08
**Status:** Superseded by [D24](0024-instancet-path-explicit-location-replaces-convention-based-derivation.md)

> **Note:** This decision was superseded by D24, which replaced convention-based scope derivation (leaf vs composite) with explicit `Instance<T, Path>` location declarations. The heuristic described below is no longer used — users now declare locations explicitly.

### Context

KindScript's parser unconditionally derived instance locations from the parent directory of the declaring file (`dirnamePath(sourceFileName)`). This meant a `satisfies Instance<AtomSource>` declaration in `Button.tsx` was interpreted as "everything in Button.tsx's directory is an AtomSource" — not "Button.tsx is an AtomSource."

This prevented file-level architectural enforcement. In a design system where `Button.tsx`, `Button.stories.tsx`, and `Button.test.tsx` are colocated in the same directory, you couldn't constrain the source file differently from stories or tests.

### Industry Research

Surveyed 12 systems (Go, Rust, Bazel, Java JPMS, Python, C#, ArchUnit, eslint-plugin-boundaries, dependency-cruiser, Nx, Node.js exports, TypeScript project references). Key findings:

1. **Every directory-scoped system eventually needs file-level escape hatches.** Go added `_test.go`. Bazel has per-file targets. ArchUnit has `SliceAssignment`.
2. **The industry trend is toward file-level as default.** Node.js deprecated directory-level exports. dependency-cruiser and eslint-boundaries default to file scope.
3. **Systems with one clear default + minimal exceptions (Go) succeed.** Systems supporting both equally (Rust) create ongoing confusion.

Full research in `.working/FILE_VS_DIRECTORY_SCOPE_RESEARCH.md`.

### Decision

Use the presence of members as the structural indicator for scope:

- **Leaf Kind** (no members): instance location = the declaring file itself
- **Composite Kind** (has members): instance location = parent directory of the declaring file

### Rationale

- **Members structurally require directories** — they map to subdirectories, so directory scope is justified by necessity
- **Leaf instances describe themselves** — a file declaring `satisfies Instance<AtomSource>` with no members is naturally saying "I am an AtomSource"
- **Follows Go's playbook** — one clear default (file), structural escape (members create directory scope)
- **No new API types or syntax** — the rule is purely structural
- **Backwards compatible** — all existing instances use composite Kinds with members; no behavior changes for them

### Impact

- `parse.service.ts`: root derivation now conditional on `kindDef.members.length > 0`
- `resolveSymbolFiles`: handles file locations (single-file resolution) alongside directories
- `FileSystemPort`: added `fileExists(path): boolean`
- `FileSystemAdapter` + `MockFileSystemAdapter`: implement `fileExists`
- 5 new tests in `classify-ast-locate.test.ts`
- 284 tests, 29 files, 100% passing
- No existing test changes required

---
