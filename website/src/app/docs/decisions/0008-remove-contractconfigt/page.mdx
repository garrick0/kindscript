# 8. Remove `ContractConfig<T>`

Date: 2026-02-07
Status: Done

**Date:** 2026-02-07
**Status:** Done

### Context

The V2 redesign introduced `ContractConfig<T>` as an "additive escape hatch" — instances could declare additional constraints beyond what the Kind type specified.

### Decision

Remove `ContractConfig<T>`. All constraints must be declared on the Kind type's 3rd type parameter. The Kind type is the single source of truth for all architectural rules.

### Rationale

- Breaks the "abstractions as types" metaphor — in TypeScript, types fully describe their contract; values don't add new type rules
- Created ambiguity in multi-instance scenarios
- Required a third classification phase in the AST classifier
- Confused where to look for the authoritative set of constraints

### Impact

- Simpler mental model: read the Kind definition to understand all rules
- Different constraints require different Kinds (by design)
- Classifier simplified to 2 phases (Kind definitions + instances)
- `ContractConfig` removed from public API

---
