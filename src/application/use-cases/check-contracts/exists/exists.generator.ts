import { ContractGenerator, GeneratorResult } from '../contract-generator';
import { TypeNodeView } from '../../../ports/ast.port';
import { ArchSymbol } from '../../../../domain/entities/arch-symbol';
import { Contract } from '../../../../domain/entities/contract';
import { ContractType } from '../../../../domain/types/contract-type';

export const generateExists: ContractGenerator = (
  value: TypeNodeView,
  instanceSymbol: ArchSymbol,
  kindName: string,
  location: string,
): GeneratorResult => {
  const contracts: Contract[] = [];
  const errors: string[] = [];

  if (value.kind !== 'stringList') return { contracts, errors };

  const argSymbols: ArchSymbol[] = [];
  for (const memberName of value.values) {
    const symbol = instanceSymbol.findByPath(memberName);
    if (!symbol) {
      errors.push(`Kind<${kindName}>: member '${memberName}' not found in instance '${instanceSymbol.name}'.`);
      continue;
    }
    argSymbols.push(symbol);
  }

  if (argSymbols.length > 0) {
    const argNames = argSymbols.map(s => s.name).join(', ');
    contracts.push(new Contract(
      ContractType.Exists,
      `filesystem.exists(${argNames})`,
      argSymbols,
      location,
    ));
  }

  return { contracts, errors };
};
