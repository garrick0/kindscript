# Filesystem Constraints: Current State and Design Options

> **IMPLEMENTED (2026-02-07):** The filesystem constraint system has been implemented. The `colocated` contract was replaced with `filesystem: { exists?, mirrors? }` on the Kind type's third parameter. Implicit existence checking was removed in favor of opt-in `filesystem.exists`. See `docs/design/EXISTENCE_AND_FILESYSTEM_CONSTRAINTS.md` for the full analysis and implementation plan (Option C).
>
> **Previous update:** `ContractConfig<T>` and `defineContracts<T>()` have been removed from KindScript. All constraints are now declared on the Kind type's third parameter (`Kind<N, Members, Constraints>`). References to `ContractConfig` and `defineContracts` in the options below are outdated -- any filesystem constraints would be added to the `Constraints` type (the Kind's 3rd parameter) rather than to a separate `ContractConfig` or `defineContracts` call. The analysis of constraint categories and design tradeoffs remains relevant; only the declaration mechanism has changed.

## 1. What Exists Today

KindScript's current relationship with the filesystem is simple: **a symbol is a directory path, and that's it.** There are exactly two moving parts.

### 1.1 The `location` string

Every Kind requires a `location: string` property (defined in `src/runtime/kind.ts`). When a user declares an instance, each member gets a path:

```typescript
export const app: CleanContext = {
  kind: "CleanContext",
  location: "src",
  domain:         { kind: "DomainLayer",         location: "src/domain" },
  application:    { kind: "ApplicationLayer",     location: "src/application" },
  infrastructure: { kind: "InfrastructureLayer",  location: "src/infrastructure" },
};
```

The classifier (`classify-ast.service.ts`) reads these string literals from the AST and stores them as `ArchSymbol.declaredLocation?: string` — a raw string, not even using the `Location` value object that exists in the domain layer. Locations are always directory paths, never file paths, never globs.

### 1.2 The `colocated` contract

The only filesystem-aware contract. Given two symbols (e.g., `components` and `tests`), it checks that every file basename in the primary directory has a matching basename in the related directory:

```typescript
// check-contracts.service.ts:307-334
const primaryFiles = this.fsPort.readDirectory(primaryLocation, true);
const relatedFiles = new Set(
  this.fsPort.readDirectory(relatedLocation, true)
    .map(f => this.fsPort.basename(f))
);

for (const file of primaryFiles) {
  const basename = this.fsPort.basename(file);
  if (!relatedFiles.has(basename)) {
    diagnostics.push(Diagnostic.notColocated(file, expectedFile, contract));
  }
}
```

This is basename-only matching — `src/components/button.ts` checks for `src/tests/button.ts`. No suffix transforms (e.g., `button.ts` → `button.test.ts`), no pattern matching, no relative position awareness.

### 1.3 What the `Location` value object could do (but doesn't)

`src/domain/value-objects/location.ts` defines a `Location` class with `path`, `isPattern`, and a `matches()` method that supports basic glob-to-regex conversion. But nothing uses it — the entire codebase works with raw strings. The comment "Real implementation would use minimatch" confirms this is a stub.

### 1.4 Summary: what's enforced today

| Constraint | Supported? | How |
|---|---|---|
| Symbol maps to a directory | Yes | `declaredLocation` string |
| Child symbol is inside parent directory | Implicit | Paths are nested strings |
| No overlap between sibling symbols | Yes | `ResolveFilesService` subtracts child files |
| File in dir A has counterpart in dir B | Yes | `colocated` (basename match only) |
| Symbol must contain specific files | No | — |
| Symbol must match a file pattern | No | — |
| Relative position between parent/child | No | Convention only |
| File naming conventions | No | — |
| Directory structure constraints | No | — |
| Exclusion patterns | No | — |

---

## 2. The Full Spectrum of Filesystem Constraints

Here is what a complete filesystem constraint system would need to express, organized by category.

### 2.1 Existence Constraints

**"This symbol must contain..."**

- `hasFile("index.ts")` — a specific file must exist at the symbol's location
- `hasFile("*.port.ts")` — at least one file matching a glob must exist
- `hasFiles(["index.ts", "types.ts"])` — multiple specific files required
- `hasFolder("entities")` — a subdirectory must exist
- `hasFolders(["entities", "value-objects"])` — multiple subdirectories

