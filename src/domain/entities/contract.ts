import { ContractType } from '../types/contract-type';
import { ArchSymbol } from './arch-symbol';
import { ContractReference } from '../value-objects/contract-reference';

/**
 * Domain entity representing an architectural contract.
 *
 * A contract defines a constraint or rule that architectural symbols
 * must satisfy. For example, "domain must not depend on infrastructure"
 * or "every port must have a corresponding adapter".
 *
 * This is a pure domain entity with no external dependencies.
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

    return this.args.every((arg, i) => arg.equals(otherArgs[i]));
  }

  /**
   * Create a ContractReference pointing to this contract.
   */
  toReference(): ContractReference {
    return {
      contractName: this.name,
      contractType: this.type,
      location: this.location,
    };
  }

  /**
   * Human-readable representation of this contract.
   */
  toString(): string {
    const argNames = this.args.map(a => a.name).join(', ');
    return `${this.type}(${argNames})`;
  }
}
