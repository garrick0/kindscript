# 4. Use `satisfies` Instead of Runtime Markers

Date: 2026-02-07
Status: Done

**Date:** 2026-02-07
**Status:** Done

### Context

Users previously wrote `locate<T>("root", { ... })` and `defineContracts<T>({ ... })` — runtime function calls that were identity no-ops. KindScript's classifier matched them syntactically but never executed them.

### Decision

Replace all runtime markers with `satisfies` expressions and `import type`. Instances use `{ ... } satisfies Instance<T>`. Constraints move to the Kind type's 3rd parameter. All imports become `import type` (fully erased from output).

### Rationale

- `locate()` and `defineContracts()` required `kindscript` as a real dependency (not just `devDependencies`)
- The runtime no-ops shipped in production bundles if definition files were accidentally included
- `satisfies` is valid TypeScript with zero runtime cost
- `import type` is fully erased — KindScript becomes a devDependency only
- The Kind syntax change (D3) was already breaking, so the incremental cost of also changing instance syntax was near zero

---
