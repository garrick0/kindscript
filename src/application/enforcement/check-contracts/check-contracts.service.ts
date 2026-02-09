import { CheckContractsUseCase } from './check-contracts.use-case';
import { CheckContractsRequest } from './check-contracts.request';
import { CheckContractsResponse } from './check-contracts.response';
import { TypeScriptPort } from '../../ports/typescript.port';
import { ContractPlugin, CheckContext } from './contract-plugin';
import { Diagnostic } from '../../../domain/entities/diagnostic';
import { DiagnosticCode } from '../../../domain/constants/diagnostic-codes';
import { ContractType } from '../../../domain/types/contract-type';

/**
 * Thin dispatcher that validates contracts and delegates to per-type plugins.
 */
export class CheckContractsService implements CheckContractsUseCase {
  private readonly pluginMap: Map<ContractType, ContractPlugin>;

  constructor(
    plugins: ContractPlugin[],
    private readonly tsPort: TypeScriptPort,
  ) {
    this.pluginMap = new Map(plugins.map(p => [p.type, p]));
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
      const plugin = this.pluginMap.get(contract.type);
      if (!plugin) continue;

      const validationError = plugin.validate(contract.args);
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

      const result = plugin.check(contract, context);
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
