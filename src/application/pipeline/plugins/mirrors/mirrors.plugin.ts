import { ContractPlugin } from '../contract-plugin';
import { Diagnostic } from '../../../../domain/entities/diagnostic';
import { ContractType } from '../../../../domain/types/contract-type';
import { DiagnosticCode } from '../../../../domain/constants/diagnostic-codes';
import { relativePath } from '../../../../domain/utils/path-matching';
import { generateFromTuplePairs } from '../generator-helpers';

export const mirrorsPlugin: ContractPlugin = {
  type: ContractType.Mirrors,
  constraintName: 'filesystem.mirrors',
  diagnosticCode: DiagnosticCode.MirrorMismatch,

  validate(args) {
    if (args.length !== 2) {
      return `mirrors requires exactly 2 arguments (primary, related), got ${args.length}`;
    }
    return null;
  },

  generate(value, instanceSymbol, kindName, location) {
    return generateFromTuplePairs(value, instanceSymbol, kindName, location, ContractType.Mirrors, 'filesystem.mirrors');
  },

  check(contract, ctx) {
    const [primarySymbol, relatedSymbol] = contract.args;
    const diagnostics: Diagnostic[] = [];

    const primaryLocation = primarySymbol.declaredLocation;
    const relatedLocation = relatedSymbol.declaredLocation;
    if (!primaryLocation || !relatedLocation) {
      return { diagnostics, filesAnalyzed: 0 };
    }

    const primaryFiles = ctx.resolvedFiles.get(primaryLocation) ?? [];

    const relatedFiles = ctx.resolvedFiles.get(relatedLocation) ?? [];
    const relatedRelPaths = new Set(
      relatedFiles.map(f => relativePath(relatedLocation, f))
    );

    for (const file of primaryFiles) {
      const relPath = relativePath(primaryLocation, file);
      if (!relatedRelPaths.has(relPath)) {
        const expectedFile = `${relatedLocation}/${relPath}`;
        diagnostics.push(new Diagnostic(
          `File '${file}' has no counterpart at '${expectedFile}'`,
          DiagnosticCode.MirrorMismatch,
          file,
          0,
          0,
          contract.toReference(),
        ));
      }
    }

    return { diagnostics, filesAnalyzed: primaryFiles.length };
  },
};
