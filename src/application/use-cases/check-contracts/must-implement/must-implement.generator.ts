import { ContractGenerator, GeneratorResult } from '../contract-generator';
import { TypeNodeView } from '../../../ports/ast.port';
import { ArchSymbol } from '../../../../domain/entities/arch-symbol';
import { Contract } from '../../../../domain/entities/contract';
import { ContractType } from '../../../../domain/types/contract-type';

export const generateMustImplement: ContractGenerator = (
  value: TypeNodeView,
  instanceSymbol: ArchSymbol,
  kindName: string,
  location: string,
): GeneratorResult => {
  const contracts: Contract[] = [];
  const errors: string[] = [];

  if (value.kind !== 'tuplePairs') return { contracts, errors };

  for (const [firstName, secondName] of value.values) {
    const firstSymbol = instanceSymbol.findByPath(firstName);
    const secondSymbol = instanceSymbol.findByPath(secondName);

    if (!firstSymbol) {
      errors.push(`Kind<${kindName}>: member '${firstName}' not found in instance '${instanceSymbol.name}'.`);
      continue;
    }
    if (!secondSymbol) {
      errors.push(`Kind<${kindName}>: member '${secondName}' not found in instance '${instanceSymbol.name}'.`);
      continue;
    }

    contracts.push(new Contract(
      ContractType.MustImplement,
      `mustImplement(${firstName} -> ${secondName})`,
      [firstSymbol, secondSymbol],
      location,
    ));
  }

  return { contracts, errors };
};
