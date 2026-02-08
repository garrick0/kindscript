import { ContractChecker, CheckContext, CheckResult } from '../contract-checker';
import { Contract } from '../../../../domain/entities/contract';
import { Diagnostic } from '../../../../domain/entities/diagnostic';
import { ContractType } from '../../../../domain/types/contract-type';
import { NODE_BUILTINS } from '../../../../domain/constants/node-builtins';

export class PurityChecker implements ContractChecker {
  readonly type = ContractType.Purity;

  check(contract: Contract, context: CheckContext): CheckResult {
    const [symbol] = contract.args;
    const diagnostics: Diagnostic[] = [];

    const location = symbol.declaredLocation;
    if (!location) {
      return { diagnostics, filesAnalyzed: 0 };
    }

    const files = context.resolvedFiles.get(location) ?? [];

    for (const file of files) {
      const sourceFile = context.tsPort.getSourceFile(context.program, file);
      if (!sourceFile) continue;

      const specifiers = context.tsPort.getImportModuleSpecifiers(context.program, sourceFile);
      for (const spec of specifiers) {
        if (NODE_BUILTINS.has(spec.moduleName)) {
          diagnostics.push(Diagnostic.impureImport(
            file, spec.moduleName, spec.line, spec.column, contract
          ));
        }
      }
    }

    return { diagnostics, filesAnalyzed: files.length };
  }
}