### 2.2 Naming/Pattern Constraints

**"Files in this symbol must follow..."**

- `filesMatch("*.entity.ts")` — all files must match a pattern
- `filesMatch(["*.entity.ts", "*.vo.ts", "index.ts"])` — files must match one of N patterns
- `noFilesMatch("*.spec.ts")` — no files should match a pattern (e.g., no test files in domain)
- `folderNamesMatch(/^[a-z-]+$/)` — subdirectory naming convention

### 2.3 Relative Position Constraints

**"Members must be at specific positions relative to parent..."**

- `childAt("./entities")` — a child kind's location must be a direct subdirectory
- `childAt("../shared")` — a child can reference sibling paths
- `relativeDepth(1)` — children must be exactly one directory level below parent
- `flatStructure()` — no nested subdirectories allowed inside this symbol

### 2.4 Exclusivity Constraints

**"This symbol must only contain..."**

- `onlyFiles("*.ts")` — only TypeScript files, nothing else
- `onlyFolders()` — no loose files at this level (only subdirectories)
- `onlyFiles()` — no subdirectories (leaf node)
- `noExtraFolders()` — every subdirectory must be claimed by a child symbol
- `noExtraFiles()` — every file must match a declared pattern

### 2.5 Relationship Constraints (beyond colocated)

**"Files across symbols must correspond..."**

- `mirrors("components", "tests", { suffix: ".test" })` — `button.ts` → `button.test.ts`
- `mirrors("ports", "adapters", { suffix: ".adapter", prefix: "" })` — `repository.port.ts` → `repository.adapter.ts`
- `oneToMany("schema", "migrations", { pattern: "{name}.*.ts" })` — each schema file has N migration files

### 2.6 Aggregate/Structural Constraints

- `maxFiles(10)` — cap on file count per symbol
- `maxDepth(3)` — cap on directory nesting depth
- `nonEmpty()` — symbol directory must have at least one file
- `entryPoint("index.ts")` — must have a barrel/entry file

---

## 3. Design Options

### Option A: Extend `ContractConfig` with new contract types

Add new contract types alongside the existing five. Each filesystem constraint becomes a new entry in `defineContracts()`.

**User-facing syntax:**

```typescript
export const contracts = defineContracts<CleanContext>({
  noDependency: [["domain", "infrastructure"]],
  purity: ["domain"],

  // New filesystem contracts
  hasFile: [["domain", "index.ts"]],
  filesMatch: [["domain", "*.entity.ts"]],
  noFilesMatch: [["domain", "*.spec.ts"]],
  hasFolder: [["domain", "entities"], ["domain", "value-objects"]],
  mirrors: [["components", "tests", { suffix: ".test" }]],
  entryPoint: [["domain", "index.ts"], ["application", "index.ts"]],
  onlyFiles: ["domain.entities"],
  nonEmpty: ["domain", "application", "infrastructure"],
});
```

**What changes:**

| Component | Change |
|---|---|
| `ContractType` enum | Add ~10 new variants |
| `ContractConfig` interface | Add new optional arrays for each constraint type |
| `Contract.validate()` | Add validation for new arg shapes |
| `ClassifyASTService` | Extend contract parsing for new shapes (string+object tuples, single-arg-with-options) |
| `CheckContractsService` | Add `checkHasFile()`, `checkFilesMatch()`, etc. methods |
| `Diagnostic` | Add factory methods for each new violation type (70006–70015) |
| `FileSystemPort` | Possibly add glob support |
| `Location` | Either start using it or replace with proper glob matching |

**Pros:**
- Consistent with existing contract system
- All constraints defined in one place (`defineContracts`)
- Type-safe — TypeScript checks the config shape
- No new concepts — just more contract types

