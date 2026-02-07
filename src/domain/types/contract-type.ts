/**
 * The type of architectural contract.
 *
 * Contracts define constraints and rules that architectural
 * symbols must satisfy.
 */
export enum ContractType {
  /** Forbids dependencies from one symbol to another */
  NoDependency = 'noDependency',

  /** Requires that every entity in first symbol has a corresponding entity in second */
  MustImplement = 'mustImplement',

  /** Requires that a symbol has no side effects (no I/O, no mutations) */
  Purity = 'purity',

  /** Forbids circular dependencies within or between symbols */
  NoCycles = 'noCycles',

  /** Requires that related files are co-located in the same directory */
  Colocated = 'colocated',
}
