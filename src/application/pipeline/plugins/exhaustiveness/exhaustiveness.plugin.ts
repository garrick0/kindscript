import { ContractPlugin } from '../contract-plugin';
import { Contract } from '../../../../domain/entities/contract';
import { Diagnostic } from '../../../../domain/entities/diagnostic';
import { SourceRef } from '../../../../domain/value-objects/source-ref';
import { ContractType } from '../../../../domain/types/contract-type';
import { DiagnosticCode } from '../../../../domain/constants/diagnostic-codes';
import { carrierKey } from '../../../../domain/types/carrier';

/**
 * Default exclusion patterns for exhaustiveness checking.
 * Files matching these patterns are not flagged as unassigned.
 */
function isExcluded(filePath: string): boolean {
  // Instance declaration files (context.ts)
  if (filePath.endsWith('/context.ts') || filePath.endsWith('/context.tsx')) return true;
  // Test files
  if (filePath.match(/\.(test|spec)\.(ts|tsx)$/)) return true;
  // __tests__ directories
  if (filePath.includes('/__tests__/')) return true;
  return false;
}

/**
 * Exhaustiveness plugin — tracks unassigned files within an instance's scope.
 *
 * Opt-in via `exhaustive: true` in Kind constraints. When enabled,
 * reports files in the instance's container that are not assigned
 * to any member.
 */
export const exhaustivenessPlugin: ContractPlugin = {
  type: ContractType.Exhaustiveness,
  constraintName: 'exhaustive',
  diagnosticCode: DiagnosticCode.UnassignedCode,

  generate(value, instanceSymbol, kindName, location) {
    // exhaustive: true generates a contract per instance
    if (value.kind !== 'boolean') {
      return { contracts: [], errors: [`exhaustive in Kind<${kindName}> must be true (boolean).`] };
    }

    return {
      contracts: [new Contract(
        ContractType.Exhaustiveness,
        `exhaustive:${instanceSymbol.name}`,
        [instanceSymbol],
        location,
      )],
      errors: [],
    };
  },

  validate(args) {
    if (args.length !== 1) {
      return `exhaustiveness requires exactly 1 argument (instance symbol), got ${args.length}`;
    }
    return null;
  },

  check(contract, ctx) {
    const [instanceSymbol] = contract.args;
    const containerAll = ctx.containerFiles?.get(carrierKey(instanceSymbol.carrier!)) ?? [];

    if (containerAll.length === 0) {
      return { diagnostics: [], filesAnalyzed: 0 };
    }

    // Collect all files assigned to members
    const memberFiles = new Set<string>();
    for (const member of instanceSymbol.members.values()) {
      for (const f of ctx.resolvedFiles.get(carrierKey(member.carrier!)) ?? []) {
        memberFiles.add(f);
      }
    }

    // Find unassigned files (excluding defaults)
    const unassigned = containerAll.filter(f =>
      !memberFiles.has(f) && !isExcluded(f)
    );

    if (unassigned.length === 0) {
      return { diagnostics: [], filesAnalyzed: 0 };
    }

    const diagnostics = unassigned.map(f => new Diagnostic(
      `Unassigned file: "${f}" is not in any member of ${instanceSymbol.name}`,
      DiagnosticCode.UnassignedCode,
      SourceRef.structural(instanceSymbol.name),
      contract.toReference(),
    ));

    return { diagnostics, filesAnalyzed: 0 };
  },
};