**Cons:**
- `ContractConfig` grows large and flat — 15+ optional arrays at the same level
- Parsing complexity in `ClassifyASTService` increases (some constraints have different arg shapes: tuple-pairs, single-strings, objects-with-options)
- No natural grouping — import-based contracts and filesystem contracts are conceptually different categories but live in the same bag
- Harder for stdlib packages to provide filesystem conventions (they'd need to enumerate every constraint)

---

### Option B: Filesystem constraints on the Kind definition (not in contracts)

Move filesystem constraints into the Kind type alias itself. A Kind defines not just *what members exist* but *what their filesystem shape must be*.

**User-facing syntax:**

```typescript
export type DomainLayer = Kind<"DomainLayer", {
  // existing: child kinds as members
  // new: filesystem constraints as special properties
  readonly _files?: {
    match?: string[];          // ["*.entity.ts", "*.vo.ts", "index.ts"]
    exclude?: string[];        // ["*.spec.ts", "*.test.ts"]
    require?: string[];        // ["index.ts"]
    entryPoint?: string;       // "index.ts"
    maxCount?: number;
  };
  readonly _structure?: {
    flat?: boolean;            // no nested subdirectories
    maxDepth?: number;
    requireFolders?: string[]; // ["entities", "value-objects"]
    noExtraFolders?: boolean;  // every subdir must be a declared child symbol
  };
}>;
```

The classifier would read these `_files` and `_structure` properties from the Kind definition and attach them to the symbol. A new check pass would validate them.

**Pros:**
- Constraints travel with the Kind definition — stdlib packages like `@kindscript/clean-architecture` can ship filesystem conventions baked in
- Natural grouping — filesystem shape is part of the Kind's contract, not a separate declaration
- Kind definitions become more descriptive ("a DomainLayer is a directory of `*.entity.ts` files with an `index.ts` entry point")
- Users inheriting a Kind get its filesystem constraints for free

**Cons:**
- Overloads TypeScript interfaces with runtime constraint semantics (the `_files` property isn't a real TypeScript member — it's metadata)
- Awkward syntax — underscore-prefixed properties feel like a workaround
- Harder to override per-instance (what if one instance needs different file patterns?)
- Mixes two concerns: structural typing (what members exist) and behavioral constraints (what the filesystem must look like)

---

### Option C: A `structure` block in `defineContracts` (separate from behavioral contracts)

Add a `structure` section to `defineContracts` that groups all filesystem constraints, keeping them separate from behavioral contracts.

**User-facing syntax:**

```typescript
export const contracts = defineContracts<CleanContext>({
  // Behavioral contracts (existing)
  noDependency: [["domain", "infrastructure"]],
  purity: ["domain"],

  // Filesystem structure constraints (new)
  structure: {
    "domain": {
      require: ["index.ts"],
      match: ["*.entity.ts", "*.vo.ts", "index.ts"],
      exclude: ["*.spec.ts"],
      nonEmpty: true,
    },
    "domain.entities": {
      flat: true,
      match: ["*.entity.ts"],
    },
    "application": {
      require: ["index.ts"],
      requireFolders: ["use-cases", "ports"],
      noExtraFolders: true,
    },
    "infrastructure": {
      require: ["index.ts"],
    },
  },

  // Cross-symbol filesystem relationships (new, replaces colocated)
  mirrors: [
    ["components", "tests", { transform: "{name}.test.ts" }],
    ["ports", "adapters", { transform: "{name}.adapter.ts" }],
  ],
});
```

**What changes:**

| Component | Change |
|---|---|
| `ContractConfig` | Add `structure?: Record<string, StructureConstraint>` and `mirrors?: [...]` |
| `StructureConstraint` | New interface: `{ require?, match?, exclude?, flat?, maxDepth?, nonEmpty?, requireFolders?, noExtraFolders? }` |
| `ClassifyASTService` | Parse `structure` block as object literal keyed by member paths, parse `mirrors` as enriched tuple |
| `CheckContractsService` | New `checkStructure()` method that iterates structure constraints per symbol |
| `Diagnostic` | New factory methods for structure violations (70006–70012) |
| `ContractType` | Possibly one new type (`Structure`) or several fine-grained ones |
| `colocated` contract | Subsumed by `mirrors` with a default `{ transform: "{name}" }` (backwards compat) |

**Pros:**
- Clear separation: behavioral contracts (`noDependency`, `purity`, etc.) vs. structural constraints (`structure`, `mirrors`)
- The `structure` block reads naturally as a per-member filesystem spec
- Member paths (`"domain"`, `"domain.entities"`) reuse existing `findByPath()` resolution
- `mirrors` generalizes `colocated` with a transform pattern — backwards compatible since `colocated` is just `mirrors` with identity transform
- Stdlib packages can ship `structure` blocks that describe conventional filesystem layouts

**Cons:**
- Two different sub-languages in one config: array-based behavioral contracts vs. object-based structure
- `structure` keyed by dotted-path strings loses some type safety (typos in member paths are caught at bind time, not compile time)
- Richer parsing logic needed in classifier for nested object literals with mixed value types

---

### Option D: Constraints as Kind member annotations (type-level metadata)

Use TypeScript's type system to encode constraints directly on Kind member types. This would require new branded/tagged types.

**User-facing syntax:**

```typescript
import { Kind, Files, Structure, EntryPoint } from "kindscript";

export type DomainLayer = Kind<"DomainLayer">;
export type EntitiesFolder = Kind<"EntitiesFolder">;

export type CleanContext = Kind<"CleanContext", {
  domain: DomainLayer & EntryPoint<"index.ts"> & Files<"*.entity.ts" | "*.vo.ts">;
  application: ApplicationLayer & Structure<{ noExtraFolders: true }>;
  infrastructure: InfrastructureLayer;
}>;
```

Where `EntryPoint<F>`, `Files<P>`, `Structure<S>` are phantom/branded types that the classifier reads from the type alias definition or intersection members.

**Pros:**
- Constraints are part of the type — maximum TypeScript integration
- IDE autocompletion and type checking for constraint shapes
- Composable via intersection types
- No new config block needed — the Kind type alias IS the constraint spec

**Cons:**
- Unusual TypeScript — intersection types as constraint carriers is surprising
- Requires the classifier to interpret complex type algebra (intersection, generic args)
- Phantom types can confuse users ("is `Files<P>` a real property?")
- Harder to provide defaults from stdlib (intersection types don't support "default unless overridden")
- Significantly increases AST port complexity

---

## 4. Comparison Matrix

| Criterion | A: More Contract Types | B: Kind Properties | C: Structure Block | D: Type Annotations |
|---|---|---|---|---|
| **Consistency with existing patterns** | High — same `defineContracts` bag | Medium — new concept on Kinds | High — extends `defineContracts` cleanly | Low — new phantom type pattern |
| **Stdlib package support** | OK — packages add more contract entries | Good — Kinds carry their constraints | Good — packages ship structure blocks | Good — types compose via intersection |
| **User ergonomics** | Flat and verbose at scale | Clean per-Kind but awkward `_` syntax | Natural grouping, readable | Elegant but unfamiliar |
| **Classifier complexity** | Medium — more contract shapes to parse | High — parse type alias properties as constraints | Medium — parse one new object block | Very high — interpret type algebra |
| **Override per instance** | Easy — different contract entries | Hard — Kind type alias is fixed | Easy — per-member entries | Hard — types are fixed |
| **Type safety of constraint defs** | Medium — arrays with mixed shapes | Low — `_files` is a runtime bag | Medium — string keys for member paths | High — full TypeScript type checking |
| **Implementation effort** | Small per constraint, linear | Medium refactor of classifier + domain | Medium, one-time structure | Large, fundamental classifier changes |
| **Backwards compatibility** | Full | Full (additive) | Full (`colocated` → `mirrors`) | Full (additive) |

---

## 5. Recommendation

**Option C (structure block in `defineContracts`) is the strongest fit** for KindScript's existing design. Here's why:

1. **It matches the existing pattern.** Users already write `defineContracts<T>({ ... })` — adding a `structure` section is a natural extension, not a new concept.

2. **It separates concerns without splitting the API.** Behavioral contracts and structural constraints are visually distinct but declared in the same place, checked by the same pipeline.

3. **It generalizes `colocated`.** The `mirrors` field with a transform pattern subsumes the existing `colocated` contract, is backwards compatible (identity transform = basename match), and handles the common `*.test.ts` / `*.adapter.ts` patterns that `colocated` can't.

4. **Stdlib packages benefit immediately.** A `@kindscript/clean-architecture` package could ship:
   ```typescript
   export const cleanArchitectureContracts = defineContracts<CleanContext>({
     noDependency: [["domain", "infrastructure"], ...],
     purity: ["domain"],
     structure: {
       "domain":         { nonEmpty: true, exclude: ["*.spec.ts"] },
       "application":    { nonEmpty: true },
       "infrastructure": { nonEmpty: true },
     },
   });
   ```

5. **Incremental implementation.** Each constraint type inside `structure` can be added one at a time: start with `require` and `nonEmpty`, then `match`/`exclude`, then `flat`/`maxDepth`, etc.

### Suggested implementation order

| Phase | Constraints | Reason |
|---|---|---|
| **Phase 1** | `require`, `nonEmpty`, `requireFolders` | Highest value — catch missing entry points and empty layers |
| **Phase 2** | `match`, `exclude` | File naming conventions — second most requested |
| **Phase 3** | `flat`, `maxDepth`, `noExtraFolders`, `noExtraFiles` | Structural shape enforcement |
| **Phase 4** | `mirrors` (replacing `colocated`) | Generalized cross-symbol file correspondence |
| **Phase 5** | `maxCount`, `entryPoint` (as alias for `require` + barrel check) | Nice-to-haves |

### Sketch of `StructureConstraint` interface

```typescript
interface StructureConstraint {
  /** Specific files that must exist at this location */
  require?: string[];

  /** Specific subdirectories that must exist */
  requireFolders?: string[];

  /** All files must match at least one of these globs */
  match?: string[];

  /** No files may match any of these globs */
  exclude?: string[];

  /** Directory must contain at least one file */
  nonEmpty?: boolean;

  /** No nested subdirectories allowed (leaf symbol) */
  flat?: boolean;

  /** Maximum directory nesting depth */
  maxDepth?: number;

  /** Every subdirectory must be claimed by a child symbol */
  noExtraFolders?: boolean;

  /** Every file must match a `match` pattern (requires `match` to be set) */
  noExtraFiles?: boolean;

  /** Maximum number of files allowed */
  maxCount?: number;
}
```

### Sketch of `mirrors` syntax

```typescript
interface MirrorConstraint {
  /** Transform pattern: "{name}" is replaced with the base name (without extension) */
  transform?: string;  // e.g., "{name}.test.ts", "{name}.adapter.ts"
  /** If true, the mirror is bidirectional (both sides must match) */
  bidirectional?: boolean;
}

// In ContractConfig:
mirrors?: [string, string, MirrorConstraint?][];

// Usage:
mirrors: [
  ["components", "tests", { transform: "{name}.test.ts" }],
  ["ports", "adapters", { transform: "{name}.adapter.ts" }],
  ["components", "stories"],  // no transform = basename match (same as colocated)
],
```

---

## 6. What Must Change (for Option C)

### Domain Layer

- **New:** `StructureConstraint` value object (or plain interface if kept simple)
- **New:** `MirrorConstraint` value object
- **Extend:** `ContractType` with `Structure` and `Mirror` (or keep `Colocated` and add `Mirror`)
- **Extend:** `Diagnostic` with factory methods: `missingFile()`, `unexpectedFile()`, `patternViolation()`, `emptySymbol()`, `depthExceeded()`, `extraFolder()`, `missingMirror()`
- **Start using:** `Location` value object with proper glob support (currently dormant)

### Application Layer

- **Extend:** `ClassifyASTService` to parse `structure` and `mirrors` blocks from `defineContracts` call
- **Extend:** `CheckContractsService` with `checkStructure()` and `checkMirrors()` methods
- **FileSystemPort:** Possibly add `glob(pattern, directory)` method, or handle in service layer

### Infrastructure Layer

- **Extend:** `FileSystemAdapter` if glob support is added to the port
- **Extend:** `CLIDiagnosticAdapter` for new diagnostic code formatting

### Runtime

- **Extend:** `ContractConfig` with `structure` and `mirrors` fields

### Tests

- **New fixtures:** directories with intentional structure violations
- **New unit tests:** for each constraint type in `checkStructure()`
- **New integration tests:** end-to-end from `architecture.ts` → violation diagnostics
