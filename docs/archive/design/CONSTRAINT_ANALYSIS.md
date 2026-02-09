# Constraint Analysis

> Deep analysis of every constraint type in KindScript: how they work, issues found, and options for improvement.

> **PARTIALLY OUTDATED (2026-02-07):** The `colocated` constraint and implicit existence check described in this document have been replaced by the unified `filesystem: { exists?, mirrors? }` constraint. See `EXISTENCE_AND_FILESYSTEM_CONSTRAINTS.md` for the design analysis and implementation details. The analysis of `noDependency`, `mustImplement`, `purity`, and `noCycles` remains current.

**Date:** 2026-02-07

---

## Overview

KindScript has **5 explicit constraint types** and **1 implicit check**. They are declared via `ConstraintConfig<Members>` — the third type parameter of `Kind<N, Members, Constraints>`.

```typescript
type ConstraintConfig<Members> = {
  pure?: true;
  noDependency?: ReadonlyArray<readonly [keyof Members & string, keyof Members & string]>;
  mustImplement?: ReadonlyArray<readonly [keyof Members & string, keyof Members & string]>;
  noCycles?: ReadonlyArray<keyof Members & string>;
  colocated?: ReadonlyArray<readonly [keyof Members & string, keyof Members & string]>;
};
```

The constraints fall into three shapes:

| Shape | Constraints | Declaration Form |
|---|---|---|
| Intrinsic (applies to the kind itself) | `pure` | `pure: true` |
| Relational tuple-pair (between two members) | `noDependency`, `mustImplement`, `colocated` | `[["from", "to"]]` |
| Collective list (across a group) | `noCycles` | `["member1", "member2"]` |

Plus one implicit check: **existence** (derived member directories must exist on disk).

---

## Constraint 1: `noDependency`

### What It Does

Forbids any file in member A from importing any file in member B. This enforces dependency direction — the core mechanism for Clean Architecture, Hexagonal, Onion, etc.

```typescript
type CleanContext = Kind<"CleanContext", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [["domain", "infrastructure"]];
}>;
```

### How It Works

1. Resolves all files recursively in the `from` member's directory
2. Resolves all files recursively in the `to` member's directory (into a `Set`)
3. For each file in `from`, uses the TypeScript type checker to resolve all imports
4. For each resolved import, checks if the target file is in the `to` member's directory using `isFileInSymbol()` (boundary-safe `/` prefix matching)
5. Produces a `Diagnostic.forbiddenDependency` (code 70001) with exact file/line/column

### Issues Found

**1. Type-only imports are treated the same as value imports.**
`import type { Foo } from '../infrastructure/repo'` triggers a violation even though it has no runtime effect. In TypeScript's own model, type-only imports are erased at compile time. For many architectural patterns (especially ports-and-adapters), importing a *type* from another layer is not a real dependency — it's the value/side-effect dependency that matters.

**Options:**
- (a) Ignore type-only imports entirely (matches TS semantics, but too permissive for some users)
- (b) Add a `typeImportsAllowed?: boolean` flag to `noDependency` tuples so users can opt in
- (c) Add a separate `noRuntimeDependency` constraint that ignores type-only imports, keeping `noDependency` strict

**2. Re-exports (barrel files) are only detected at the resolved target level.**
If `infrastructure/index.ts` re-exports from `infrastructure/db.ts`, an import of `infrastructure/index.ts` from domain will be flagged, but only because the resolved target (`infrastructure/index.ts`) is in the `to` directory. The import chain is not traced — if the barrel file lived *outside* the `to` directory but re-exported from inside it, the violation would be missed.

**Options:**
- (a) Accept this as a known limitation (reasonable, since barrel files typically live within their module)
- (b) Trace re-export chains to detect indirect dependency (expensive, complex)

**3. Dynamic imports (`import()` expressions) are not checked.**
Only static `import` declarations are processed. A `const m = await import('../infrastructure/db')` in domain would not be caught.

**Options:**
- (a) Extend `getImports()` to also resolve dynamic `import()` expressions
- (b) Document as a known limitation

**4. `require()` calls are not checked.**
Same as above but for CommonJS-style requires.

### Strengths

- Boundary-safe path matching prevents false positives (e.g., `src/domain` does not match `src/domain-extensions`)
- Reports exact file, line, and column of the offending import
- Well-tested: 10 unit tests including edge cases for path prefix collisions, absolute paths, empty directories, orphan files

