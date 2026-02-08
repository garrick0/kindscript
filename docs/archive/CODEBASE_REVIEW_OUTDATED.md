# Deep Codebase Review: KindScript v0.8.0-m8

**Date**: 2026-02-07
**Scope**: Full codebase -- domain, application, infrastructure, tests, packages, configuration

---

## Executive Summary

KindScript has strong architectural foundations -- the Clean Architecture layering is genuine, the domain layer is pure (zero infrastructure imports), and the port/adapter pattern is correctly applied across all boundaries. The codebase is well-tested with 44 test files across four layers.

However, the review identifies **3 critical issues**, **9 high-severity issues**, and **12 medium-severity issues** across six categories: dead/backward-compatible code, duplicated logic, type safety, memory management, separation of concerns, and port/adapter design.

---

## 1. Dead Code and Backward Compatibility Remnants

### 1.1 CRITICAL: `deno.json` Points to Deleted Files

**File**: `deno.json`

The project has migrated from Deno to Node/TypeScript, but `deno.json` still exists with stale configuration:

```json
{
  "name": "@abstractions/type-checker",   // old project name
  "exports": "./lib/mod.ts",              // lib/mod.ts is DELETED
  "tasks": {
    "check": "deno check lib/mod.ts",     // lib/ directory no longer exists
    "test": "deno test lib/"              // lib/ directory no longer exists
  },
  "imports": {
    "@std/fs": "jsr:@std/fs@^1.0.0",     // Deno std imports, unused
    ...
  }
}
```

Both `lib/mod.ts` and `lib/types.ts` are deleted in the working tree. The entire `deno.json` is vestigial.

**Action**: Delete `deno.json` and `deno.lock` entirely. The project is Node-only now.

---

### 1.2 HIGH: `KindScriptConfig.contracts` Field is Dead Code

**File**: `src/application/ports/config.port.ts:12`

```typescript
export interface KindScriptConfig {
  contracts?: Partial<Record<ContractType, unknown[]>>;  // <-- DEAD
  definitions?: string[];
  packages?: string[];
  ...
}
```

The `contracts` field is a Tier 1 (config-based contracts) remnant. It is **never read** anywhere in the current codebase -- `grep` for `ksConfig.contracts` returns zero results. The deleted `ConfigSymbolBuilder` was the only consumer.

The comment on the field still says "Contract definitions (simple config format)" and the comment on the `definitions` field says "for Tier 2+" -- this language implies Tier 1 still exists, but it has been removed.

**Action**: Remove the `contracts` field from `KindScriptConfig` and update the comments to remove Tier 1/Tier 2 language.

---

### 1.3 MEDIUM: Test Fixture `kindscript.json` Files Reference Removed Fields

**Files**: `tests/integration/fixtures/clean-arch-valid/kindscript.json`, `tests/integration/fixtures/clean-arch-violation/kindscript.json`

These fixtures were updated to use `"definitions"` format, which is correct. However, verify no other fixtures still use the old `"contracts"` key format. If any do, they are testing dead code paths.

---

### 1.4 LOW: `absc` Empty Executable Stub

A file named `absc` exists at the project root. It appears to be an empty stub from an earlier naming convention (the CLI binary is now `ksc`).

**Action**: Delete `absc`.

---

## 2. Duplicated Code

### 2.1 CRITICAL: `GetPluginDiagnosticsService` Duplicates `ClassifyProjectService`

**Files**:
- `src/application/use-cases/get-plugin-diagnostics/get-plugin-diagnostics.service.ts:62-116`
- `src/application/use-cases/classify-project/classify-project.service.ts:28-107`

The `ClassifyProjectService` was explicitly created to "eliminate the duplicated orchestration logic" (its own doc comment says so). Yet `GetPluginDiagnosticsService.getDiagnostics()` still contains a near-identical copy of the same pipeline:

| Step | ClassifyProjectService | GetPluginDiagnosticsService |
|------|----------------------|---------------------------|
| Read kindscript.json | `configPort.readKindScriptConfig()` | `configPort.readKindScriptConfig()` |
| Read tsconfig.json | `configPort.readTSConfig()` | `configPort.readTSConfig()` |
| Merge compiler options | `{...tsConfig, ...ksConfig}` | `{...tsConfig, ...ksConfig}` |
| Determine root files | `tsConfig.files ?? readDirectory()` | `tsConfig.files ?? readDirectory()` |
| Resolve definition paths | `fsPort.resolvePath()` | `fsPort.resolvePath()` |
| Create program | `tsPort.createProgram()` | `tsPort.createProgram()` |
| Get type checker | `tsPort.getTypeChecker()` | `tsPort.getTypeChecker()` |
| Classify definitions | `classifyService.execute()` | `classifyService.execute()` |

The only difference is that `GetPluginDiagnosticsService` adds a caching layer (`ClassifyCache`) and lacks package resolution. The plugin service should compose `ClassifyProjectService` instead of duplicating it.

**Action**: Refactor `GetPluginDiagnosticsService` to depend on `ClassifyProjectUseCase` and wrap it with caching, rather than duplicating the full orchestration pipeline.

---

### 2.2 HIGH: `TypeScriptAdapter` Has Two Import-Walking Methods

**File**: `src/infrastructure/adapters/typescript/typescript.adapter.ts`

`getImports()` (lines 59-95) and `getImportModuleSpecifiers()` (lines 119-138) both walk the AST recursively with `ts.forEachChild` looking for `ts.isImportDeclaration`. They do essentially the same work but return different shapes:

- `getImports()` returns `ImportEdge[]` (resolved file paths via type checker)
- `getImportModuleSpecifiers()` returns `{ moduleName, line, column }[]` (raw specifier strings)

These will diverge over time as bugs are fixed in one but not the other.

**Action**: Extract a single `walkImports()` helper that yields `{ node, moduleSpecifier, position }` tuples, then have both methods map over that shared iterator.

---

### 2.3 HIGH: `Diagnostic.toString()` and `Diagnostic.format()` Are Nearly Identical

**File**: `src/domain/entities/diagnostic.ts`

```typescript
// Line 147
format(): string {
  let result = `${this.file}:${this.line}:${this.column} - error KS${this.code}: ${this.message}`;
  if (this.relatedContract) { /* append contract info */ }
  return result;
}

// Line 181
toString(): string {
  return `${this.file}:${this.line}:${this.column} - error KS${this.code}: ${this.message}`;
}
```

`toString()` is exactly the first line of `format()`. This means `toString()` and `format()` can silently produce different output if one is changed but not the other.

**Action**: Have `toString()` delegate to `format()`, or remove `toString()` if it's unused.

---

### 2.4 MEDIUM: `ContractReference` Creation Repeated in Every Factory Method

**File**: `src/domain/entities/diagnostic.ts`

Every factory method (`forbiddenDependency`, `missingImplementation`, `impureImport`, `circularDependency`, `notColocated`) constructs the same `ContractReference` shape:

```typescript
{
  contractName: contract.name,
  contractType: contract.type,
  location: contract.location,
}
```

This is repeated 5 times.

**Action**: Add a `Contract.toReference(): ContractReference` method and use it in all factories.

---

## 3. Type Safety Issues

### 3.1 CRITICAL: `ASTAdapter` Uses `as unknown as ASTNode` Casting

**File**: `src/infrastructure/adapters/ast/ast.adapter.ts`

The adapter uses `as unknown as ASTNode` in **8 locations** (lines 15, 108, 124, 145, 190, 200, 212, 217). This double-cast pattern completely bypasses TypeScript's type system:

```typescript
return Array.from(tsSourceFile.statements) as unknown as ASTNode[];
```

