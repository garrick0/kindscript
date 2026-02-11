# 2. No ts-morph

Date: 2026-02-07
Status: Done

**Date:** 2026-02-07
**Status:** Done

### Context

ts-morph provides a higher-level API over TypeScript's compiler API, making AST operations more ergonomic.

### Decision

Use the raw TypeScript compiler API throughout. Do not add ts-morph as a dependency.

### Rationale

- The classifier is ~100-150 lines of straightforward AST walking
- ts-morph adds ~500KB and version coupling to TypeScript
- Performance matters in the plugin context (runs on every keystroke)
- The original use case for ts-morph (code generation/scaffolding) was removed from KindScript
- Clean helper functions provide sufficient ergonomics for the remaining use cases

---
