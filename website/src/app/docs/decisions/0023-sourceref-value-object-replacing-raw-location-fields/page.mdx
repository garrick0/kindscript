# 23. SourceRef Value Object Replacing Raw Location Fields

Date: 2026-02-10
Status: Done

**Date:** 2026-02-10
**Status:** Done

### Context

Entities like `Diagnostic`, `Contract`, and `ArchSymbol` tracked source locations using raw `file`, `line`, and `column` fields. This created problems:

1. **Structural duplication** — every entity repeated `file: string; line: number; column: number`
2. **Inconsistent nullability** — some entities had `file?: string`, others `file: string`, depending on context
3. **Two location types conflated** — some diagnostics pointed to specific file locations (e.g., "violation at src/domain/service.ts:15:8"), while others described project-wide issues (e.g., "cycle detected: domain → infra → domain"). The raw fields couldn't distinguish between these.

### Decision

Introduce `SourceRef` as a domain value object with two factory methods:

```typescript
class SourceRef {
  static at(file: string, line: number, column: number): SourceRef;
  static structural(scope?: string): SourceRef;

  get file(): string | undefined;
  get line(): number | undefined;
  get column(): number | undefined;
  get scope(): string | undefined;
}
```

**Two location types:**

- **File-scoped** — `SourceRef.at(file, line, column)` for violations at specific code positions
- **Structural** — `SourceRef.structural(scope?)` for project-wide or scope-wide violations (no file pointer)

All entities now have `source: SourceRef` instead of raw fields. The `Diagnostic` constructor takes `SourceRef` directly:

```typescript
new Diagnostic(
  'Forbidden dependency: domain → infrastructure',
  DiagnosticCode.ForbiddenDependency,
  SourceRef.structural('domain'),
  relatedContract
);
```

### Rationale

**Why a value object:**

- **Single responsibility** — encapsulates location logic (file-scoped vs. structural, nullability rules)
- **Type safety** — distinguishes between two location semantics at the type level
- **Consistency** — all entities use the same location representation

**Why two factory methods:**

- **Clarity** — `SourceRef.at(...)` vs `SourceRef.structural(...)` makes intent explicit in calling code
- **Validation** — factory methods enforce invariants (file-scoped requires all three fields; structural requires none)

**Why remove backward-compat getters:**

Initially added `Diagnostic.file`, `.line`, `.column` getters delegating to `.source.*` for backward compatibility. Removed in commit `209c6f5` to force consumers to use `.source.*` directly. This two-phase approach (add SourceRef → remove getters) prevented a massive one-shot refactor while still achieving a clean final API.

**Alternative considered:**

Union type `Location = FileLocation | StructuralLocation`. Rejected: adds boilerplate (`if ('file' in location)` checks everywhere); value object encapsulates this.

### Impact

- Created `src/domain/value-objects/source-ref.ts`
- `Diagnostic` constructor changed from `(message, code, file, line, column, scope?, related?)` to `(message, code, source, related?)`
- All diagnostic creation sites updated to use `SourceRef.at()` or `SourceRef.structural()`
- Backward-compat getters added in commit `f6d4dc5`, removed in `209c6f5`
- All apps and adapters updated to access `.source.file`, `.source.line`, `.source.column`
- 15 tests updated for new constructor signature
- 298 tests passing after SourceRef introduction, 343 passing after getter removal

---
