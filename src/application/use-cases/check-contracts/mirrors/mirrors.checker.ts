import { ContractChecker, CheckContext, CheckResult } from '../contract-checker';
import { Contract } from '../../../../domain/entities/contract';
import { Diagnostic } from '../../../../domain/entities/diagnostic';
import { ContractType } from '../../../../domain/types/contract-type';
import { relativePath } from '../../../../domain/utils/path-matching';

export class MirrorsChecker implements ContractChecker {
  readonly type = ContractType.Mirrors;

  check(contract: Contract, context: CheckContext): CheckResult {
    const [primarySymbol, relatedSymbol] = contract.args;
    const diagnostics: Diagnostic[] = [];

    const primaryLocation = primarySymbol.declaredLocation;
    const relatedLocation = relatedSymbol.declaredLocation;
    if (!primaryLocation || !relatedLocation) {
      return { diagnostics, filesAnalyzed: 0 };
    }

    const primaryFiles = context.resolvedFiles.get(primaryLocation) ?? [];

    // Build set of relative paths from the related directory
    const relatedFiles = context.resolvedFiles.get(relatedLocation) ?? [];
    const relatedRelPaths = new Set(
      relatedFiles.map(f => relativePath(relatedLocation, f))
    );

    for (const file of primaryFiles) {
      const relPath = relativePath(primaryLocation, file);
      if (!relatedRelPaths.has(relPath)) {
        const expectedFile = `${relatedLocation}/${relPath}`;
        diagnostics.push(Diagnostic.mirrorMismatch(file, expectedFile, contract));
      }
    }

    return { diagnostics, filesAnalyzed: primaryFiles.length };
  }
}
