import { ContractType } from '../types/contract-type.js';
import { ArchSymbol } from './arch-symbol.js';
import { ContractReference } from '../value-objects/contract-reference.js';

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