The `ASTNode` type is defined as an opaque branded type in the port. At runtime, these are just raw `ts.Node` objects being passed through an untyped boundary. If any consumer accidentally calls a method that exists on `ASTNode` but not on `ts.Node` (or vice versa), the error will be a silent runtime failure, not a compile-time error.

The inverse cast in `toTsNode()` (line 216-217) is equally unsafe:

```typescript
private toTsNode(node: ASTNode): ts.Node {
  return node as unknown as ts.Node;
}
```

**Action**: Consider a branded wrapper pattern, or accept that `ASTNode` is just a `ts.Node` alias and document the runtime contract explicitly rather than pretending there's type safety.

---

### 3.2 HIGH: `ASTAdapter.toTsSourceFile()` Fallback Recreates AST From Text

**File**: `src/infrastructure/adapters/ast/ast.adapter.ts:220-226`

```typescript
private toTsSourceFile(sourceFile: SourceFile): ts.SourceFile | undefined {
  return (sourceFile as unknown as { __tsSourceFile?: ts.SourceFile }).__tsSourceFile
    ?? ts.createSourceFile(sourceFile.fileName, sourceFile.text, ts.ScriptTarget.Latest, true);
}
```

This method first checks for a hidden `__tsSourceFile` property (which is never documented or typed), and falls back to **re-parsing the entire file**. This is:
1. A type safety violation (checking for untyped hidden properties)
2. A performance concern (re-parsing is O(n) in file size)
3. Semantically different (the re-parsed AST may differ from the original if the text was modified)

**Action**: The `SourceFile` port type should carry the `ts.SourceFile` reference properly through the `Program` entity, similar to how `Program.handle` carries `ts.Program`. Don't reconstruct the AST.

---

### 3.3 HIGH: `TypeScriptAdapter.unwrapProgram()` Incomplete Validation

**File**: `src/infrastructure/adapters/typescript/typescript.adapter.ts:185-190`

```typescript
private unwrapProgram(program: Program): ts.Program {
  if (!program.handle || typeof (program.handle as ts.Program).getSourceFiles !== 'function') {
    throw new Error('...');
  }
  return program.handle as ts.Program;
}
```

Only checks that `getSourceFiles` exists as a function. Any object with a `getSourceFiles` method would pass this check. This is a duck-typing validation where a proper branded type or `instanceof` check would be safer.

---

### 3.4 MEDIUM: `CheckContractsService` Casts `checker` to `unknown`

**File**: `src/application/use-cases/check-contracts/check-contracts.service.ts:95,117,165,197`

```typescript
private checkNoDependency(contract: Contract, program: Program, checker: unknown): ...
```

The `checker` parameter is typed as `unknown` in the private methods, requiring casts at the call sites:

```typescript
checker as ReturnType<TypeScriptPort['getTypeChecker']>
```

This defeats the port abstraction -- the application layer shouldn't need to cast, and `checker` should be properly typed as `TypeChecker` throughout.

---

## 4. Memory Management

### 4.1 HIGH: `TypeScriptAdapter.checkerToProgram` Map Never Cleared

**File**: `src/infrastructure/adapters/typescript/typescript.adapter.ts:29`

```typescript
private checkerToProgram = new Map<unknown, ts.Program>();
```

Every call to `getTypeChecker()` adds an entry. In the CLI context (single invocation), this is harmless. But in the **plugin context** (long-running tsserver process), this Map grows indefinitely. `ts.Program` objects hold the entire AST and source text in memory.

Each time the user saves a file, tsserver recreates the program, and a new entry is added without removing the old one.

**Action**: Use a `WeakMap` if the key supports it, or clear the map when `createProgram()` is called (since the old program is replaced). Alternatively, scope the map to a single program lifetime.

---

## 5. Separation of Concerns

### 5.1 HIGH: `Diagnostic.format()` and `formatWithContext()` Are Presentation Logic on a Domain Entity

**File**: `src/domain/entities/diagnostic.ts:147-176`

The `Diagnostic` domain entity contains two methods that are purely presentation concerns:

```typescript
format(): string {
  let result = `${this.file}:${this.line}:${this.column} - error KS${this.code}: ${this.message}`;
  // ... format contract info
}

formatWithContext(sourceText: string): string {
  // ... format with source code gutter display
}
```

These methods decide on a specific output format (`:line:column - error KS...`), include caret markers (`^`), and render source code context. This is CLI/terminal presentation logic that doesn't belong in the domain.

The `CLIDiagnosticAdapter` is now a hollow shell that just delegates:

```typescript
// cli-diagnostic.adapter.ts
formatDiagnostic(diagnostic: Diagnostic): string {
  return diagnostic.format();  // adapter does nothing
}
```

**Action**: Move `format()` and `formatWithContext()` out of `Diagnostic` and into `CLIDiagnosticAdapter` (the infrastructure layer), which is where formatting belongs. Keep `toString()` on the entity if needed for debugging only.

---

### 5.2 MEDIUM: `DiagnosticPort` Has Methods That Bypass the Port Pattern

**File**: `src/application/ports/diagnostic.port.ts`

The port defines three methods:
1. `reportDiagnostics()` -- genuine port behavior (output to user)
2. `formatDiagnostic()` -- formatting concern
3. `formatWithContext()` -- formatting concern

Methods 2 and 3 are never called through the port in the application layer -- they exist only for the adapter to call `diagnostic.format()` internally. This makes the port interface wider than necessary and conflates reporting with formatting.

**Action**: Slim the port to just `reportDiagnostics()`. Formatting is an internal concern of each adapter.

---

### 5.3 MEDIUM: `CheckContractsService` Creates Its Own `Program`

**File**: `src/application/use-cases/check-contracts/check-contracts.service.ts:30-33`

```typescript
const program = this.tsPort.createProgram(
  request.programRootFiles,
  request.config.compilerOptions ?? {}
);
```

`ClassifyProjectService` already creates a program to classify definitions. Then `CheckCommand` calls `CheckContractsService`, which creates **a second program** from scratch for the same files. Two full TS program creations per `ksc check` invocation.

**Action**: Pass the already-created `Program` to `CheckContractsService` through the request DTO, avoiding the duplicate program creation.

---

### 5.4 LOW: `LanguageServicePort.toTSDiagnostic()` Mixes Conversion with Port Contract

**File**: `src/application/ports/language-service.port.ts:58`

```typescript
toTSDiagnostic(diagnostic: Diagnostic, program: Program): TSDiagnostic;
```

This method converts a domain `Diagnostic` to a TS-specific `TSDiagnostic`. This is an infrastructure conversion concern that's leaked into the port interface. Conversion should be in the adapter or a dedicated converter (which already exists as `diagnostic-converter.ts`).

---

## 6. Port and Adapter Design Issues

### 6.1 HIGH: `ASTPort` Is a God Interface (20+ Methods)

**File**: `src/application/ports/ast.port.ts`

The `ASTPort` interface has **23 methods** covering:
- Node type checks (`isInterfaceDeclaration`, `isVariableStatement`, `isCallExpression`, `isObjectLiteral`, `isArrayLiteral`)
- Property access (`getDeclarationName`, `getHeritageTypeNames`, `getPropertySignatures`, `getObjectProperties`, ...)
- Tree walking (`forEachStatement`, `getStatements`)
- Multiple extraction variants (`getCallExpressionName`, `getCallTypeArgumentNames`, `getCallArguments`)

This violates the Interface Segregation Principle. The only consumer (`ClassifyASTService`) uses all methods, but if any future consumer needs just a subset, they must depend on the entire interface.

