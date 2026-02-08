import { ContractChecker, CheckContext, CheckResult } from '../contract-checker';
import { Contract } from '../../../../domain/entities/contract';
import { Diagnostic } from '../../../../domain/entities/diagnostic';
import { ContractType } from '../../../../domain/types/contract-type';

export class ExistsChecker implements ContractChecker {
  readonly type = ContractType.Exists;

  check(contract: Contract, context: CheckContext): CheckResult {
    const diagnostics: Diagnostic[] = [];

    for (const symbol of contract.args) {
      const location = symbol.declaredLocation;
      if (!location) continue;
      if (!context.resolvedFiles.has(location)) {
        diagnostics.push(Diagnostic.locationNotFound(
          location,
          symbol.name,
          symbol.kindTypeName ?? 'unknown',
          contract.location ?? '',
        ));
      }
    }

    return { diagnostics, filesAnalyzed: 0 };
  }
}
