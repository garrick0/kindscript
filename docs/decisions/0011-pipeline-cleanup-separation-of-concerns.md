# 11. Pipeline Cleanup — Separation of Concerns

Date: 2026-02-08
Status: Done

**Date:** 2026-02-08
**Status:** Done

### Context

After the four-stage pipeline alignment (D10), several cross-cutting concerns remained entangled: view DTOs lived in port files, contract plugins were split across `bind/` and `check/`, `PipelineService` handled both program setup and stage orchestration, and the `Engine` interface exposed infrastructure details (`fs`, `ts`) that no app consumed.

### Decision

Five targeted changes to improve separation of concerns:

1. **Extract view types** — Move `TypeNodeView`, `KindDefinitionView`, etc. from `ast.port.ts` into `pipeline/views.ts`. The port re-exports them for adapter compatibility.
2. **Extract plugins** — Move `ConstraintProvider`, `ContractPlugin`, plugin registry, and all 6 plugin implementations into a neutral `pipeline/plugins/` directory (shared by bind + check stages).
3. **Add use-case interfaces** — Each stage (scan, parse, bind) gets a use-case interface (`ScanUseCase`, `ParseUseCase`, `BindUseCase`). `PipelineService` depends on interfaces, not concrete classes.
4. **Extract ProgramFactory** — Config reading, file discovery, and TS program creation move from `PipelineService` into `ProgramFactory` behind a `ProgramPort` interface.
5. **Slim Engine** — Remove unused `fs` and `ts` from `Engine` interface. Apps only use `pipeline` and `plugins`.

### Rationale

- **View types in port files** — violated Interface Segregation; pipeline stages needed AST port just for DTOs
- **Plugins split across stages** — `ContractPlugin extends ConstraintProvider` created a cross-stage dependency; neutral `plugins/` directory resolves this
- **Concrete stage dependencies** — made `PipelineService` hard to test without real services; interfaces enable mock injection
- **PipelineService doing too much** — program setup is independent of stage orchestration; extracting it follows Single Responsibility
- **Engine surface area** — `fs` and `ts` were never consumed by any app; removing them reduces coupling

### Impact

- 276 tests, 29 files, 100% passing
- No public API changes
- `PipelineService` constructor: 6 interface-typed dependencies
- `Engine` interface: `{ pipeline, plugins }` only

---
