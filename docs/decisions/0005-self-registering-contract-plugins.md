# 5. Self-Registering Contract Plugins

Date: 2026-02-07
Status: Done

**Date:** 2026-02-07
**Status:** Done

### Context

Contract checking was a monolithic ~322-line `CheckContractsService` with a `switch` statement dispatching to private methods.

### Decision

Extract each contract type into a self-contained `ContractPlugin` object. A `plugin-registry.ts` file creates all plugins. `CheckContractsService` becomes a thin dispatcher.

### Rationale

- Open-Closed Principle — adding a new contract type means adding a new plugin, not modifying the dispatcher
- Each plugin declares its own type, constraint name, diagnostic code, validation, and checking logic
- Plugins can be tested independently
- The dispatcher is ~60 lines with no contract-specific knowledge

### Plugin Interface

```typescript
interface ContractPlugin extends ConstraintProvider {
  readonly type: ContractType;
  readonly diagnosticCode: number;

  validate(args: ArchSymbol[]): string | null;
  check(contract: Contract, ctx: CheckContext): CheckResult;

  codeFix?: { fixName: string; description: string };
}
```

Where `ConstraintProvider` provides `constraintName`, optional `generate()`, and optional `intrinsic` (detect + propagate).

---
