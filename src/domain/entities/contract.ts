import { ContractType } from '../types/contract-type';
import { ArchSymbol } from './arch-symbol';

/**
 * Domain entity representing an architectural contract.
 *
 * A contract defines a constraint or rule that architectural symbols
 * must satisfy. For example, "domain must not depend on infrastructure"
 * or "every port must have a corresponding adapter".
 *
 * This is a pure domain entity with validation logic but no external dependencies.
 */
export class Contract {
  constructor(
    /** The type of contract */
    public readonly type: ContractType,

    /** Human-readable name for this contract */
    public readonly name: string,

    /** The symbols this contract applies to (interpretation depends on contract type) */
    public readonly args: ArchSymbol[],

    /** Optional location where this contract was defined */
    public readonly location?: string
  ) {}

  /**
   * Validate that this contract has the correct number and type of arguments.
   *
   * @returns null if valid, error message if invalid
   */
  validate(): string | null {
    switch (this.type) {
      case ContractType.NoDependency:
        if (this.args.length !== 2) {
          return `noDependency requires exactly 2 arguments (from, to), got ${this.args.length}`;
        }
        break;

      case ContractType.MustImplement:
        if (this.args.length !== 2) {
          return `mustImplement requires exactly 2 arguments (interface, implementation), got ${this.args.length}`;
        }
        break;

      case ContractType.Purity:
        if (this.args.length !== 1) {
          return `purity requires exactly 1 argument (symbol), got ${this.args.length}`;
        }
        break;

      case ContractType.NoCycles:
        if (this.args.length < 1) {
          return `noCycles requires at least 1 argument, got ${this.args.length}`;
        }
        break;

      case ContractType.Colocated:
        if (this.args.length !== 2) {
          return `colocated requires exactly 2 arguments (primary, related), got ${this.args.length}`;
        }
        break;

      default:
        return `Unknown contract type: ${this.type}`;
    }

    return null;
  }

  /**
   * Check if this contract equals another contract.
   */
  equals(other: Contract): boolean {
    return (
      this.type === other.type &&
      this.name === other.name &&
      this.argsEqual(other.args)
    );
  }

  /**
   * Check if the args arrays are equal (same symbols in same order).
   */
  private argsEqual(otherArgs: ArchSymbol[]): boolean {
    if (this.args.length !== otherArgs.length) {
      return false;
    }

    return this.args.every((arg, i) => arg.name === otherArgs[i].name);
  }

  /**
   * Human-readable representation of this contract.
   */
  toString(): string {
    const argNames = this.args.map(a => a.name).join(', ');
    return `${this.type}(${argNames})`;
  }
}
