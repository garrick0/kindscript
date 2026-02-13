import { TypeNodeView } from '../views.js';
import { ArchSymbol } from '../../../domain/entities/arch-symbol.js';
import { Contract } from '../../../domain/entities/contract.js';
import { ContractType } from '../../../domain/types/contract-type.js';
import { GeneratorResult } from './constraint-provider.js';

/**
 * Shared generator for tuplePairs constraints (noDependency).
 *
 * Expects value.kind === 'tuplePairs' with [string, string][] values.
 * Each pair is resolved to two ArchSymbols and a Contract is created.
 */
export function generateFromTuplePairs(
  value: TypeNodeView,
  instanceSymbol: ArchSymbol,
  kindName: string,
  location: string,
  contractType: ContractType,
  constraintName: string,
): GeneratorResult {
  const contracts: Contract[] = [];
  const errors: string[] = [];
  if (value.kind !== 'tuplePairs') return { contracts, errors };

  for (const [firstName, secondName] of value.values) {
    const first = instanceSymbol.findByPath(firstName);
    const second = instanceSymbol.findByPath(secondName);
    if (!first) {
      errors.push(`Kind<${kindName}>: member '${firstName}' not found in instance '${instanceSymbol.name}'.`);
      continue;
    }
    if (!second) {
      errors.push(`Kind<${kindName}>: member '${secondName}' not found in instance '${instanceSymbol.name}'.`);
      continue;
    }
    contracts.push(new Contract(
      contractType,
      `${constraintName}(${firstName} -> ${secondName})`,
      [first, second],
      location,
    ));
  }
  return { contracts, errors };
}

/**
 * Shared generator for stringList constraints (noCycles).
 *
 * Expects value.kind === 'stringList' with string[] values.
 * All values are resolved to ArchSymbols and a single Contract is created.
 */
export function generateFromStringList(
  value: TypeNodeView,
  instanceSymbol: ArchSymbol,
  kindName: string,
  location: string,
  contractType: ContractType,
  constraintName: string,
): GeneratorResult {
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
      contractType,
      `${constraintName}(${argNames})`,
      argSymbols,
      location,
    ));
  }
  return { contracts, errors };
}
