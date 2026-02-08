import { ContractChecker, CheckContext, CheckResult } from '../contract-checker';
import { Contract } from '../../../../domain/entities/contract';
import { Diagnostic } from '../../../../domain/entities/diagnostic';
import { ContractType } from '../../../../domain/types/contract-type';
import { isFileInSymbol } from '../../../../domain/utils/path-matching';
import { findCycles } from '../../../../domain/utils/cycle-detection';

export class NoCyclesChecker implements ContractChecker {
  readonly type = ContractType.NoCycles;

  check(contract: Contract, context: CheckContext): CheckResult {
    const diagnostics: Diagnostic[] = [];
    const symbols = contract.args;
    let filesAnalyzed = 0;

    // Map each symbol name to its files
    const symbolFiles = new Map<string, string[]>();
    for (const sym of symbols) {
      if (sym.declaredLocation) {
        symbolFiles.set(sym.name, context.resolvedFiles.get(sym.declaredLocation) ?? []);
      } else {
        symbolFiles.set(sym.name, []);
      }
    }

    // Build directed graph: edges[A] = Set of B where A imports from B
    const edges = new Map<string, Set<string>>();
    for (const sym of symbols) {
      edges.set(sym.name, new Set());
    }

    for (const sym of symbols) {
      const files = symbolFiles.get(sym.name) || [];
      filesAnalyzed += files.length;

      for (const file of files) {
        const sourceFile = context.tsPort.getSourceFile(context.program, file);
        if (!sourceFile) continue;

        const imports = context.tsPort.getImports(sourceFile, context.checker);

        for (const imp of imports) {
          for (const targetSym of symbols) {
            if (targetSym.name === sym.name) continue;
            const targetLocation = targetSym.declaredLocation;
            if (!targetLocation) continue;
            const targetFiles = new Set(symbolFiles.get(targetSym.name) || []);
            if (isFileInSymbol(imp.targetFile, targetLocation, targetFiles)) {
              edges.get(sym.name)!.add(targetSym.name);
            }
          }
        }
      }
    }

    // Detect cycles using shared domain utility
    const cycles = findCycles(edges);
    for (const cycle of cycles) {
      diagnostics.push(Diagnostic.circularDependency(cycle, contract));
    }

    return { diagnostics, filesAnalyzed };
  }
}
