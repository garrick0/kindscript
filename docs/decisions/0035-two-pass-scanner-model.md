# 35. Two-Pass Scanner Model

Date: 2026-02-11
Status: Done

## Context

After the TypeKind elimination (D15, D34), the scanner needed to extract `InstanceOf<K>` tagged exports alongside Kind definitions and `satisfies Instance<T>` declarations. But tagged export detection has a data dependency: the scanner must first know which Kind type names correspond to wrapped Kinds (those with `wrapsTypeName` set) before it can recognize `InstanceOf<Decider>` as a tagged export for the `Decider` Kind.

The previous scanner called four independent AST port methods per file (`getKindDefinitions`, `getInstanceDeclarations`, `getTypeKindDefinitions`, `getTypeKindInstances`). With `TypeKind` eliminated, the first two methods cover Kind definitions and instances for both structural and wrapped Kinds. But the third extraction — finding `InstanceOf<K>` annotations — requires the set of known wrapped Kind names, which is only available after processing all files for Kind definitions.

## Decision

Structure the scanner as two sequential passes over the source files:

**Pass 1 — Kind definitions and Instance declarations:**
```
For each source file:
  1. getKindDefinitions(sf, checker) → KindDefinitionView[]
     - Extracts both structural and wrapped Kinds (wrapped detected by wrapsTypeName)
  2. getInstanceDeclarations(sf, checker) → InstanceDeclarationView[]
     - Extracts satisfies Instance<T, Path> declarations
```

**Pass 2 — InstanceOf\<K\> tagged exports:**
```
For each source file:
  3. getTaggedExports(sf, checker) → TaggedExportView[]
     - Extracts exported declarations with InstanceOf<K> type annotations
     - Uses known wrapped Kind names from Pass 1 for validation
```

The `ScanResult` output combines all three extractions:

```typescript
interface ScanResult {
  kindDefs: Map<string, KindDefinitionView>;   // from Pass 1
  instances: ScannedInstance[];                  // from Pass 1
  taggedExports: ScannedTaggedExport[];          // from Pass 2
  errors: string[];
}
```

## Rationale

**Alternatives considered:**

1. **Single pass with deferred validation** — extract everything in one pass, validate tagged exports against Kind definitions afterward. Rejected because the AST adapter needs to know wrapped Kind names during extraction to distinguish `InstanceOf<Decider>` from arbitrary type annotations. Without this context, the adapter would need to extract all typed exports and filter later, which is noisy and couples filtering logic to the scanner.

2. **Three passes (defs, instances, tagged)** — separate Kind definition extraction into its own pass. Rejected because Kind definitions and Instance declarations are independent of each other and can be extracted in the same pass. There's no data dependency between them.

3. **Lazy resolution** — have the AST adapter resolve `InstanceOf` references lazily via the type checker. Rejected because it pushes TypeScript API usage deeper into the extraction layer and makes the data dependency implicit rather than structural.

**Why this approach:**

- **Data dependency is explicit** — Pass 2 depends on Pass 1's output. The two-pass structure makes this ordering visible in the code.
- **Minimal passes** — two passes is the minimum needed given the dependency. Pass 1 extracts everything that's independent; Pass 2 extracts everything that depends on Pass 1.
- **Clean AST port surface** — three methods (`getKindDefinitions`, `getInstanceDeclarations`, `getTaggedExports`) map cleanly to the three extraction concerns. No overloaded or multi-purpose methods.
- **Aligned with TypeScript's compiler** — TypeScript's own scanner/parser uses multiple passes (e.g., pre-processing for reference directives before full parsing). The two-pass model follows this established pattern.

## Impact

- `ScanService.execute()` iterates source files twice: Pass 1 for Kind defs + instances, Pass 2 for tagged exports
- `ASTViewPort` has 3 methods: `getKindDefinitions()`, `getInstanceDeclarations()`, `getTaggedExports()`
- `ScanResult` has 3 data fields: `kindDefs`, `instances`, `taggedExports`
- Removed 4 old methods: `getKindDefinitions` + `getInstanceDeclarations` (kept, same names), `getTypeKindDefinitions` + `getTypeKindInstances` (removed)
- Performance: two iterations over source files instead of one, but AST extraction per file is dominated by TypeScript type-checker calls, not iteration overhead
- 382 tests passing

---
