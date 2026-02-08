import { ContractChecker, CheckContext, CheckResult } from '../contract-checker';
import { Contract } from '../../../../domain/entities/contract';
import { Diagnostic } from '../../../../domain/entities/diagnostic';
import { ContractType } from '../../../../domain/types/contract-type';
import { isFileInSymbol } from '../../../../domain/utils/path-matching';

export class NoDependencyChecker implements ContractChecker {
  readonly type = ContractType.NoDependency;

  check(contract: Contract, context: CheckContext): CheckResult {
    const [fromSymbol, toSymbol] = contract.args;
    const diagnostics: Diagnostic[] = [];

    const fromLocation = fromSymbol.declaredLocation;
    const toLocation = toSymbol.declaredLocation;
    if (!fromLocation || !toLocation) {
      return { diagnostics, filesAnalyzed: 0 };
    }

    const fromFiles = context.resolvedFiles.get(fromLocation) ?? [];
    const toFiles = new Set(context.resolvedFiles.get(toLocation) ?? []);

    for (const fromFile of fromFiles) {
      const sourceFile = context.tsPort.getSourceFile(context.program, fromFile);
      if (!sourceFile) continue;

      const imports = context.tsPort.getImports(sourceFile, context.checker);

      for (const imp of imports) {
        if (isFileInSymbol(imp.targetFile, toLocation, toFiles)) {
          diagnostics.push(Diagnostic.forbiddenDependency(imp, contract));
        }
      }
    }

    return { diagnostics, filesAnalyzed: fromFiles.length };
  }
}
