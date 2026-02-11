# 28. Container Resolution as Separate Binder Concern

Date: 2026-02-11
Status: Done

**Date:** 2026-02-11
**Status:** Done

### Context

The binder resolves instance locations to files (`resolvedFiles: Map<symbolId, string[]>`) for dependency checking — these are the files "owned" by each member. The exhaustiveness plugin (D21) needs to detect unassigned files — files within an instance's scope that aren't assigned to any member.

Computing "all files in scope" is a resolution problem (filesystem enumeration + filtering), not a checking problem (graph analysis). However, putting it in the checker would duplicate resolution logic and violate D16 (resolution moves from parser to binder).

### Decision

Add `containerFiles` as a second resolution output in the binder, alongside `resolvedFiles`:

- **resolvedFiles** — maps each member to files it owns (used for dependency checking)
- **containerFiles** — maps each instance root to ALL files within its scope (used for exhaustiveness checking)

The binder computes `containerFiles` in a separate `resolveContainers()` pass after member resolution:

1. For each instance in the program
2. Resolve its location path to filesystem scope (directory or file)
3. Use `FileSystemPort.readDirectory()` to enumerate all files within that scope
4. Store as `containerFiles.set(instance.id, allFiles)`

The checker receives both maps via `CheckerRequest` and passes them to plugins. The exhaustiveness plugin computes unassigned files as `containerFiles[instance] - union(resolvedFiles[member] for all members)`.

### Rationale

**Alternatives considered:**

1. **Compute in exhaustiveness plugin** — checker calls `readDirectory()` directly. Rejected: violates D16; checker should operate on resolved data, not perform I/O.

2. **Merge into resolvedFiles** — add synthetic "container" keys. Rejected: conflates two different concepts (member ownership vs. total scope); would complicate other plugins.

3. **Derive from resolvedFiles at check time** — compute union of member files. Rejected: doesn't work if members use file-level instances (only 1 file per member, but container has many files).

**Why separate resolution:**

- **Binder owns resolution** — consistent with D16; the binder is the single authority for "which files are where"
- **Different semantics** — resolvedFiles is about member ownership (used by noDependency, purity, noCycles); containerFiles is about total scope (used only by exhaustiveness)
- **Clear separation** — checker receives pre-resolved data, focuses on analysis
- **Testable** — binder tests verify both resolution outputs; checker tests can mock both

### Impact

- `BindResult` gains `containerFiles: Map<string, string[]>` field
- `BindService.bind()` calls `resolveContainers()` after member resolution
- `CheckerRequest` constructor takes `containerFiles` parameter
- `CheckerService` passes `containerFiles` to plugin `check()` calls
- `exhaustivenessPlugin.check()` uses containerFiles to find unassigned files
- 2 new tests in `bind.service.test.ts` verify container resolution
- 343 tests passing, no changes to existing plugins

---
