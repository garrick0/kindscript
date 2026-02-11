# 18. Semantic Error Messages

Date: 2026-02-10
Status: Done

**Date:** 2026-02-10
**Status:** Done

### Context

KindScript's diagnostic messages reported violations using raw file paths:

```
Forbidden dependency: src/domain/service.ts -> src/infra/database.ts
Impure import in pure layer: 'fs' in src/domain/service.ts
```

Users think in terms of architectural symbols ("domain", "infrastructure"), not file paths. The messages forced users to mentally map paths back to symbols.

### Decision

Include symbol names in all diagnostic messages, keeping file paths as supporting context:

```
Forbidden dependency: domain → infrastructure (src/domain/service.ts → src/infra/database.ts)
Impure import in 'domain': 'fs'
Circular dependency detected: domain → infrastructure → domain
```

### Rationale

- **Matches mental model** — users think "domain depends on infrastructure", not "this file depends on that file"
- **Actionable** — symbol names tell you which architectural rule is violated; file paths tell you where to fix it
- **Consistent** — all three plugins now lead with semantic context
- **Backwards-compatible** — messages still contain file paths, so existing `.toContain()` assertions in tests still pass

### Impact

- `noDependencyPlugin`: `Forbidden dependency: ${from} → ${to} (${sourceFile} → ${targetFile})`
- `purityPlugin`: `Impure import in '${symbol}': '${module}'`
- `noCyclesPlugin`: already used symbol names — no change
- All 263 tests passing, no test changes required

---
