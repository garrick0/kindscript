import { TypeNodeView } from '../../ports/ast.port';
import { ArchSymbol } from '../../../domain/entities/arch-symbol';
import { Contract } from '../../../domain/entities/contract';

export interface GeneratorResult {
  contracts: Contract[];
  errors: string[];
}

export type ContractGenerator = (
  value: TypeNodeView,
  instanceSymbol: ArchSymbol,
  kindName: string,
  location: string,
) => GeneratorResult;
