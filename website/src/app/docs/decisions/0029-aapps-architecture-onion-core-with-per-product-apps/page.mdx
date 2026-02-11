# 29. A+Apps Architecture — Onion Core with Per-Product Apps

Date: 2026-02-08
Status: Done

**Date:** 2026-02-08
**Status:** Done

### Context

The codebase was initially organized as flat layers (`src/domain/`, `src/application/`, `src/infrastructure/`, `src/cli/`, `src/plugin/`). This structure had two issues:

1. **Ports at wrong level** — `src/application/ports/` contained all ports, including product-specific ones (`DiagnosticPort` for CLI, `LanguageServicePort` for Plugin). This violated dependency inversion — the application layer shouldn't know about products.

2. **No clear composition roots** — Each product (CLI and Plugin) scattered its adapters, ports, and use cases across multiple top-level directories. It was unclear where each product's dependency graph was wired together.

The four-stage pipeline (D10) organized the application layer's internal structure, but the top-level organization still mixed core services with product-specific concerns.

### Decision

Reorganize into "A+Apps+Pipeline":

```
src/
├── types/index.ts          # Public API
├── domain/                 # Pure domain entities
├── application/            # Core services (pipeline/)
├── infrastructure/         # Shared driven adapters (TypeScript, FileSystem, Config, AST)
└── apps/                   # Per-product composition roots
    ├── cli/                # CLI product
    │   ├── main.ts         # Entry point + DI composition
    │   ├── ports/          # ConsolePort, DiagnosticPort
    │   ├── adapters/       # CLIConsoleAdapter, CLIDiagnosticAdapter
    │   └── commands/       # CheckCommand
    └── plugin/             # Language service plugin product
        ├── index.ts        # Entry point + DI composition
        ├── ports/          # LanguageServicePort
        ├── adapters/       # LanguageServiceAdapter
        └── use-cases/      # GetPluginDiagnosticsService
```

**Key principles:**

1. **Onion core** — Domain → Application → Infrastructure form a layered core with shared services
2. **Apps depend inward only** — Each app depends on the core but not on other apps
3. **Per-product composition** — Each app has its own `main.ts`/`index.ts` that wires dependencies
4. **Minimal Engine interface** — Core exports `Engine = { pipeline, plugins }` via `createEngine()`
5. **Product-specific ports in apps** — `ConsolePort` belongs to CLI, `LanguageServicePort` belongs to Plugin

### Rationale

**Alternatives considered:**

1. **Hexagonal/Ports+Adapters** — all adapters at top level. Rejected: doesn't distinguish between shared infrastructure adapters (TypeScript, FileSystem) and product-specific adapters (CLI console, LSP proxy).

2. **Feature slices** — organize by feature (`check-contracts/`, `classify-ast/`). Rejected: KindScript's pipeline stages have clear dependencies; slicing would obscure the data flow.

3. **Monorepo with packages** — split CLI and Plugin into separate npm packages. Rejected: premature for a project with 2 products that share 95% of code.

**Why A+Apps:**

- **Clear ownership** — new CLI-specific code goes in `apps/cli/`, new plugin-specific code in `apps/plugin/`
- **Testable in isolation** — each app's ports can be mocked independently
- **Minimal coupling** — apps depend on `Engine` interface, not on concrete classes
- **Industry precedent** — matches NestJS modules, Nx app workspace, and Go's cmd/ convention

### Impact

- Moved `src/cli/` → `apps/cli/` (added ports/, adapters/, kept commands/)
- Moved `src/plugin/` → `apps/plugin/` (added ports/, kept use-cases/)
- Created `application/engine.ts` (Engine interface) and `infrastructure/engine-factory.ts`
- Removed product-specific ports from `application/ports/` (only 4 shared ports remain: ASTPort, TypeScriptPort, FileSystemPort, ConfigPort)
- Each app's entry point calls `createEngine()` then wires product-specific adapters
- Mock adapters moved from `infrastructure/` to `tests/helpers/mocks/`
- 29 test files reorganized to match new structure
- 277 tests passing after restructure

---
