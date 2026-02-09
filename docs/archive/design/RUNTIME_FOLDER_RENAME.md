# Decision: Flatten `src/runtime/` Into `src/index.ts`

**Date:** 2026-02-08
**Status:** Done

## Context

`src/runtime/` contained two files exporting four type-only exports (`Kind`, `Constraints`, `MemberMap`, `Instance`) — the entire user-facing API of KindScript. The name "runtime" was a leftover from when the folder contained actual runtime functions (`locate()`, `defineContracts()`). Those were removed; everything became `export type`. The name contradicted the project's "zero runtime footprint" value proposition.

## Decision

Flattened all types into `src/index.ts`. Deleted `src/runtime/`. Updated all `.k.ts` fixture files to `import type { Kind, Instance } from 'kindscript'` instead of inlining type definitions.

## Rationale

- ~65 lines of type-only code doesn't need its own directory.
- `src/index.ts` was the only consumer.
- Research across 14 tools (Zod, Vite, Rollup, ESLint, ArkType, Effect, etc.) showed no tool separates user-facing types into a subfolder or separate package. Types export from the package root.
- A separate `@kindscript/types` npm package was considered and rejected — the types and engine must stay in sync, and the overhead of a second package (build config, publish pipeline, version matrix) outweighs any benefit for ~65 lines.

## Fixture Module Resolution

The `.k.ts` fixtures import from `'kindscript'` but the module doesn't resolve in test contexts (no `node_modules/kindscript`). Tests pass because the AST adapter matches structurally (identifier names, not resolved types). This is accepted as-is — if it ever becomes a problem, a Jest `globalSetup` symlink (like `notebooks/lib.ts` does) is a 10-line fix.
