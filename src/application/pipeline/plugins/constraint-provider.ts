import { TypeNodeView } from '../views';
import { ArchSymbol } from '../../../domain/entities/arch-symbol';
import { Contract } from '../../../domain/entities/contract';

/**
 * Result of a constraint generator.
 */
export interface GeneratorResult {
  contracts: Contract[];
  errors: string[];
}

/**
 * Narrow interface that the Binder depends on for constraint handling.
 *
 * This is the binder-side view of a contract plugin.
 * It contains only the fields needed for contract generation:
 * constraint name matching, contract generation, and intrinsic propagation.
 *
 * ContractPlugin in the checker layer extends this interface,
 * adding check/validate capabilities that the binder doesn't need.
 */
export interface ConstraintProvider {
  readonly constraintName: string;

  /** Generate contracts from a constraint AST value */
  generate?: (
    value: TypeNodeView,
    instanceSymbol: ArchSymbol,
    kindName: string,
    location: string,
  ) => GeneratorResult;

  /** Intrinsic constraint detection + propagation (e.g., purity) */
  intrinsic?: {
    detect(view: TypeNodeView): boolean;
    propagate(memberSymbol: ArchSymbol, memberName: string, location: string): Contract;
  };
}
