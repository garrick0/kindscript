# How TypeScript Tests TypeScript (and What We Can Steal)

> Research doc exploring the TypeScript compiler team's testing practices and their applicability to KindScript.

---

## Why This Matters for KindScript

KindScript is a compiler pipeline tool that extends TypeScript. We face many of the same testing challenges the TypeScript team does:

- **Complex structured output** (diagnostics, classified symbols, contract violations)
- **Compiler option permutations** (different tsconfig settings change behavior)
- **Multi-file test scenarios** (architecture validation requires project-shaped fixtures)
- **Language service integration** (our plugin needs to produce diagnostics in-editor)

Understanding how the TypeScript team solved these problems at massive scale (80,000+ tests) gives us a playbook for our own testing evolution.

---

## 1. Baseline Testing (Snapshot-Driven Development)

### How It Works in TypeScript

TypeScript's primary testing approach is **baseline testing** -- what most of us know as "snapshot testing," but taken to an extreme. Instead of writing explicit assertions, tests produce output files that are committed to the repository as the expected result.

**Two directories:**
- `tests/baselines/reference/` -- The committed, accepted output (the "truth")
- `tests/baselines/local/` -- Generated during a test run (gitignored)

If local differs from reference, the test fails. The developer reviews the diff and either fixes their code or accepts the new baselines:

```bash
hereby baseline-accept
```

This copies `local/` into `reference/`, and the baseline changes show up as a normal git diff.

### What a Compiler Test Looks Like

A test is just a `.ts` file with `// @` directives for compiler options:

```typescript
// @target: es2015
class Cell {}

class Ship {
  isSunk: boolean = false;
}

class Board {
  ships: Ship[] = [];
  cells: Cell[] = [];

  private allShipsSunk() {
    return this.ships.every(function (val) { return val.isSunk; });
  }
}
```

This single file automatically generates **multiple baselines**:

| Baseline | What It Captures |
|----------|-----------------|
| `2dArrays.js` | JavaScript emit |
| `2dArrays.d.ts` | Declaration file output |
| `2dArrays.errors.txt` | Compiler diagnostics (error codes, locations, messages) |
| `2dArrays.types` | Resolved type of every expression |
| `2dArrays.symbols` | Symbol table with declaration locations |
| `2dArrays.js.map` | Source maps (when enabled) |

The `.symbols` baseline looks like:

```
=== 2dArrays.ts ===
class Cell {
>Cell : Symbol(Cell, Decl(2dArrays.ts, 0, 0))
}

class Ship {
>Ship : Symbol(Ship, Decl(2dArrays.ts, 1, 1))

  isSunk: boolean = false;
>isSunk : Symbol(Ship.isSunk, Decl(2dArrays.ts, 3, 12))
}
```

### Why Baselines Over Assertions (for a Compiler)

The TypeScript team's rationale, as articulated by contributor Tingan Ho who coined "Baseline Acceptance Driven Development" (BADD):

1. **You don't have to manually write expected results.** Compiler output is complex (JS, types, symbols, errors). Writing assertions for all of it would be extremely tedious and fragile.

2. **Reduced coupling between tests and implementation.** Traditional assertions bind to specific API shapes. Baselines just say "the output should remain the same unless intentionally changed."

3. **Effortless refactoring.** When a change intentionally alters output across many tests, you re-run, review the diff, and accept. What might take hours of assertion updates takes seconds.

4. **Comprehensive regression detection.** Every dimension of compiler output is captured. You cannot accidentally change type resolution, emit, or error messages without it showing in a baseline diff.

5. **Self-documenting.** Baseline files serve as documentation of exactly what the compiler produces for each input.

### Multi-Configuration Testing via `// @` Directives

A single test file can generate multiple sets of baselines for different compiler configurations:

```typescript
// @declaration: true, false
// @target: es5, es2015
```

This generates 4 configurations (2 x 2), each producing its own set of baselines. The baseline filenames include the configuration in parentheses:

```
myTest(target=es5).js
myTest(target=es2015).js
myTest(target=es5,declaration=true).d.ts
...
```

The system supports wildcards (`*`), exclusions (`-`/`!`), and caps at 25 combinations per test file.

### Virtual Multi-File Tests