---

## Constraint 2: `pure`

### What It Does

Declares that a kind must be "pure" — no imports of Node.js built-in modules allowed. This ensures the domain layer has zero platform dependencies.

```typescript
type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;
```

### How It Works

1. `pure: true` is an *intrinsic* constraint — it's declared on the Kind itself (in this case one with no members, but any Kind can carry intrinsic constraints)
2. When a Kind is used as a member of another Kind and carries `pure: true`, a `Purity` contract is **automatically propagated** to that member
3. At check time, all files in the symbol's directory are scanned for import module specifiers
4. Each specifier is looked up in the `NODE_BUILTINS` set (58 entries: 27 bare names + `node:` prefixes + `/promises` subpaths)
5. Any match produces a `Diagnostic.impureImport` (code 70003) with file/line/column

### Issues Found

**1. Purity only checks Node.js builtins — not arbitrary "impure" packages.**
A domain layer importing `axios`, `pg`, or `@aws-sdk/client-s3` passes the purity check even though these are clearly I/O-bound, impure dependencies. The `NODE_BUILTINS` set is hard-coded.

**Options:**
- (a) Allow users to extend the impure module list via config: `pure: { forbid: ["axios", "pg"] }` or a separate `forbidImports` constraint
- (b) Combine purity with `noDependency` so users can block specific npm packages
- (c) Invert the check: instead of a blocklist, use an allowlist — `pure: { allow: ["lodash"] }` means only `lodash` and relative imports are permitted
- (d) Keep current behavior as "purity = no platform coupling", add a separate `noExternalDependency` constraint for npm packages

**2. Missing some newer Node.js builtins.**
The list is missing `node:test`, `node:diagnostics_channel`, `node:timers`, `node:timers/promises`, `node:events`, `node:buffer`, `node:querystring`, `node:string_decoder`, `node:punycode`, `node:constants`, `node:console`, `node:module`, `node:wasi`. While some are obscure, `node:test`, `node:timers`, and `node:events` are common.

**Options:**
- (a) Update the `NODE_BUILTINS` set with all current Node.js builtins
- (b) Instead of a static list, use Node.js's `module.builtinModules` at runtime (but this would break domain purity since the domain layer itself can't import Node.js APIs)
- (c) Move the builtins list to the infrastructure layer and inject it via a port

**3. `process` is in the builtins list but `process.env` access via the global `process` object (without an import) is not detected.**
A file can read `process.env.DATABASE_URL` without any import statement and the purity check won't catch it.

**Options:**
- (a) Add AST-level checking for global variable access (complex, scope analysis needed)
- (b) Accept this as a known limitation — purity checks imports, not global access
- (c) Document the limitation clearly

**4. Dynamic `require()` and `import()` calls bypass purity checking.**
Same limitation as `noDependency`.

**5. Third-party packages that wrap Node.js builtins are not detected.**
Importing `fs-extra` (which wraps `fs`) passes purity even though it introduces the same platform coupling.

### Strengths

- Constraint propagation is elegant — declaring `pure: true` on a Kind automatically applies wherever that Kind is used as a member
- Deduplication prevents double-reporting when purity is both explicitly declared and propagated
- Well-tested: 8 unit tests covering bare, `node:` prefix, and `/promises` subpath variants

---

## Constraint 3: `mustImplement`

### What It Does

Ensures that every exported interface in member A has a class implementing it in member B. This enforces the ports-and-adapters pattern.

```typescript
type AppContext = Kind<"AppContext", {
  ports: PortsLayer;
  adapters: AdaptersLayer;
}, {
  mustImplement: [["ports", "adapters"]];
}>;
```

### How It Works

1. Reads all files in the `ports` member's directory
2. Extracts all exported interface names from port files via `tsPort.getExportedInterfaceNames()`
3. Reads all files in the `adapters` member's directory
4. For each interface name, scans all adapter files for a class implementing it via `tsPort.hasClassImplementing()`
5. If no adapter class implements the interface, emits `Diagnostic.missingImplementation` (code 70002)

### Issues Found

**1. Only checks exported `interface` declarations — not abstract classes or type aliases.**
If a port is declared as `export abstract class RepositoryPort { ... }`, it won't be detected as a port requiring implementation.

