import { CheckerUseCase } from './checker.use-case';
import { CheckerRequest } from './checker.request';
import { CheckerResponse } from './checker.response';
import { TypeScriptPort } from '../../ports/typescript.port';
import { ContractPlugin, CheckContext } from '../plugins/contract-plugin';
import { Diagnostic } from '../../../domain/entities/diagnostic';
import { SourceRef } from '../../../domain/value-objects/source-ref';
import { DiagnosticCode } from '../../../domain/constants/diagnostic-codes';
import { ContractType } from '../../../domain/types/contract-type';

/**
 * KindScript Checker — evaluates contracts and produces diagnostics.
 *
 * This is the fourth pipeline stage. It takes bound contracts and
 * resolved data, and produces diagnostics. Pure evaluation — no
 * domain model construction or constraint generation.
 *
 * Analogous to TypeScript's Checker which resolves types from symbols
 * and reports type errors.
 */
export class CheckerService implements CheckerUseCase {
  private readonly pluginMap: Map<ContractType, ContractPlugin>;

  constructor(
    plugins: ContractPlugin[],
    private readonly tsPort: TypeScriptPort,
  ) {
    this.pluginMap = new Map(plugins.map(p => [p.type, p]));
  }

  execute(request: CheckerRequest): CheckerResponse {
    const diagnostics: Diagnostic[] = [];
    let filesAnalyzed = 0;

    const context: CheckContext = {
      tsPort: this.tsPort,
      program: request.program,
      checker: this.tsPort.getTypeChecker(request.program),
      ownershipTree: request.ownershipTree,
    };

    for (const contract of request.contracts) {
      const plugin = this.pluginMap.get(contract.type);
      if (!plugin) continue;

      const validationError = plugin.validate(contract.args);
      if (validationError) {
        diagnostics.push(new Diagnostic(
          `Invalid contract '${contract.name}': ${validationError}`,
          DiagnosticCode.InvalidContract,
          SourceRef.at(contract.location ?? '<config>', 0, 0),
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
