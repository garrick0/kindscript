import { CheckContractsUseCase } from './check-contracts.use-case';
import { CheckContractsRequest } from './check-contracts.request';
import { CheckContractsResponse } from './check-contracts.response';
import { TypeScriptPort } from '../../ports/typescript.port';
import { ContractChecker, CheckContext } from './contract-checker';
import { Diagnostic } from '../../../domain/entities/diagnostic';
import { DiagnosticCode } from '../../../domain/constants/diagnostic-codes';
import { ContractType } from '../../../domain/types/contract-type';

/**
 * Thin dispatcher that validates contracts and delegates to per-type checkers.
 */
export class CheckContractsService implements CheckContractsUseCase {
  private readonly checkerMap: Map<ContractType, ContractChecker>;

  constructor(
    checkers: ContractChecker[],
    private readonly tsPort: TypeScriptPort,
  ) {
    this.checkerMap = new Map(checkers.map(c => [c.type, c]));
  }

  execute(request: CheckContractsRequest): CheckContractsResponse {
    const diagnostics: Diagnostic[] = [];
    let filesAnalyzed = 0;

    const context: CheckContext = {
      tsPort: this.tsPort,
      program: request.program,
      checker: this.tsPort.getTypeChecker(request.program),
      resolvedFiles: request.resolvedFiles,
    };

    for (const contract of request.contracts) {
      const validationError = contract.validate();
      if (validationError) {
        diagnostics.push(new Diagnostic(
          `Invalid contract '${contract.name}': ${validationError}`,
          DiagnosticCode.InvalidContract,
          contract.location ?? '<config>',
          0,
          0
        ));
        continue;
      }

      const checker = this.checkerMap.get(contract.type);
      if (!checker) continue;

      const result = checker.check(contract, context);
      diagnostics.push(...result.diagnostics);
      filesAnalyzed += result.filesAnalyzed;
    }

    return {
      diagnostics,
      contractsChecked: request.contracts.length,
      violationsFound: diagnostics.length,
      filesAnalyzed,
    };
  }
}
