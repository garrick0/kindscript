import { ContractChecker, CheckContext, CheckResult } from '../contract-checker';
import { Contract } from '../../../../domain/entities/contract';
import { Diagnostic } from '../../../../domain/entities/diagnostic';
import { ContractType } from '../../../../domain/types/contract-type';

export class MustImplementChecker implements ContractChecker {
  readonly type = ContractType.MustImplement;

  check(contract: Contract, context: CheckContext): CheckResult {
    const [portsSymbol, adaptersSymbol] = contract.args;
    const diagnostics: Diagnostic[] = [];

    const portsLocation = portsSymbol.declaredLocation;
    const adaptersLocation = adaptersSymbol.declaredLocation;
    if (!portsLocation || !adaptersLocation) {
      return { diagnostics, filesAnalyzed: 0 };
    }

    const portFiles = context.resolvedFiles.get(portsLocation) ?? [];
    const adapterFiles = context.resolvedFiles.get(adaptersLocation) ?? [];

    // Collect all exported interface names from port files
    const interfaceNames: string[] = [];
    for (const file of portFiles) {
      const sourceFile = context.tsPort.getSourceFile(context.program, file);
      if (!sourceFile) continue;
      interfaceNames.push(...context.tsPort.getExportedInterfaceNames(context.program, sourceFile));
    }

    // For each interface, check if any adapter file implements it
    for (const ifaceName of interfaceNames) {
      let found = false;
      for (const file of adapterFiles) {
        const sourceFile = context.tsPort.getSourceFile(context.program, file);
        if (!sourceFile) continue;
        if (context.tsPort.hasClassImplementing(context.program, sourceFile, ifaceName)) {
          found = true;
          break;
        }
      }
      if (!found) {
        diagnostics.push(Diagnostic.missingImplementation(
          ifaceName, adaptersLocation, contract
        ));
      }
    }

    return { diagnostics, filesAnalyzed: portFiles.length + adapterFiles.length };
  }
}
