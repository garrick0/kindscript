import { TypeNodeView } from '../../ports/ast.port';
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
 * Narrow interface that classification depends on for constraint handling.
 *
 * This is the classification-side view of a contract plugin.
 * It contains only the fields needed for AST classification:
 * constraint name matching, contract generation, and intrinsic propagation.
 *
 * ContractPlugin in the enforcement layer extends this interface,
 * adding check/validate capabilities that classification doesn't need.
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
