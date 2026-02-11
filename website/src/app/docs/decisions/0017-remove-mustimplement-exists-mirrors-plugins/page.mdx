# 17. Remove mustImplement, exists, mirrors Plugins

Date: 2026-02-10
Status: Done

**Date:** 2026-02-10
**Status:** Done

### Context

KindScript had 6 constraint types: `noDependency`, `mustImplement`, `purity`, `noCycles`, `filesystem.exists`, and `filesystem.mirrors`. Three of them (`mustImplement`, `filesystem.exists`, `filesystem.mirrors`) had limited real-world value and added complexity:

- **mustImplement** — checked that every exported interface in one layer had an implementing class in another. Useful in theory, but in practice classes often implement interfaces from unrelated packages or use patterns (abstract classes, partial implementations) that the simple "has `implements` clause" check didn't handle well.
- **filesystem.exists** — checked that member directories existed on disk. Redundant: if a directory is missing, dependency checks simply pass (no files to violate). The constraint only caught the case where a user declared members they never created — a trivially fixable setup issue.
- **filesystem.mirrors** — checked that every file in one directory had a counterpart in another (e.g., every component has a test). Brittle in practice: test file naming conventions vary, colocated tests break the pattern, and the check produced false positives on stories, fixtures, and helpers.

### Decision

Remove all three plugins and focus on the 3 core constraints: `noDependency`, `purity`, `noCycles`. These three are compositional, behavioral, and universally applicable.

### Rationale

- **Focus** — 3 constraints that compose well are more valuable than 6 that each cover a narrow case
- **Simpler mental model** — users only need to learn 3 constraint types
- **Less maintenance surface** — 3 plugin implementations instead of 6
- **No real-world loss** — the removed constraints had workarounds (mustImplement → TypeScript's own type checking; exists → visual inspection; mirrors → test coverage tools)
- **Principled** — the remaining 3 constraints are all import-graph analysis, which is KindScript's core competency

### Impact

- Deleted `src/application/pipeline/plugins/must-implement/`, `exists/`, `mirrors/`
- Deleted 3 test files, 3 sets of integration fixtures, related E2E tests
- Removed `ContractType` enum values, `DiagnosticCode` constants, factory functions
- Removed `filesystem.exists`/`filesystem.mirrors` from all notebooks and documentation
- 26 test files, 263 tests, 100% passing

---