A single test file can define multiple "virtual" files using `// @filename:`:

```typescript
// @module: nodenext

// @filename: package.json
{ "name": "pkg", "type": "module" }

// @filename: src/utils.ts
export const add = (a: number, b: number) => a + b;

// @filename: src/index.ts
import { add } from "./utils.js";
console.log(add(1, 2));
```

No fixture directories needed -- multi-file module resolution, cross-file type checking, and import behavior all tested from a single file.

---

## 2. Fourslash Tests (Language Service / IDE Features)

### What They Are

Fourslash is TypeScript's framework for testing "user-facing" IDE functionality: completions, go-to-definition, quick fixes, refactors, rename, hover info, etc. Named after the `////` (four slashes) syntax used to define virtual file content.

### How They Work

```typescript
/// <reference path='fourslash.ts'/>

// @filename: /a.ts
////interface Foo {
////    /*def*/bar: string;
////}
////
////const f: Foo = { ba/*completion*/r: "hello" };

verify.completions({
    marker: "completion",
    includes: { name: "bar" }
});

goTo.marker("usage");
verify.goToDefinition("usage", "def");
```

Key syntax:
- `////` lines become virtual file content
- `/*name*/` markers indicate cursor positions
- `[|...|]` marks ranges (selections)
- Verification API at the bottom makes assertions

### The Fourslash API

The verification API covers the full surface area of IDE features:

```typescript
// Completions
verify.completions({ marker: "m", includes: { name: "foo" } });

// Quick info / hover
verify.quickInfoAt("marker", "expected type string");

// Go to definition
verify.goToDefinition("usage", "definition");

// Code fixes
verify.codeFixAll({ fixId: "...", newFileContent: "..." });

// Refactoring
verify.refactorAvailable("Extract Symbol", "function_scope_0", "...");

// Rename
verify.renameInfoSucceeded();

// Navigation
goTo.file("/b.ts");
goTo.marker("1");
```

### Fourslash Server Variant

There's a separate category (`fourslash-server`) that tests tsserver specifically -- the persistent server process that IDEs communicate with. This catches bugs where the language service works correctly in-process but the tsserver serialization layer corrupts responses.

---

## 3. Test Organization

### Test Runners / Categories

TypeScript's test runner supports these categories:

| Runner | Directory | What It Tests |
|--------|-----------|---------------|
| `compiler` | `tests/cases/compiler/` | General compiler behavior, bug fixes |
| `conformance` | `tests/cases/conformance/` | Spec compliance, organized by spec section |
| `fourslash` | `tests/cases/fourslash/` | IDE/language service features |
| `fourslash-server` | `tests/cases/fourslash/server/` | tsserver protocol behavior |
| `project` | `tests/cases/project/` | Multi-file project scenarios |
| `transpile` | (transpilation tests) | `transpileModule` behavior |

### Scale

- `tests/cases/compiler/` -- Thousands of `.ts` files
- `tests/cases/conformance/` -- Organized by spec areas (`types/`, `expressions/`, etc.)
- `tests/cases/fourslash/` -- Hundreds of test files with descriptive camelCase names (e.g., `codeFixAddMissingMember1.ts` through `codeFixAddMissingMember31.ts`)
- `tests/baselines/reference/` -- Tens of thousands of baseline files

**Important constraint:** Filenames must be unique across all test directories. This sometimes requires creative naming.

### Almost Zero Traditional Unit Tests

This is the most striking aspect of TypeScript's testing philosophy. The team's explicit guidance:

> "Always use fourslash tests (for IDE/language service features) or compiler tests (for TypeScript compilation behavior) **instead of direct unit tests.**"

The reasoning: end-to-end baseline tests validate actual user-visible behavior rather than internal implementation details. They survive refactoring without needing updates (unless behavior intentionally changes).

---

## 4. Real-World Validation

### The TypeScript Bot

On any PR, TypeScript team members can trigger real-world validation by commenting on the PR:

