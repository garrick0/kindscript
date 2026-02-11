/**
 * The type of architectural contract.
 *
 * Contracts define constraints and rules that architectural
 * symbols must satisfy.
 */
export enum ContractType {
  /** Forbids dependencies from one symbol to another */
  NoDependency = 'noDependency',

  /** Requires that a symbol has no side effects (no I/O, no mutations) */
  Purity = 'purity',

  /** Forbids circular dependencies within or between symbols */
  NoCycles = 'noCycles',

  /** Validates that an instance's resolved location matches the Kind's scope (folder or file) */
  Scope = 'scope',

  /** Detects when two sibling members within the same instance claim the same file */
  Overlap = 'overlap',

  /** Tracks unassigned files within an instance's scope */
  Exhaustiveness = 'exhaustiveness',
}