**Action**: Consider splitting into focused interfaces: `ASTTypeChecks`, `ASTPropertyAccess`, `ASTWalker`. Or accept the current monolithic design with a documented rationale.

---

### 6.2 HIGH: `TypeScriptPort` Mixes Compilation, Analysis, and Query Concerns

**File**: `src/application/ports/typescript.port.ts`

The `TypeScriptPort` combines:
- Program creation (`createProgram`)
- Source file access (`getSourceFile`, `getSourceFiles`)
- Type checking (`getTypeChecker`)
- Import resolution (`getImports`, `getImportModuleSpecifiers`)
- Diagnostic collection (`getDiagnostics`)
- Interface analysis (`getExportedInterfaceNames`, `hasClassImplementing`)

This port does too much. Import resolution and interface analysis are higher-level query operations built on top of the compiler, not compiler operations themselves.

**Action**: Split into `CompilerPort` (program/sourceFile/checker creation) and `CodeAnalysisPort` (imports, interfaces, diagnostics). This also reduces the mock surface area.

---

### 6.3 MEDIUM: Mock Adapters Have Extra Methods Not in Port Interfaces

Several mock adapters expose test-helper methods (`withFile`, `withDirectory`, `reset`) alongside port methods. This is generally fine, but the mocks should be verified against the real interface:

- `MockFileSystemAdapter.basename()` -- used in tests but verify it matches the port signature exactly
- `MockTypeScriptAdapter` has fluent builder methods that expose internal state

---

## 7. Plugin-Specific Issues

### 7.1 MEDIUM: Silent Error Swallowing in Plugin Proxy

**File**: `src/infrastructure/plugin/language-service-proxy.ts:54,83`

```typescript
} catch {
  return tsDiags;  // error silently swallowed
}
```

The plugin swallows all errors without logging. In a language service plugin, this means bugs will be invisible -- the user will just see no KindScript diagnostics with no indication something is wrong.

**Action**: Log errors to tsserver's logger (`info.project.projectService.logger`) before returning the fallback.

---

### 7.2 MEDIUM: Plugin Proxy Copies Methods With `Object.keys`

**File**: `src/infrastructure/plugin/language-service-proxy.ts:29-36`

```typescript
for (const k of Object.keys(oldService) as Array<keyof ts.LanguageService>) {
  const method = oldService[k];
  if (typeof method === 'function') {
    (proxy as any)[k] = (...args: unknown[]) =>
      (method as (...a: unknown[]) => unknown).apply(oldService, args);
  }
}
```

`Object.keys()` only returns own enumerable properties. If `oldService` uses prototype methods or getters, they won't be proxied. This is a known fragility in TS plugin development.

---

## 8. Configuration and Build Issues

### 8.1 MEDIUM: `package.json` Lists `typescript` as Both `dependency` and `devDependency`

**File**: `package.json`

```json
{
  "devDependencies": {
    "typescript": "^5.3.0"
  },
  "dependencies": {
    "typescript": "^5.3.0"
  }
}
```

TypeScript appears in both sections. For a TS compiler plugin, it should be a `peerDependency` (the host project provides TypeScript), not a direct dependency. Bundling it as a dependency means users may end up with two TypeScript versions.

**Action**: Move `typescript` to `peerDependencies` and remove from `dependencies`.

---

### 8.2 LOW: Compiler Options Parsing is Hardcoded Enum Mapping

**File**: `src/infrastructure/adapters/typescript/typescript.adapter.ts:220-259`

Three methods (`parseScriptTarget`, `parseModuleKind`, `parseModuleResolution`) each maintain hardcoded string-to-enum maps. TypeScript's own API provides `ts.ScriptTarget[target]` and similar enum-from-string conversions. These hand-rolled maps will go stale as TypeScript adds new targets.

**Action**: Use TypeScript's built-in `ts.ScriptTarget` / `ts.ModuleKind` / `ts.ModuleResolutionKind` reverse lookups, or use `ts.parseCommandLine()` / `ts.convertCompilerOptionsFromJson()` which handle all options including future ones.

---

## 9. Testing Issues

### 9.1 MEDIUM: Architecture Validation Tests are Aspirational

**Files**: `tests/architecture/validation/*.validation.test.ts`

Multiple tests contain comments like:
- "The actual checking logic will be implemented in M1"
- "In M1, we'll implement this as a contract checker"
- "we're proving the domain model can represent this scenario"

These tests verify that domain entities can be **constructed** for various scenarios, but don't test any **behavioral logic**. They passed before any checking logic existed and will continue to pass regardless of checking bugs.

**Action**: Either evolve these into real behavioral tests that exercise contract checking, or remove/rename them to clarify they're structural/modeling tests, not validation tests.

---

### 9.2 LOW: Test Helper Duplication

`setupContextWithContracts()` is defined multiple times in `classify-ast.service.test.ts`. Common `ArchSymbol` and `Contract` construction is repeated across ~10 test files.

**Action**: Extract shared test factories into a `tests/helpers/` module.

---

## 10. Additional Domain-Layer Findings

### 10.1 MEDIUM: `ImportEdge.equals()` Omits `line` and `column`

**File**: `src/domain/value-objects/import-edge.ts:27-33`

The doc comment says "two edges are equal if all properties match", but the implementation only compares three of five fields:

```typescript
equals(other: ImportEdge): boolean {
  return (
    this.sourceFile === other.sourceFile &&
    this.targetFile === other.targetFile &&
    this.importPath === other.importPath
    // line and column NOT compared
  );
}
```

Two import edges at different line numbers in the same file targeting the same module are incorrectly considered equal. This could mask duplicate diagnostics or cause incorrect deduplication.

**Action**: Either include `line`/`column` in the comparison, or update the doc comment to state that location is intentionally excluded from equality.

---

### 10.2 MEDIUM: `Contract.argsEqual()` Compares Symbols by Name Only

**File**: `src/domain/entities/contract.ts:86-92`

```typescript
private argsEqual(otherArgs: ArchSymbol[]): boolean {
  return this.args.every((arg, i) => arg.name === otherArgs[i].name);
}
```

Two different `ArchSymbol` objects with the same name but different `declaredLocation` or `kind` are treated as equal. This means two contracts pointing at completely different directories could be considered identical if the symbols happen to share names.

**Action**: Add an `equals()` method to `ArchSymbol` that compares `name`, `kind`, and `declaredLocation`, then use it here.

---

### 10.3 LOW: Diagnostic Error Codes Are Magic Numbers

**File**: `src/domain/entities/diagnostic.ts`

Error codes 70001-70005 (and 70099 for validation errors in `check-contracts.service.ts:42`) are scattered as raw numeric literals across factory methods. There's no enum or constant registry.

**Action**: Create a `DiagnosticCode` enum or const object in `src/domain/constants/` to centralize these.

---

## 11. Summary Table

