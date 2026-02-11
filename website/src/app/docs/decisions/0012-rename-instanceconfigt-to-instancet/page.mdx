# 12. Rename `InstanceConfig<T>` to `Instance<T>`

Date: 2026-02-08
Status: Done

**Date:** 2026-02-08
**Status:** Done

### Context

The public API type `InstanceConfig<T>` served as the projection from a Kind type to its instance value shape (used with `satisfies`). The name was verbose and the type-theoretic relationship was indirect — users had to understand `Kind`, `InstanceConfig`, and `MemberMap` as three separate concepts.

Research across Haskell (class/instance), Scala (trait/given), Rust (trait/impl), OCaml (module type/structure), and TypeScript ecosystem tools (Zod, Effect-TS, Vite) confirmed that every system uses a schema→instance projection, and most call the instance side "instance."

### Decision

Rename `InstanceConfig<T>` to `Instance<T>`. Keep `MemberMap<T>` as an internal implementation detail (still exported for cross-module use, but not documented as part of the public API).

### Rationale

- `Instance<T>` communicates the type-theoretic relationship clearly: "this value satisfies Instance of OrderingContext"
- Mirrors naming conventions across Haskell (`class`/`instance`), Scala (`trait`/`given`), Rust (`trait`/`impl`)
- Reduces public API surface from 4 types to 3 user-facing types: `Kind`, `Instance`, `Constraints`
- `MemberMap` becomes an internal projection mechanism, not a concept users need to learn
- No deprecated alias — pre-1.0 with no external users, clean break preferred
- Mechanical rename with no logic changes

### Impact

- Public API: `Kind`, `Instance<T>`, `Constraints` (3 user-facing types)
- AST adapter: detection string changed from `'InstanceConfig'` to `'Instance'`
- ~355 occurrences renamed across ~58 files (source, tests, fixtures, docs, notebooks)
- All 276 tests passing, no behavioral changes

---
