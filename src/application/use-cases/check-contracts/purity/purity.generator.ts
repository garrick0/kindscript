import { TypeNodeView } from '../../../ports/ast.port';
import { ArchSymbol } from '../../../../domain/entities/arch-symbol';
import { Contract } from '../../../../domain/entities/contract';
import { ContractType } from '../../../../domain/types/contract-type';

/**
 * Check if a TypeNodeView constraint tree has { pure: true } (intrinsic purity).
 */
export function hasIntrinsicPure(view: TypeNodeView): boolean {
  if (view.kind !== 'object') return false;
  return view.properties.some(p => p.name === 'pure' && p.value.kind === 'boolean');
}

/**
 * Create a purity contract for a member symbol (used during propagation).
 */
export function propagatePurity(
  memberSymbol: ArchSymbol,
  memberName: string,
  location: string,
): Contract {
  return new Contract(
    ContractType.Purity,
    `purity(${memberName})`,
    [memberSymbol],
    location,
  );
}
