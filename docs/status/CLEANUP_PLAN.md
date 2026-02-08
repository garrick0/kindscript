# Cleanup Plan

Unified plan for remaining codebase cleanup. Merges the prior multiplicity analysis and backward-compatibility audit into a single, verified document. Every item has been re-audited against the current codebase state (v0.8.0-m8).

---

## Corrections to Prior Analyses

| Prior Claim | Reality |
|-------------|---------|
| `ContractReference` is potentially dead code | **Wrong.** Actively used: `Contract.toReference()` called by all `Diagnostic` factory methods; `Diagnostic.relatedContract` read by `cli-diagnostic.adapter.ts`. Keep it. |
| `tests/architecture/validation/` contains validation tests | **Wrong.** Directory does not exist. Tests are in `tests/unit/`, `tests/integration/`, `tests/e2e/`. |
| Fixture `clean-arch-valid` can be deleted as duplicate | **Reconsidered.** Each of the 5 clean-arch fixtures enters through a different pipeline. Keep all. |
| Monolithic test files need splitting | **Done.** Split into focused files (Phase 2C complete). |

---

## Phase 1: Stale Comments and Documentation (Trivial)

### 1.1 Update `ArchSymbol` docstring
**File:** `src/domain/entities/arch-symbol.ts:7-8`
The terms "layer, module, context, port, adapter" are no longer `ArchSymbolKind` variants. The enum now has only `Member`, `Kind`, `Instance`.

### 1.2 Update `factories.ts` docstring
**File:** `tests/helpers/factories.ts:14`
Says "Defaults to Layer kind" but the code defaults to `ArchSymbolKind.Member`.

### 1.3 Reframe composite port comments
**Files:** `src/application/ports/ast.port.ts:60-65`, `src/application/ports/typescript.port.ts:47-52`
Both say "kept for backward compatibility" but the composite types are actively used everywhere. Reframe to describe them as convenience types.

---

## Phase 2: Dead Code Removal (Small)

### 2.1 Remove `forEachStatement` from `ASTTraversalPort`
Defined in port, implemented in both adapters, tested — but never called from any application/domain code. The classifier uses `getStatements()` exclusively.

### 2.2 Remove `ArchSymbol.hasContract()`
Defined in `ArchSymbol`, tested — but never called from any production code.

### 2.3 Remove `ArchSymbol.contracts` field
The `contracts: ContractReference[]` field is never populated with real data. Every construction passes `[]` or uses the default. Contracts are kept as a separate top-level array in classification results.

---

## Phase 3: Dependency Narrowing (Small)

### 3.1 Narrow `ClassifyProjectService` to `CompilerPort`
**File:** `src/application/use-cases/classify-project/classify-project.service.ts`
Uses only `createProgram()`, `getTypeChecker()`, `getSourceFile()` — all from `CompilerPort`. Change constructor param type from `TypeScriptPort` to `CompilerPort`.

---

## Execution Order

Phases 1+2+3 are independent (can run in parallel). Run tests after each phase.

**Note:** Former Phases 4 (Consolidate InferredContracts) and 5 (Extract Naming Conventions) are now moot — the detect/infer architecture functionality has been removed.

---

## Items Deliberately Kept (No Action)

| Item | Why |
|------|-----|
| 5 clean-arch fixtures | Different pipeline entry points |
| 3 dependency representations | Natural abstraction ladder (file→layer→policy) |
| `Contract` vs `ContractReference` | Entity (full validation) vs lightweight VO (diagnostics) |
| `ASTPort` / `TypeScriptPort` composites | Useful convenience types (fix comments, keep types) |
| 6 mock adapters | Clean 1:1 port mapping |
