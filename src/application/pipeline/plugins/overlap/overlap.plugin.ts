import { ContractPlugin } from '../contract-plugin';
import { Diagnostic } from '../../../../domain/entities/diagnostic';
import { SourceRef } from '../../../../domain/value-objects/source-ref';
import { ContractType } from '../../../../domain/types/contract-type';
import { DiagnosticCode } from '../../../../domain/constants/diagnostic-codes';

/**
 * Overlap plugin — detects when two sibling members within the same
 * instance claim the same file(s).
 *
 * This is an implicit check: the binder generates overlap contracts
 * automatically for every pair of sibling members. No user-facing
 * constraint syntax.
 */
export const overlapPlugin: ContractPlugin = {
  type: ContractType.Overlap,
  constraintName: 'overlap',
  diagnosticCode: DiagnosticCode.MemberOverlap,

  validate(args) {
    if (args.length !== 2) {
      return `overlap requires exactly 2 arguments (two sibling members), got ${args.length}`;
    }
    return null;
  },

  check(contract, ctx) {
    const [a, b] = contract.args;
    const aFiles = new Set(ctx.resolvedFiles.get(a.id!) ?? []);
    const bFiles = ctx.resolvedFiles.get(b.id!) ?? [];
    const overlap = bFiles.filter(f => aFiles.has(f));

    if (overlap.length > 0) {
      return {
        diagnostics: [new Diagnostic(
          `Member overlap: "${a.name}" and "${b.name}" share ${overlap.length} file(s): ${overlap.slice(0, 3).join(', ')}${overlap.length > 3 ? '...' : ''}`,
          DiagnosticCode.MemberOverlap,
          SourceRef.structural(a.name),
          contract.toReference(),
        )],
        filesAnalyzed: 0,
      };
    }

    return { diagnostics: [], filesAnalyzed: 0 };
  },
};