| Command | What It Does | Time |
|---------|-------------|------|
| `@typescript-bot test top100` | Compiles top 100 TS repos by GitHub stars | ~30 min |
| `@typescript-bot test top200` | Same but top 200 | ~30 min |
| `@typescript-bot test top400` | Same but top 400 | ~30 min |
| `@typescript-bot user test this` | Runs curated real-world project suite | ~30 min |
| `@typescript-bot run dt` | Runs DefinitelyTyped linter (4 containers) | ~25 min |
| `@typescript-bot perf test this` | Performance benchmarks on dedicated hardware | ~25 min |
| `@typescript-bot test it` | All of the above in parallel | - |

Each posts a comparison comment showing regressions vs. the main branch.

### Performance Testing

- Dedicated **physical machines** (not VMs) for consistent benchmarking
- Each benchmark defined by a `scenario.json` configuration
- Results compared against main branch baseline
- [TSPerf](https://tsperf.dev/) for visualization and regression detection

---

## 5. What We Can Apply to KindScript

### 5.1 Baseline Testing for Contract Checking (High Impact)

**Current state:** Our integration tests use assertion-based checking:
```typescript
const { checkResult } = runPipeline(FIXTURES.CLEAN_ARCH_VIOLATION);
expect(checkResult.violationsFound).toBe(1);
```

**What baseline testing would look like:**

A fixture directory produces a `diagnostics.baseline.txt`:
```
=== check: clean-arch-violation ===

src/infrastructure/repository.ts(3,1): KS1001 - 'infrastructure' cannot depend on 'domain'
  Import: import { Entity } from '../domain/entity'
  Contract: noDependency(domain, infrastructure)

Violations: 1
```

When behavior changes, we'd review the diff of this file rather than updating assertion counts. This would catch unintended changes to diagnostic messages, error codes, file paths, and violation counts all at once.

**Implementation effort:** Medium. Jest has `toMatchSnapshot()` but TypeScript's approach of separate committed baseline files with a dedicated accept workflow is cleaner for complex structured output.

### 5.2 Self-Contained Test Files with Directives (Medium Impact)

**Current state:** Each integration test needs a fixture directory with multiple files, a `tsconfig.json`, and a `.k.ts` definition file. Adding a new test scenario means creating a whole new fixture directory.

**What the TypeScript approach would look like:**

```typescript
// @fixture: inline
// @expects: violation

// @filename: src/context.k.ts
import { Kind, Constraints, MemberMap, Instance } from 'kindscript';
type MyArch = Kind<'MyArch', { domain: {}; infra: {} }, { noDependency: [['domain'], ['infra']] }>;
export type context = Instance<MyArch>;
export type members = MemberMap<MyArch>;

// @filename: src/domain/entity.ts
export class Entity { name: string = ''; }

// @filename: src/infra/repository.ts
import { Entity } from '../domain/entity'; // violation!
export class Repository { entity = new Entity(); }
```

A single file defines the entire test scenario. The harness creates a virtual filesystem, runs the pipeline, and compares output to baselines.

**Benefit:** Dramatically lowers the friction of adding new test cases. Instead of creating 4+ files across multiple directories, you write one file.

**Implementation effort:** High. Requires building a virtual filesystem layer and a test case parser. Worth exploring when test count grows significantly.

### 5.3 Multi-Dimensional Baselines (Medium Impact)

**Current state:** We check violations found (a count) and sometimes specific diagnostic properties. We don't systematically capture all the dimensions of our output.

**What multiple baselines would give us:**

For each fixture, automatically generate and commit:

| Baseline | What It Captures |
|----------|-----------------|
| `*.diagnostics.txt` | All diagnostics with codes, messages, locations |
| `*.symbols.txt` | Classified ArchSymbols with their kinds and properties |
| `*.contracts.txt` | Parsed contracts with their types and targets |
| `*.graph.txt` | Dependency graph (import edges between symbols) |

Any change to classification logic, contract parsing, or diagnostic formatting would immediately surface as a baseline diff -- even changes we didn't think to write assertions for.

### 5.4 IDE Feature Testing (Future, when plugin matures)

Our TypeScript language service plugin (`src/infrastructure/plugin/`) would benefit from fourslash-style tests. Imagine:

```typescript
// @filename: src/domain/entity.ts
////export class Entity {
////  /**/import { Repo } from '../infra/repo'; // violation
////}

verify.diagnosticAtMarker("", {
  code: "KS1001",
  message: "domain cannot depend on infrastructure"
});

verify.codeFixAtMarker("", {
  fixDescription: "Remove import",
  newFileContent: "export class Entity {}"
});
```

This directly validates the in-editor experience. **Not urgent now**, but relevant once the plugin has code fix capabilities.

### 5.5 Test Configuration Variations (Low-Hanging Fruit)

**Current state:** To test different configurations, we create separate fixture directories (e.g., `clean-arch-valid/` and `clean-arch-violation/`).

**What we could do:** Run the same fixture with multiple configurations:
- With/without `kindscript.json`
- Different tsconfig `paths` settings
- Nested vs. flat source layouts

The TypeScript approach of annotating variations in the test file itself (`// @strict: true, false`) is elegant and eliminates fixture directory proliferation.

### 5.6 Real-World Project Testing (Future)

As KindScript matures, we should maintain a curated set of real TypeScript projects configured with KindScript and run them as integration tests. This is the equivalent of TypeScript's `test top100` bot -- catching regressions that synthetic fixtures miss.

---

## 6. What We Should NOT Copy

### Nearly-zero unit tests
TypeScript can get away with almost no unit tests because their baseline tests are comprehensive end-to-end tests that cover internal behavior implicitly. KindScript benefits from unit tests because:
- Our domain layer is intentionally pure and testable in isolation
- Our Clean Architecture means unit tests validate layer boundaries
- We have far fewer tests (272 vs 80,000+), so the maintenance burden of assertion-based tests is manageable

### The sheer scale of baseline directories
TypeScript's `tests/baselines/reference/` contains tens of thousands of files. At our scale, we'd want to keep baselines alongside fixtures rather than in a separate tree.

### Unique filename constraint
TypeScript requires globally unique test filenames. This is an artifact of their flat baseline directory structure. We should keep our hierarchical fixture organization.

---

## 7. Recommended Adoption Path

### Phase 1: Diagnostic Baselines (Do Now)
- Add `.baseline.txt` snapshot files for integration test fixtures
- Each fixture's expected diagnostic output is committed as a file
- Use Jest's `toMatchSnapshot()` or a custom baseline comparator
- Catches unintended changes to diagnostic messages, codes, locations

### Phase 2: Multi-Dimensional Baselines (Do When Adding Features)
- Capture classified symbols, parsed contracts, and dependency graphs as separate baselines per fixture
- Gives us comprehensive regression coverage as the system grows

### Phase 3: Inline Test Files (Do When Fixture Count Gets Painful)
- Build a parser for self-contained test files with `// @filename:` directives
- Dramatically lowers the cost of adding new test scenarios
- Eliminates fixture directory sprawl

### Phase 4: Plugin Testing Framework (Do When Plugin Matures)
- Build a fourslash-inspired framework for testing the language service plugin
- Test completions, diagnostics, code fixes in-editor
- Validate the actual user experience, not just the pipeline output

---

## Sources

- [TypeScript CONTRIBUTING.md](https://github.com/microsoft/TypeScript/blob/main/CONTRIBUTING.md)
- [Tingan Ho: Baseline Acceptance Driven Development](https://medium.com/@tinganho/baseline-acceptance-driven-development-f39f7010a04)
- [Orta Therox: TypeScript Compiler Notes - Fourslash](https://github.com/orta/typescript-notes/blob/master/systems/testing/fourslash.md)
- [Andrew Branch: Debugging the TypeScript Codebase](https://blog.andrewbran.ch/debugging-the-typescript-codebase/)
- [Awesome Reviewers: TypeScript-Specific Tests](https://awesomereviewers.com/reviewers/typescript-use-typescript-specific-tests/)
- [TypeScript Wiki: Triggering TypeScript Bot](https://github.com/Microsoft/TypeScript/wiki/Triggering-Typescript-Bot)
- [TypeScript Benchmarking Repo](https://github.com/microsoft/typescript-benchmarking)
- [TypeScript Fourslash API Definition](https://github.com/microsoft/TypeScript/blob/main/tests/cases/fourslash/fourslash.ts)
- [TypeScript-Go: Ported Test Infrastructure](https://github.com/microsoft/typescript-go)

---

**Created:** 2026-02-07
