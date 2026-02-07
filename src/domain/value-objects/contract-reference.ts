import { ContractType } from '../types/contract-type';

/**
 * A reference to a contract from a diagnostic or symbol.
 *
 * This is a value object - it's immutable and defined by its properties.
 */
export interface ContractReference {
  /** The name of the contract */
  contractName: string;

  /** The type of contract */
  contractType: ContractType;

  /** Optional location where the contract was defined */
  location?: string;
}