**Options:**
- (a) Extend to also check exported abstract classes
- (b) Document that ports must be `interface` declarations
- (c) Add a `portPattern` config option that lets users define what constitutes a port

**2. Implementation detection relies on the TypeScript `implements` clause.**
If an adapter class structurally satisfies the interface but doesn't use `implements RepositoryPort`, it won't be detected. This is a trade-off: structural typing (TypeScript's default) vs nominal/declared typing.

**Options:**
- (a) Keep requiring explicit `implements` (clearer intent, current behavior)
- (b) Add structural compatibility checking via the type checker (complex, potentially slow)
- (c) Offer both modes via config

**3. No diagnostic location information for missing implementations.**
The `Diagnostic.missingImplementation` factory sets `line: 0, column: 0` and uses the contract's `location` (the Kind type name) as the file. This means the IDE can't navigate to the specific port that's missing its adapter.

**Options:**
- (a) Use the port interface's file location as the diagnostic's file/line/column
- (b) Create the diagnostic pointing to the `.k.ts` definition file

**4. Name-based matching only — no cross-module type identity.**
The check only compares interface names as strings (`hasClassImplementing(program, sourceFile, "RepositoryPort")`). If two different ports share the same interface name in different files, this could produce false positives or miss violations.

**Options:**
- (a) Use TypeScript's symbol identity instead of name matching
- (b) Accept this as a practical limitation (unlikely to have same-named interfaces in a ports directory)

**5. Colocated adapters are not checked.**
If the adapter for `RepositoryPort` exists but is in a completely different directory (not under the `adapters` member), it won't be found.

**Options:**
- (a) This is by design — the whole point is to enforce location. Not really an issue.

### Strengths

- Straightforward and easy to understand
- Handles multiple interfaces per port file
- Handles empty adapter directories gracefully
- 7 unit tests with good edge case coverage

---

## Constraint 4: `noCycles`

### What It Does

Forbids circular dependencies among a listed set of members. Unlike `noDependency` which is directional (A cannot import B), `noCycles` is collective (no circular path among any of the listed members).

```typescript
type AppContext = Kind<"AppContext", {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}, {
  noCycles: ["domain", "application", "infrastructure"];
}>;
```

### How It Works

1. For each member in the list, resolves all files recursively
2. Builds a directed graph where nodes are member names and edges represent "member A imports from member B"
3. Runs DFS-based cycle detection via `findCycles()`
4. For each detected cycle, emits `Diagnostic.circularDependency` (code 70004)

### Issues Found

**1. The cycle detection algorithm may report duplicate or overlapping cycles.**
The DFS-based `findCycles()` iterates all nodes as starting points. If a cycle `A → B → C → A` exists, the DFS might find it starting from `A`, then also from `B` (as `B → C → A → B`), and from `C`. No deduplication is performed.

```typescript
// findCycles() — each node is a DFS root
for (const node of edges.keys()) {
  dfs(node, []);
}
```

A cycle detected from different starting points would be reported as separate diagnostics — e.g., `A → B → C → A` and `B → C → A → B` are the same cycle but reported twice.

**Options:**
- (a) Normalize cycles before deduplication (rotate to start with lexicographically smallest node, then deduplicate)
- (b) Only report cycles found from the first DFS entry point (fragile, order-dependent)
- (c) Use Tarjan's SCC algorithm instead, which naturally finds each cycle exactly once

**2. The diagnostic has poor location information.**
`Diagnostic.circularDependency` sets `file` to `cycle[0]` (the first member's *name*, not a file path), with `line: 0, column: 0`. This means the diagnostic file is something like `"domain"` rather than an actual file path.

**Options:**
- (a) Point the diagnostic to the `.k.ts` definition file
- (b) Point to the first import that forms the cycle (would require tracking which files/imports created each edge)
- (c) Include the cycle's file-level import chain in the diagnostic message

**3. No distinction between single-file and cross-file cycles.**
Cycles within a single member are not detected (the algorithm skips self-edges: `if (targetSym.name === sym.name) continue`). Only cross-member cycles are caught. This is by design but worth noting.

**4. noCycles with a single member (`noCycles: ["domain"]`) validates but does nothing useful.**
The `Contract.validate()` allows `args.length >= 1`, but with only one member the cycle check is a no-op since self-edges are skipped. This should arguably require at least 2 members.

**Options:**
- (a) Change validation to require `args.length >= 2`
- (b) With 1 member, check for internal cycles (files within the member importing each other circularly)
- (c) Accept as harmless (a no-op is not a bug)

**5. Performance concern with many members.**
The algorithm is O(M * F * I * M) where M = members, F = files per member, I = imports per file. For each file's each import, it loops over all other members. With many members, this becomes quadratic.

**Options:**
- (a) Pre-compute a reverse lookup from file path → member name for O(1) member resolution
- (b) Not a concern in practice since architectural layers are typically <10

### Strengths

- Uses a clean domain utility (`findCycles`) with no external dependencies
- The graph is built at the member level (not file level), keeping it manageable
- 7 unit tests covering 2-node cycles, 3-node cycles, partial connections, and edge cases

---

## Constraint 5: `colocated`

### What It Does

Requires that every file in member A has a corresponding file (same basename) in member B. This enforces patterns like "every component must have a test file" or "every model must have a migration".

```typescript
type AppContext = Kind<"AppContext", {
  components: ComponentsLayer;
  tests: TestsLayer;
}, {
  colocated: [["components", "tests"]];
}>;
```

### How It Works

1. Reads all files in the `primary` member's directory
2. Reads all files in the `related` member's directory, mapping each to its basename
3. For each primary file, checks if its basename exists in the related set
4. If not, emits `Diagnostic.notColocated` (code 70005)

### Issues Found

**1. Basename matching is too strict for common use cases.**
For the "every component has a test" pattern, the primary file might be `button.ts` but the test file would be `button.test.ts` or `button.spec.ts`. These have different basenames and would fail the colocation check.

This is arguably the **most significant issue** across all constraints. The intended use case (component ↔ test pairing) doesn't work with the current implementation.

**Options:**
- (a) Support basename transform patterns: `colocated: [["components", "tests", { suffix: ".test" }]]`
- (b) Strip known suffixes (`.test`, `.spec`, `.stories`) before comparison
- (c) Match on the stem (filename without extension) rather than full basename
- (d) Use a configurable matching function

**2. The check is unidirectional.**
Only checks that every file in `primary` has a match in `related` — not the reverse. Orphan test files (tests with no corresponding component) are not detected.

**Options:**
- (a) Add a `bidirectional?: boolean` option
- (b) Users can add two tuples: `[["components", "tests"], ["tests", "components"]]` (already supported)
- (c) Keep unidirectional as default, document the reverse pattern

**3. Flat matching — no recursive directory correspondence.**
If `components/` has subdirectories (`components/forms/input.ts`), the check extracts only the basename (`input.ts`) and looks for it in the flat list of `tests/` basenames. It does not check that `tests/forms/input.ts` exists — just that `input.ts` exists somewhere in `tests/`.

**Options:**
- (a) Use relative paths from the member root instead of basenames for matching
- (b) Add a `recursive?: boolean` or `preserveStructure?: boolean` option
- (c) Document the flat-matching behavior

**4. No file extension handling.**
Files `button.ts` and `button.tsx` have different basenames and are treated as different files. A component written in `.tsx` would not match a test written in `.ts`.

**Options:**
- (a) Match on stem (without extension) by default
- (b) Add `ignoreExtension?: boolean` option

**5. Least tested constraint — 0 AST parsing tests.**
`classify-ast-contracts.test.ts` has no test for parsing `colocated` from a Kind definition. The service-level tests have only 3 tests (detect missing counterpart, missing locations guard, passes when matched).

### Strengths

- Simple, easy to understand
- Uses the filesystem port's `basename()` for platform-independent behavior
- Doesn't crash on missing locations (guard clause)

---

## Implicit Check: Existence

### What It Does

Verifies that every derived member directory actually exists on the filesystem. This catches typos in kind definitions and ensures the architectural structure matches reality.

### How It Works

1. Runs after all contract checks
2. Iterates all ArchSymbol descendants
3. For each member with `locationDerived === true` and a `declaredLocation`, checks if the directory exists via `fsPort.directoryExists()`
4. Emits `Diagnostic.locationNotFound` (code 70010) if missing

### Issues Found

**1. Not a first-class constraint — users can't opt out.**
Existence checking always runs. If a user is in the process of scaffolding a new architecture and hasn't created all directories yet, they'll get existence errors they can't suppress.

**Options:**
- (a) Make existence checking opt-in or opt-out via config
- (b) Keep it always-on (it's a useful safety net)
- (c) Allow `optional?: true` on individual members

**2. Only checks directories, not files.**
A member's directory might exist but be empty. This is not flagged.

**3. No diagnostic code constant for the "location not found" message in the diagnostic factory.**
Actually this uses `DiagnosticCode.LocationNotFound` (70010), which is fine. No issue here upon closer inspection.

### Strengths

- Catches real-world problems (typos, missing directories) early
- Runs per-symbol so it works with multi-instance setups
- Clean implementation with guard clauses

---

## Cross-Cutting Issues

### 1. No constraint composition or custom constraints

Users cannot define custom constraint types. The 5 constraints are hard-coded in the enum, the switch statement, and the `ConstraintConfig` type. Adding a new constraint requires modifying 5+ files across 3 layers.

**Options:**
- (a) Add a plugin/extension system for custom constraints
- (b) Accept 5 constraints as sufficient for the current scope
- (c) Add a generic `custom` constraint type with a callback

### 2. Constraint error messages lack actionable guidance

Diagnostics tell you *what* violated but not *how to fix it*. For example, `"Forbidden dependency: src/domain/entity.ts → src/infrastructure/db.ts"` doesn't suggest "consider adding a port interface in the application layer."

**Options:**
- (a) Add suggestion text to each diagnostic type
- (b) Integrate with TypeScript's "related information" diagnostic chain
- (c) Implement quick-fix code actions (the `get-plugin-code-fixes` use case exists but may not cover all constraint types)

### 3. No severity levels

All violations are errors. There's no way to declare a constraint as a warning (e.g., during migration to a new architecture).

**Options:**
- (a) Add `severity?: 'error' | 'warning'` to constraint config
- (b) Keep everything as errors (architectural constraints should be strict)
- (c) Add a global `--strict` / `--lenient` CLI flag

### 4. No constraint scoping beyond the member level

Constraints operate at the member (directory) level. You can't constrain individual files, specific exports, or import patterns like "allow type imports but not value imports."

### 5. Performance: each constraint independently reads files

`checkNoDependency`, `checkPurity`, and `checkNoCycles` all independently call `fsPort.readDirectory()` for the same symbols. If a symbol appears in multiple contracts, its files are read multiple times.

**Options:**
- (a) Pre-resolve all files for all symbols before running contract checks
- (b) Add caching to the filesystem port
- (c) Accept the overhead (typically small number of directories)

---

## Summary Table

| Constraint | Maturity | Test Coverage | Key Issues | Severity |
|---|---|---|---|---|
| `noDependency` | High | Strong (10 tests) | Type-only imports treated as violations | Medium |
| `pure` | High | Good (8 tests) | Only checks Node.js builtins, not npm packages | Medium |
| `mustImplement` | Medium | Good (7 tests) | Only detects `interface`, not abstract classes; poor diagnostic location | Low |
| `noCycles` | Medium | Good (7 tests) | May report duplicate cycles; poor diagnostic location | Medium |
| `colocated` | Low | Weak (3 tests, 0 AST) | Basename matching doesn't support common patterns (`.test.ts` suffix) | High |
| existence | Medium | Adequate (3 tests) | Always-on, no opt-out | Low |

### Priority Recommendations

1. **High — Fix `colocated` basename matching.** The most impactful constraint is effectively broken for its primary use case (component ↔ test file pairing). Add suffix/stem matching.

2. **Medium — Address `noDependency` type-only import handling.** This is a common complaint in real-world use. At minimum, document the behavior; ideally, add a `typeImportsAllowed` option.

3. **Medium — Fix `noCycles` duplicate cycle reporting.** Normalize and deduplicate cycles before emitting diagnostics.

4. **Medium — Expand `pure` to cover more than Node.js builtins.** Add user-configurable forbidden module lists.

5. **Low — Improve diagnostic locations** for `mustImplement` and `noCycles`. Point diagnostics to actual source files rather than member names.

6. **Low — Add AST parsing tests for `colocated`.** Currently the only constraint with zero tests in `classify-ast-contracts.test.ts`.
