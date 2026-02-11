# 10. Four-Stage Pipeline Alignment

Date: 2026-02-08
Status: Done

**Date:** 2026-02-08
**Status:** Done

### Context

KindScript's application layer was organized by capability (`classification/` + `enforcement/`), but `ClassifyASTService.execute()` was doing three distinct jobs in one method: extracting raw AST views (scanning), building ArchSymbol trees (parsing), and generating Contracts from constraint trees (binding). This entanglement made it hard to reason about, test, and extend each concern independently.

### Decision

Decompose the application layer into four explicit pipeline stages aligned with TypeScript's compiler terminology: **Scanner → Parser → Binder → Checker**. Replace `classification/` + `enforcement/` + `services/` with a single `pipeline/` directory.

### Rationale

- **TypeScript alignment** — using the same stage names (scan, parse, bind, check) makes the architecture immediately recognizable to TypeScript compiler contributors and readers
- **Single Responsibility** — each stage has one job with clear input/output types (`ScanResult` → `ParseResult` → `BindResult` → `CheckerResponse`)
- **Testability** — stages can be tested independently with mock inputs; the three classify-ast test files naturally map to scan, parse, and bind
- **Simplified orchestration** — `PipelineService` absorbs `ClassifyProjectService` + `RunPipelineService` into one orchestrator that owns config, program creation, caching, and the stage chain
- **Simpler Engine** — the `Engine` interface shrinks from `{ classifyProject, checkContracts, runPipeline, plugins, fs, ts }` to `{ pipeline, plugins }` (further slimmed in D11)

### Impact

- Deleted `classification/`, `enforcement/`, `services/` directories
- Created `pipeline/scan/`, `pipeline/parse/`, `pipeline/bind/`, `pipeline/check/`
- Renamed `CheckContractsService` → `CheckerService`
- Merged `ClassifyProjectService` + `RunPipelineService` → `PipelineService`
- Absorbed `resolveSymbolFiles()` into `ParseService` as a private method
- All 29 test files, 277 tests updated and passing

---
