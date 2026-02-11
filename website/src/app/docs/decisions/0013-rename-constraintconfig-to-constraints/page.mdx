# 13. Rename `ConstraintConfig` to `Constraints`

Date: 2026-02-08
Status: Done

**Date:** 2026-02-08
**Status:** Done

### Context

The public API type `ConstraintConfig<Members>` carried a `Config` suffix that was a leftover from the `ContractConfig` era (D8). With `Kind` and `Instance` as clean one-word nouns, `ConstraintConfig` was the odd one out — the suffix implied runtime configuration rather than a type-level schema.

Additionally, user-facing documentation led with "contracts" (internal domain model terminology) rather than "constraints" (what users actually write). Users declare constraints on Kind types; they never interact with `Contract` domain entities. The terminology mismatch made the docs harder to navigate.

### Decision

1. Rename `ConstraintConfig<Members>` to `Constraints<Members>` in the public API.
2. Rename `docs/03-contracts.md` to `docs/03-constraints.md` and update user-facing headings from "Contract Types" to "Constraint Types."
3. Add plugin registry validation tests (uniqueness of constraint names, contract types, diagnostic codes).
4. Keep internal domain model names unchanged: `Contract`, `ContractType`, `ContractPlugin` remain as-is.

### Rationale

- `Constraints<Members>` aligns with `Kind` and `Instance` — clean, one-word nouns
- `Kind<"X", Members, Constraints<Members>>` reads naturally
- Users write constraints, not contracts — docs should match user vocabulary
- Internal domain model doesn't need renaming — "contract" is correct for bound, evaluable rules
- Plugin registry validation tests prevent silent collisions (duplicate names, types, or codes)

### Impact

- Public API: `Kind`, `Instance<T>`, `Constraints<Members>` (3 user-facing types)
- `docs/03-contracts.md` → `docs/03-constraints.md` (file rename)
- User-facing headings updated: "Contract Types" → "Constraint Types"
- Plugin registry: 3 new uniqueness tests
- All tests passing, no behavioral changes

---