| # | Severity | Category | Issue | Location |
|---|----------|----------|-------|----------|
| 1 | Critical | Dead Code | `deno.json` points to deleted `lib/` | `deno.json` |
| 2 | Critical | Duplication | Plugin service duplicates ClassifyProject pipeline | `get-plugin-diagnostics.service.ts` |
| 3 | Critical | Type Safety | `as unknown as ASTNode` casting (8 locations) | `ast.adapter.ts` |
| 4 | High | Dead Code | `KindScriptConfig.contracts` field never read | `config.port.ts:12` |
| 5 | High | Duplication | Two import-walking methods in TypeScriptAdapter | `typescript.adapter.ts:59,119` |
| 6 | High | Duplication | `toString()` and `format()` near-identical | `diagnostic.ts:147,181` |
| 7 | High | Type Safety | `toTsSourceFile()` reconstructs AST from text | `ast.adapter.ts:220-226` |
| 8 | High | Type Safety | `unwrapProgram()` incomplete validation | `typescript.adapter.ts:185` |
| 9 | High | Memory | `checkerToProgram` Map never cleared | `typescript.adapter.ts:29` |
| 10 | High | Separation | `format()`/`formatWithContext()` on domain entity | `diagnostic.ts:147-176` |
| 11 | High | Separation | `CheckContractsService` creates duplicate Program | `check-contracts.service.ts:30` |
| 12 | High | Ports | `ASTPort` is a 23-method god interface | `ast.port.ts` |
| 13 | High | Ports | `TypeScriptPort` mixes compilation with analysis | `typescript.port.ts` |
| 14 | Medium | Dead Code | Test fixtures may reference removed config format | `tests/integration/fixtures/` |
| 15 | Medium | Duplication | `ContractReference` creation repeated 5x | `diagnostic.ts` |
| 16 | Medium | Type Safety | `checker` typed as `unknown` in private methods | `check-contracts.service.ts` |
| 17 | Medium | Separation | `DiagnosticPort` has formatting methods | `diagnostic.port.ts` |
| 18 | Medium | Separation | `toTSDiagnostic()` conversion in port interface | `language-service.port.ts:58` |
| 19 | Medium | Ports | Mock adapters have extra non-port methods | `testing/*.adapter.ts` |
| 20 | Medium | Plugin | Silent error swallowing in proxy | `language-service-proxy.ts:54,83` |
| 21 | Medium | Plugin | `Object.keys()` misses prototype methods | `language-service-proxy.ts:29` |
| 22 | Medium | Build | `typescript` in both deps and devDeps | `package.json` |
| 23 | Medium | Tests | Architecture validation tests are aspirational | `tests/architecture/validation/` |
| 24 | Medium | Domain | `ImportEdge.equals()` omits line/column | `import-edge.ts:27` |
| 25 | Medium | Domain | `Contract.argsEqual()` compares by name only | `contract.ts:86` |
| 26 | Low | Domain | Diagnostic error codes are magic numbers | `diagnostic.ts` |
| 27 | Low | Dead Code | `absc` empty executable stub | `absc` |
| 28 | Low | Build | Compiler options parsing hardcoded | `typescript.adapter.ts:220-259` |
| 29 | Low | Tests | Test helper duplication | `tests/unit/classify-ast.service.test.ts` |

---

## 11. Recommended Priority Order

### Immediate (Remove Dead Code)
1. Delete `deno.json` and `deno.lock`
2. Remove `KindScriptConfig.contracts` field
3. Delete `absc` stub file

### Next Sprint (Eliminate Duplication)
4. Refactor `GetPluginDiagnosticsService` to compose `ClassifyProjectUseCase`
5. Extract shared import-walking helper in `TypeScriptAdapter`
6. Have `toString()` delegate to `format()` on `Diagnostic`
7. Add `Contract.toReference()` to eliminate repeated `ContractReference` construction

### Architecture Improvements
8. Move `format()`/`formatWithContext()` from `Diagnostic` to `CLIDiagnosticAdapter`
9. Pass existing `Program` to `CheckContractsService` (avoid double program creation)
10. Slim `DiagnosticPort` to just `reportDiagnostics()`
11. Fix `TypeScriptAdapter.checkerToProgram` memory leak (use `WeakMap` or scope clearing)

### Longer Term
12. Split `TypeScriptPort` into `CompilerPort` + `CodeAnalysisPort`
13. Address `ASTAdapter` type casting with a proper branded wrapper or documented unsafe boundary
14. Add logging to plugin error handlers
15. Move `typescript` to `peerDependencies` in `package.json`
16. Use TS built-in compiler option parsing instead of hand-rolled maps

---

## 12. What's Working Well

- **Domain layer is genuinely pure**: Zero imports from infrastructure or application layers. All domain entities are immutable value objects or entities with factory methods.
- **Port/adapter boundaries are real**: Every adapter implements its port interface. No cross-adapter dependencies. Adapters are interchangeable with mocks.
- **Test organization is excellent**: Clear separation of unit/integration/architecture/e2e. Mocks use fluent APIs. Tests verify behavior, not implementation.
- **Use case pattern is consistent**: Every use case has a `.use-case.ts` interface, `.types.ts` DTOs, and `.service.ts` implementation. Clean and predictable.
- **CLI commands are thin adapters**: No business logic in commands. They parse arguments, delegate to services, and format output.
- ~~**Standard library packages are minimal**: Clean exported interfaces with pre-configured contracts. Good DX.~~ *(Removed — stdlib packages deleted from codebase)*

---

## 13. Implementation Plan

This plan addresses all 29 findings from the summary table. Items are grouped into four phases ordered by risk and dependency. Each item includes exact files to change and the specific modifications required.

---

### Phase 1: Remove Dead Code (Items 1, 4, 14, 27) -- DONE

These are safe deletions with no behavioral impact. They should be done first to reduce noise for later phases.

> **Status**: All 4 items complete. Tests pass (44 suites, 403 tests).

#### Item 1 — Delete `deno.json` and `deno.lock`

**Files to delete**:
- `deno.json`
- `deno.lock`

No other files reference these. Straight deletion.

---

#### Item 4 — Remove `KindScriptConfig.contracts` field

**File**: `src/application/ports/config.port.ts`

Remove the `contracts` field from the `KindScriptConfig` interface (line 12):

```typescript
// DELETE this field:
contracts?: Partial<Record<ContractType, unknown[]>>;
```

Then remove the `ContractType` import at line 1 (if no other field uses it — check first; it's only used by this dead field).

**Grep verification**: Search all files for `.contracts` property access on `KindScriptConfig` or `ksConfig.contracts` to confirm there are zero readers.

---

#### Item 14 — Clean up test fixture config files

**Files**:
- `tests/integration/fixtures/clean-arch-valid/kindscript.json`
- `tests/integration/fixtures/clean-arch-violation/kindscript.json`

Audit each fixture's `kindscript.json`. If any contain a `"contracts"` key (the dead Tier 1 format), remove it. Ensure all fixtures use the current `"definitions"` + `"packages"` format only.

---

#### Item 27 — Delete `absc` stub executable

**File to delete**: `absc` (root-level empty executable stub)

Also check `package.json` `"bin"` field — if `absc` is listed there, remove the entry. Only the `ksc` binary should remain.

---

### Phase 2: Eliminate Duplication (Items 2, 5, 6, 15, 29) -- DONE

Each of these collapses duplicated logic into a single canonical path.

> **Status**: Items 2, 5, 6, 15 complete. Item 29 (test helpers) deferred — low-value
> mechanical refactoring. Tests pass (44 suites, 405 tests).

#### Item 2 — Refactor `GetPluginDiagnosticsService` to use `ClassifyProjectUseCase`

**Problem**: `GetPluginDiagnosticsService.getDiagnostics()` (lines 62-116) duplicates the 8-step pipeline that `ClassifyProjectService` already implements.

**Files to change**:
1. `src/application/use-cases/get-plugin-diagnostics/get-plugin-diagnostics.service.ts`
2. `src/application/use-cases/get-plugin-diagnostics/get-plugin-diagnostics.types.ts`
3. `src/infrastructure/plugin/index.ts` (composition root rewiring)

**Steps**:

1. Add a `ClassifyProjectUseCase` dependency to `GetPluginDiagnosticsService`:

```typescript
constructor(
  private readonly checkContracts: CheckContractsUseCase,
  private readonly classifyProject: ClassifyProjectUseCase,  // NEW
) {}
```

2. Remove the existing dependencies that duplicate ClassifyProject's work: `configPort`, `fsPort`, `classifyService`, `tsPort`.

3. Replace the body of `getDiagnostics()` with:

```typescript
private getDiagnostics(request: GetPluginDiagnosticsRequest): Diagnostic[] {
  const result = this.classifyProject.execute({ projectRoot: request.projectRoot });
  if (!result.ok) return [];

  const checkResult = this.checkContracts.execute({
    symbols: result.symbols,
    contracts: result.contracts,
    config: result.config,
    programRootFiles: result.rootFiles,
  });

  return checkResult.diagnostics.filter(d => this.isRelevantToFile(d, request.fileName));
}
```

4. **Preserve the caching behavior**: The current `ClassifyCache` in `GetPluginDiagnosticsService` avoids re-classifying on every keystroke. Move the cache into `ClassifyProjectService` itself (or wrap ClassifyProject with a caching decorator) since the plugin is the primary consumer of cached classification:

```typescript
// In ClassifyProjectService, add optional caching:
private cache?: { definitionKey: string; result: ClassifyProjectResult };

execute(request: ClassifyProjectRequest): ClassifyProjectResult {
  // ... compute definitionKey from resolved paths ...
  if (this.cache?.definitionKey === definitionKey) return this.cache.result;
  // ... existing pipeline ...
  this.cache = { definitionKey, result };
  return result;
}
```

5. Delete the `classifyDefinitions()` private method and `ClassifyCache` interface from `GetPluginDiagnosticsService`.

6. Rewire `src/infrastructure/plugin/index.ts`:

```typescript
const classifyProject = new ClassifyProjectService(configAdapter, fsAdapter, tsAdapter, classifyService);
const diagnosticsService = new GetPluginDiagnosticsService(checkService, classifyProject);
```

---

#### Item 5 — Extract shared import-walking in `TypeScriptAdapter`

**File**: `src/infrastructure/adapters/typescript/typescript.adapter.ts`

**Problem**: `getImports()` (lines 59-95) and `getImportModuleSpecifiers()` (lines 119-138) both walk AST import declarations with `ts.forEachChild` + `ts.isImportDeclaration`.

**Steps**:

1. Extract a private helper that walks once and yields raw import data:

```typescript
private walkImportDeclarations(
  tsSourceFile: ts.SourceFile
): Array<{ node: ts.ImportDeclaration; specifier: string; line: number; column: number }> {
  const results: Array<{ node: ts.ImportDeclaration; specifier: string; line: number; column: number }> = [];

  ts.forEachChild(tsSourceFile, function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const pos = ts.getLineAndCharacterOfPosition(tsSourceFile, node.getStart());
      results.push({
        node,
        specifier: node.moduleSpecifier.text,
        line: pos.line + 1,
        column: pos.character,
      });
    }
    ts.forEachChild(node, visit);
  });

  return results;
}
```

2. Rewrite `getImports()` to call this helper and add resolution logic.

3. Rewrite `getImportModuleSpecifiers()` to call this helper and pluck `{ moduleName, line, column }`.

---

#### Item 6 — Unify `toString()` and `format()` on `Diagnostic`

**File**: `src/domain/entities/diagnostic.ts`

**Problem**: `toString()` (line 181-183) duplicates the first line of `format()` (line 148).

**Steps**:

1. Make `toString()` delegate to `format()`:

```typescript
toString(): string {
  return this.format();
}
```

This keeps `toString()` as the JavaScript convention entry point but eliminates the duplicated template string.

---

#### Item 15 — Add `Contract.toReference()` to eliminate repeated `ContractReference` construction

**Files**:
1. `src/domain/entities/contract.ts` — add `toReference()` method
2. `src/domain/entities/diagnostic.ts` — use it in all 5 factory methods

**Steps**:

1. Add to `Contract`:

```typescript
toReference(): ContractReference {
  return {
    contractName: this.name,
    contractType: this.type,
    location: this.location,
  };
}
```

(Requires adding `import { ContractReference } from '../value-objects/contract-reference';`)

2. Replace every inline `{ contractName: contract.name, contractType: contract.type, location: contract.location }` literal in `Diagnostic`'s factory methods with `contract.toReference()`. This affects `forbiddenDependency()`, `missingImplementation()`, `impureImport()`, `circularDependency()`, and `notColocated()`.

---

#### Item 29 — Extract shared test factories

**Files**:
1. Create `tests/helpers/factories.ts`
2. Refactor `tests/unit/classify-ast.service.test.ts` and other test files that repeat `ArchSymbol` / `Contract` construction

**Steps**:

1. Create `tests/helpers/factories.ts` with:

```typescript
export function makeSymbol(overrides?: Partial<ConstructorParameters<typeof ArchSymbol>>): ArchSymbol { ... }
export function makeContract(type: ContractType, name: string, args: ArchSymbol[]): Contract { ... }
export function makeDiagnostic(overrides?: Partial<ConstructorParameters<typeof Diagnostic>>): Diagnostic { ... }
```

2. Find all test files that construct `ArchSymbol`, `Contract`, or `Diagnostic` inline and replace with factory calls. Particularly target `setupContextWithContracts()` duplications in `classify-ast.service.test.ts`.

---

### Phase 3: Architecture and Separation of Concerns (Items 3, 7, 8, 9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 21, 24, 25, 26) -- DONE

These are the structural improvements. They should be done after duplication is removed so that each concern exists in exactly one place.

> **Status**: All items complete. Item 19 (mock adapters) confirmed as no-op — mocks are
> correctly designed with extra setup methods. Tests pass (44 suites, 405 tests).

#### Item 3 — Fix `as unknown as ASTNode` type safety in `ASTAdapter`

**File**: `src/infrastructure/adapters/ast/ast.adapter.ts`

**Problem**: 8 locations use `as unknown as ASTNode` double-casting. The `ASTNode` brand (`__brand?: 'ASTNode'`) is optional, so it's never enforced.

**Steps**:

1. In `src/application/ports/ast.port.ts`, make the brand required and use a unique symbol:

```typescript
declare const ASTNodeBrand: unique symbol;
export interface ASTNode {
  readonly [ASTNodeBrand]: true;
}
```

2. In `ASTAdapter`, create private wrap/unwrap helpers at the boundary:

```typescript
/** Documented unsafe boundary: wraps ts.Node as ASTNode for the port interface. */
private wrapNode(node: ts.Node): ASTNode {
  return node as unknown as ASTNode;
}

private wrapNodes(nodes: readonly ts.Node[]): ASTNode[] {
  return nodes.map(n => this.wrapNode(n));
}

private toTsNode(node: ASTNode): ts.Node {
  return node as unknown as ts.Node;
}
```

3. Replace all 8 bare `as unknown as ASTNode` casts with `this.wrapNode()` or `this.wrapNodes()`. This centralizes the unsafe boundary to two methods, making it auditable and greppable.

---

#### Item 7 — Fix `toTsSourceFile()` AST reconstruction from text

**File**: `src/infrastructure/adapters/ast/ast.adapter.ts` (lines 220-226)

**Problem**: The fallback `ts.createSourceFile(sourceFile.fileName, sourceFile.text, ...)` reconstructs a fresh AST from text, which is wasteful and produces a different AST object than what TypeScript uses internally.

**Root cause**: `TypeScriptAdapter.getSourceFile()` returns `{ fileName, text }` — it strips the real `ts.SourceFile` handle.

**Steps**:

1. In `src/application/ports/typescript.port.ts`, add an opaque handle to `SourceFile`:

```typescript
export interface SourceFile {
  fileName: string;
  text: string;
  /** Opaque handle for infrastructure adapters. Domain code must not inspect this. */
  readonly handle?: unknown;
}
```

2. In `TypeScriptAdapter.getSourceFile()` (line 37-41), preserve the real ts.SourceFile:

```typescript
getSourceFile(program: Program, fileName: string): SourceFile | undefined {
  const tsProgram = this.unwrapProgram(program);
  const sf = tsProgram.getSourceFile(fileName);
  if (!sf) return undefined;
  return { fileName: sf.fileName, text: sf.getFullText(), handle: sf };
}
```

Do the same for `getSourceFiles()`.

3. In `ASTAdapter.toTsSourceFile()`, use the handle directly:

```typescript
private toTsSourceFile(sourceFile: SourceFile): ts.SourceFile | undefined {
  if (sourceFile.handle) {
    return sourceFile.handle as ts.SourceFile;
  }
  // Fallback for test scenarios where handle isn't set
  return ts.createSourceFile(sourceFile.fileName, sourceFile.text, ts.ScriptTarget.Latest, true);
}
```

This eliminates the AST reconstruction in production while keeping tests working.

---

#### Item 8 — Strengthen `unwrapProgram()` validation

**File**: `src/infrastructure/adapters/typescript/typescript.adapter.ts` (line 185-190)

**Problem**: Only checks `getSourceFiles` exists. A random object with that method would pass.

**Steps**:

Replace with a more thorough check:

```typescript
private unwrapProgram(program: Program): ts.Program {
  const handle = program.handle;
  if (
    !handle ||
    typeof (handle as ts.Program).getSourceFiles !== 'function' ||
    typeof (handle as ts.Program).getTypeChecker !== 'function' ||
    typeof (handle as ts.Program).getSourceFile !== 'function'
  ) {
    throw new Error('Program does not contain a valid ts.Program handle. Was it created by this adapter?');
  }
  return handle as ts.Program;
}
```

---

#### Item 9 — Fix `checkerToProgram` memory leak

**File**: `src/infrastructure/adapters/typescript/typescript.adapter.ts` (line 29)

**Problem**: `checkerToProgram = new Map<unknown, ts.Program>()` entries are never removed. Each `getTypeChecker()` call adds an entry. Over time in the plugin context (long-lived process), this leaks programs.

**Steps**:

Replace the `Map` with a `WeakMap`:

```typescript
private checkerToProgram = new WeakMap<object, ts.Program>();
```

In `getTypeChecker()`:

```typescript
getTypeChecker(program: Program): TypeChecker {
  const tsProgram = this.unwrapProgram(program);
  const checker = tsProgram.getTypeChecker();
  this.checkerToProgram.set(checker, tsProgram);
  return checker as unknown as TypeChecker;
}
```

In `getImports()`:

```typescript
const tsChecker = checker as unknown as ts.TypeChecker;
const tsProgram = this.checkerToProgram.get(tsChecker as object);
```

`WeakMap` allows garbage collection of programs once their checker is no longer referenced.

---

#### Item 10 — Move formatting logic off `Diagnostic` entity

**Files**:
1. `src/domain/entities/diagnostic.ts` — remove `format()` and `formatWithContext()`
2. `src/infrastructure/adapters/cli/cli-diagnostic.adapter.ts` — move formatting here
3. `src/application/ports/diagnostic.port.ts` — keep `formatDiagnostic` (see Item 17 for cleanup)

**Steps**:

1. In `Diagnostic`, delete `format()` (lines 147-158) and `formatWithContext()` (lines 163-176). Keep `toString()` as a simple `"file:line:col KScode: message"` representation (it's a domain concern — human-readable identity).

2. In `CLIDiagnosticAdapter`, implement the formatting logic directly:

```typescript
formatDiagnostic(diagnostic: Diagnostic): string {
  let result = `${diagnostic.file}:${diagnostic.line}:${diagnostic.column} - error KS${diagnostic.code}: ${diagnostic.message}`;
  if (diagnostic.relatedContract) {
    result += `\n  Contract '${diagnostic.relatedContract.contractName}' (${diagnostic.relatedContract.contractType})`;
    if (diagnostic.relatedContract.location) {
      result += ` defined at ${diagnostic.relatedContract.location}`;
    }
  }
  return result;
}

formatWithContext(diagnostic: Diagnostic, sourceText: string): string {
  const lines = sourceText.split('\n');
  const lineIndex = diagnostic.line - 1;
  const lineText = lines[lineIndex] || '';
  const lineNumber = String(diagnostic.line);
  const padding = ' '.repeat(lineNumber.length);

  return [
    this.formatDiagnostic(diagnostic),
    '',
    `  ${lineNumber} | ${lineText}`,
    `  ${padding} | ${' '.repeat(diagnostic.column)}^`,
  ].join('\n');
}
```

3. Update `reportDiagnostics()` to call `this.formatDiagnostic()` instead of `diag.format()`.

4. Update any tests that call `diagnostic.format()` to use the adapter or `diagnostic.toString()`.

---

#### Item 11 — Pass existing `Program` to `CheckContractsService`

**Files**:
1. `src/application/use-cases/check-contracts/check-contracts.request.ts`
2. `src/application/use-cases/check-contracts/check-contracts.service.ts`
3. `src/application/use-cases/get-plugin-diagnostics/get-plugin-diagnostics.service.ts` (or its new form after Item 2)
4. `src/infrastructure/cli/commands/check.command.ts`

**Problem**: `CheckContractsService.execute()` creates a new `ts.Program` from `request.programRootFiles` even though the caller (`ClassifyProjectService`) already created one.

**Steps**:

1. Change `CheckContractsRequest` to accept a `Program` instead of `programRootFiles`:

```typescript
export interface CheckContractsRequest {
  symbols: ArchSymbol[];
  contracts: Contract[];
  config: KindScriptConfig;
  program: Program;          // CHANGED from programRootFiles: string[]
}
```

2. In `CheckContractsService.execute()`, remove lines 30-35 (program creation). Use `request.program` directly:

```typescript
execute(request: CheckContractsRequest): CheckContractsResponse {
  const diagnostics: Diagnostic[] = [];
  let filesAnalyzed = 0;
  const program = request.program;
  const checker = this.tsPort.getTypeChecker(program);
  // ... rest unchanged ...
}
```

3. In `ClassifyProjectService`, return the `Program` in the result type and pass it through to callers.

4. Update `ClassifyProjectResult` to include `program: Program`:

```typescript
export type ClassifyProjectResult =
  | { ok: false; error: string }
  | { ok: true; symbols: ArchSymbol[]; contracts: Contract[]; /* ... */ program: Program; rootFiles: string[]; /* ... */ };
```

5. In `CheckCommand` and `GetPluginDiagnosticsService`, pass `result.program` into `CheckContractsRequest` instead of `result.rootFiles`.

6. Remove `TypeScriptPort` from `CheckContractsService` constructor — it no longer needs to create programs:

```typescript
constructor(
  private readonly tsPort: TypeScriptPort,  // still needed for getImports, getSourceFile, etc.
  private readonly fsPort: FileSystemPort
) {}
```

Actually, `TypeScriptPort` is still needed for `getImports()`, `getSourceFile()`, etc. Only the `createProgram` call is removed.

---

#### Item 12 — Split `ASTPort` god interface

**File**: `src/application/ports/ast.port.ts` (23 methods)

**Steps**:

Split into three focused interfaces based on responsibility:

1. **`ASTNodePort`** — Node type checking and property access (the low-level queries):

```typescript
export interface ASTNodePort {
  isInterfaceDeclaration(node: ASTNode): boolean;
  isVariableStatement(node: ASTNode): boolean;
  isObjectLiteral(node: ASTNode): boolean;
  isCallExpression(node: ASTNode): boolean;
  isArrayLiteral(node: ASTNode): boolean;
  getDeclarationName(node: ASTNode): string | undefined;
  getStringValue(node: ASTNode): string | undefined;
  getInitializer(node: ASTNode): ASTNode | undefined;
}
```

2. **`ASTDeclarationPort`** — Interface and variable declaration queries:

```typescript
export interface ASTDeclarationPort {
  getHeritageTypeNames(node: ASTNode): string[];
  getHeritageTypeArgLiterals(node: ASTNode): string[];
  getPropertySignatures(node: ASTNode): Array<{ name: string; typeName?: string }>;
  getVariableDeclarations(node: ASTNode): ASTNode[];
  getVariableTypeName(node: ASTNode): string | undefined;
}
```

3. **`ASTExpressionPort`** — Call expression and collection queries:

```typescript
export interface ASTExpressionPort {
  getCallExpressionName(node: ASTNode): string | undefined;
  getCallTypeArgumentNames(node: ASTNode): string[];
  getCallArguments(node: ASTNode): ASTNode[];
  getObjectProperties(node: ASTNode): Array<{ name: string; value: ASTNode }>;
  getArrayElements(node: ASTNode): ASTNode[];
}
```

4. **`ASTTraversalPort`** — Statement-level traversal:

```typescript
export interface ASTTraversalPort {
  getStatements(sourceFile: SourceFile): ASTNode[];
  forEachStatement(sourceFile: SourceFile, callback: (node: ASTNode) => void): void;
}
```

5. Compose them into a single `ASTPort` type alias for backward compatibility during transition:

```typescript
export type ASTPort = ASTNodePort & ASTDeclarationPort & ASTExpressionPort & ASTTraversalPort;
```

6. `ASTAdapter` still implements all methods (it implements `ASTPort`). Consumers can depend on just the sub-interface they need. Update `ClassifyASTService` constructor to take the specific sub-interfaces it uses.

---

#### Item 13 — Split `TypeScriptPort`

**File**: `src/application/ports/typescript.port.ts`

**Steps**:

Split into two focused interfaces:

1. **`CompilerPort`** — Program lifecycle:

```typescript
export interface CompilerPort {
  createProgram(rootFiles: string[], options: CompilerOptions): Program;
  getSourceFile(program: Program, fileName: string): SourceFile | undefined;
  getSourceFiles(program: Program): SourceFile[];
  getTypeChecker(program: Program): TypeChecker;
  getDiagnostics(program: Program): Diagnostic[];
}
```

2. **`CodeAnalysisPort`** — Source-level analysis:

```typescript
export interface CodeAnalysisPort {
  getImports(sourceFile: SourceFile, checker: TypeChecker): ImportEdge[];
  getImportModuleSpecifiers(program: Program, sourceFile: SourceFile): Array<{ moduleName: string; line: number; column: number }>;
  getExportedInterfaceNames(program: Program, sourceFile: SourceFile): string[];
  hasClassImplementing(program: Program, sourceFile: SourceFile, interfaceName: string): boolean;
}
```

3. Backward-compatible type alias:

```typescript
export type TypeScriptPort = CompilerPort & CodeAnalysisPort;
```

4. `TypeScriptAdapter` still implements `TypeScriptPort`. Update consumers to depend on just the sub-interface they need:
   - `ClassifyProjectService` uses `CompilerPort` (creates programs, gets source files)
   - `CheckContractsService` uses `CodeAnalysisPort` + `CompilerPort` (for getImports, getSourceFile, etc.)

---

#### Item 16 — Fix `checker` typed as `unknown` in `CheckContractsService`

**File**: `src/application/use-cases/check-contracts/check-contracts.service.ts`

**Problem**: `checker: unknown` parameter on `checkNoDependency()` (line 95) and `checkNoCycles()` (line 165).

**Steps**:

Change the parameter type from `unknown` to `TypeChecker`:

```typescript
private checkNoDependency(
  contract: Contract,
  program: Program,
  checker: TypeChecker  // was: unknown
): { diagnostics: Diagnostic[]; filesAnalyzed: number } {
```

Remove the cast `checker as ReturnType<TypeScriptPort['getTypeChecker']>` on lines 117 and 197 — just pass `checker` directly.

Add `import { TypeChecker } from '../../ports/typescript.port';` at the top.

---

#### Item 17 — Slim `DiagnosticPort` to just `reportDiagnostics()`

**File**: `src/application/ports/diagnostic.port.ts`

**Problem**: `formatDiagnostic()` and `formatWithContext()` just delegate to `Diagnostic.format()` — they're pure pass-throughs that add no value as port methods.

**Steps**:

1. Remove `formatDiagnostic()` and `formatWithContext()` from the interface:

```typescript
export interface DiagnosticPort {
  reportDiagnostics(diagnostics: Diagnostic[]): void;
}
```

2. In `CLIDiagnosticAdapter`, keep the format methods as public methods but they're no longer port requirements — they're adapter-specific utilities used by `reportDiagnostics()` internally.

3. In `MockDiagnosticAdapter`, remove the two methods from the interface implementation.

4. Update any callers that call `diagnosticPort.formatDiagnostic()` to either use the adapter directly or use `diagnostic.toString()`.

---

#### Item 18 — Remove `toTSDiagnostic()` from `LanguageServicePort`

**File**: `src/application/ports/language-service.port.ts`

**Problem**: `toTSDiagnostic()` at line 58 is a conversion concern that belongs in infrastructure, not in the port interface.

**Steps**:

1. Remove `toTSDiagnostic()` from `LanguageServicePort` interface.

2. The conversion is already handled by `diagnostic-converter.ts` (`convertToTSDiagnostic()`), which is in the infrastructure layer. Callers (`language-service-proxy.ts:50`) already use the standalone function. So `LanguageServicePort.toTSDiagnostic()` is unused dead code — simply delete it.

3. Remove the same method from `LanguageServiceAdapter` (if it implements it).

---

#### Item 19 — Remove extra non-port methods from mock adapters

**Files**:
- `src/infrastructure/adapters/testing/mock-config.adapter.ts`
- `src/infrastructure/adapters/testing/mock-filesystem.adapter.ts`
- `src/infrastructure/adapters/testing/mock-diagnostic.adapter.ts`

**Problem**: Mock adapters have extra methods (`reset()`, fluent builders like `withKindScriptConfig()`) that aren't on the port interface. This is actually **correct design** — mocks legitimately have setup methods. However, tests should type their variables as the mock class, not the port interface, to access these.

**Steps**:

This is a test hygiene fix, not a code change to the mocks themselves. In test files, ensure mock instances are typed as their concrete class:

```typescript
// CORRECT:
const mockConfig = new MockConfigAdapter();  // has .withKindScriptConfig()
// Pass as port type to service constructor:
new ClassifyProjectService(mockConfig as ConfigPort, ...);

// INCORRECT:
const mockConfig: ConfigPort = new MockConfigAdapter();  // loses .withKindScriptConfig()
```

Audit test files and fix any that type mocks as the port interface instead of the concrete mock class.

---

#### Item 20 — Add logging to plugin error handlers

**File**: `src/infrastructure/plugin/language-service-proxy.ts`

**Problem**: Lines 54 and 83 have empty `catch` blocks — errors are silently swallowed.

**Steps**:

1. Thread the `info` parameter's logger through to the catch blocks:

```typescript
export function createLanguageServiceProxy(
  info: ts.server.PluginCreateInfo,
  // ... existing params ...
): ts.LanguageService {
  const logger = info.project.projectService.logger;
  // ...

  proxy.getSemanticDiagnostics = (fileName: string): ts.Diagnostic[] => {
    // ...
    try {
      // ...
    } catch (e) {
      logger.info(`[kindscript] Error in getSemanticDiagnostics: ${e}`);
      return tsDiags;
    }
  };

  proxy.getCodeFixesAtPosition = (...) => {
    // ...
    try {
      // ...
    } catch (e) {
      logger.info(`[kindscript] Error in getCodeFixesAtPosition: ${e}`);
      return tsFixes;
    }
  };
}
```

---

#### Item 21 — Replace `Object.keys()` proxy pattern

**File**: `src/infrastructure/plugin/language-service-proxy.ts` (lines 29-36)

**Problem**: `Object.keys(oldService)` only captures own enumerable properties. If `oldService` has prototype methods, they won't be proxied.

**Steps**:

Replace `Object.keys()` with iteration over all properties in the prototype chain:

```typescript
// Proxy all methods from the original service
const keys = new Set<string>();
for (let obj = oldService; obj; obj = Object.getPrototypeOf(obj)) {
  for (const k of Object.getOwnPropertyNames(obj)) {
    keys.add(k);
  }
}

for (const k of keys) {
  const method = (oldService as any)[k];
  if (typeof method === 'function') {
    (proxy as any)[k] = (...args: unknown[]) =>
      method.apply(oldService, args);
  }
}
```

---

#### Item 24 — Fix `ImportEdge.equals()` to include location

**File**: `src/domain/value-objects/import-edge.ts`

**Steps**:

Update `equals()` to compare all five properties:

```typescript
equals(other: ImportEdge): boolean {
  return (
    this.sourceFile === other.sourceFile &&
    this.targetFile === other.targetFile &&
    this.importPath === other.importPath &&
    this.line === other.line &&
    this.column === other.column
  );
}
```

Update the doc comment to reflect that full value equality is now enforced.

---

#### Item 25 — Fix `Contract.argsEqual()` to use `ArchSymbol.equals()`

**Files**:
1. `src/domain/entities/arch-symbol.ts` — add `equals()` method
2. `src/domain/entities/contract.ts` — update `argsEqual()` to use it

**Steps**:

1. Add `equals()` to `ArchSymbol`:

```typescript
equals(other: ArchSymbol): boolean {
  return (
    this.name === other.name &&
    this.kind === other.kind &&
    this.declaredLocation === other.declaredLocation
  );
}
```

2. Update `Contract.argsEqual()`:

```typescript
private argsEqual(otherArgs: ArchSymbol[]): boolean {
  if (this.args.length !== otherArgs.length) return false;
  return this.args.every((arg, i) => arg.equals(otherArgs[i]));
}
```

---

#### Item 26 — Create `DiagnosticCode` constants

**Files**:
1. Create `src/domain/constants/diagnostic-codes.ts`
2. Update `src/domain/entities/diagnostic.ts` to use the constants
3. Update `src/application/use-cases/check-contracts/check-contracts.service.ts` (line 42, code 70099)

**Steps**:

1. Create the constants file:

```typescript
/** Centralized error codes for KindScript diagnostics (70000 range). */
export const DiagnosticCode = {
  ForbiddenDependency: 70001,
  MissingImplementation: 70002,
  ImpureImport: 70003,
  CircularDependency: 70004,
  NotColocated: 70005,
  InvalidContract: 70099,
} as const;

export type DiagnosticCode = typeof DiagnosticCode[keyof typeof DiagnosticCode];
```

2. In `Diagnostic` factory methods, replace magic numbers:

```typescript
import { DiagnosticCode } from '../constants/diagnostic-codes';

static forbiddenDependency(edge: ImportEdge, contract: Contract): Diagnostic {
  return new Diagnostic(
    `Forbidden dependency: ${edge.sourceFile} → ${edge.targetFile}`,
    DiagnosticCode.ForbiddenDependency,
    // ...
  );
}
```

3. In `CheckContractsService`, replace `70099` with `DiagnosticCode.InvalidContract`.

---

### Phase 4: Build and Tooling (Items 22, 23, 28) -- DONE

> **Status**: All 3 items complete. Tests pass (44 suites, 405 tests).
> Item 22: Moved `typescript` to `peerDependencies`.
> Item 23: Evolved validation tests into real behavioral tests using `CheckContractsService`.
> Item 28: Replaced hand-rolled compiler option parsing with `ts.convertCompilerOptionsFromJson()`.

#### Item 22 — Fix `typescript` dual dependency

**File**: `package.json`

**Steps**:

1. Remove `typescript` from `dependencies`.
2. Keep `typescript` in `devDependencies` (for building the project).
3. Add `typescript` to `peerDependencies`:

```json
{
  "peerDependencies": {
    "typescript": ">=5.3.0"
  }
}
```

This ensures consumers use their own TypeScript version, avoiding version duplication at runtime.

---

#### Item 23 — Evolve or reclassify architecture validation tests

**Files**: `tests/architecture/validation/*.validation.test.ts`

**Steps**:

There are two viable approaches — choose one:

**Option A: Evolve into real behavioral tests**

For each validation test that says "in M1 we'll implement..." — write the actual behavioral assertion. For example, if a test constructs a NoDependency contract and two symbols, also call `CheckContractsService.execute()` with a mock program and verify the expected diagnostics.

**Option B: Rename to clarify intent**

Rename the test files from `*.validation.test.ts` to `*.modeling.test.ts` and update describe blocks to say "Domain Modeling" instead of "Validation". This prevents confusion about what these tests actually verify.

Recommend **Option A** since these tests already have the setup code — they just need the assertion.

---

#### Item 28 — Use TypeScript's built-in compiler option parsing

**File**: `src/infrastructure/adapters/typescript/typescript.adapter.ts` (lines 220-259)

**Steps**:

Replace the three `parseScriptTarget()`, `parseModuleKind()`, and `parseModuleResolution()` methods and the entire `toTsCompilerOptions()` method with TypeScript's built-in parsing:

```typescript
private toTsCompilerOptions(options: CompilerOptions): ts.CompilerOptions {
  const { options: parsed } = ts.convertCompilerOptionsFromJson(options, '.');
  return parsed;
}
```

`ts.convertCompilerOptionsFromJson()` handles all string-to-enum conversions for `target`, `module`, `moduleResolution`, `jsx`, `lib`, and every other option — including any added in future TypeScript versions.

Delete `parseScriptTarget()`, `parseModuleKind()`, and `parseModuleResolution()`.

---

### Phase Dependency Graph

```
Phase 1 (Items 1, 4, 14, 27)    ← No dependencies, safe deletions
    ↓
Phase 2 (Items 2, 5, 6, 15, 29) ← Removes duplication first
    ↓
Phase 3 (Items 3, 7-13, 16-21, 24-26) ← Structural changes on de-duped code
    ↓
Phase 4 (Items 22, 23, 28)      ← Build/tooling, can be done in parallel with Phase 3
```

Each phase should end with a full test run (`npm test`) to catch regressions before moving to the next phase.

---

### Estimated Impact

| Phase | Files Changed | Files Deleted | Files Created |
|-------|--------------|---------------|---------------|
| 1 | 2 | 3 | 0 |
| 2 | ~12 | 0 | 1 |
| 3 | ~20 | 0 | 2 |
| 4 | ~5 | 0 | 0 |
| **Total** | **~39** | **3** | **3** |
