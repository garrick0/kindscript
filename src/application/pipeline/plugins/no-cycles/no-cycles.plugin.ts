import { ContractPlugin, getSourceFilesForPaths } from '../contract-plugin';
import { Diagnostic } from '../../../../domain/entities/diagnostic';
import { ContractType } from '../../../../domain/types/contract-type';
import { DiagnosticCode } from '../../../../domain/constants/diagnostic-codes';
import { isFileInSymbol } from '../../../../domain/utils/path-matching';
import { findCycles } from '../../../../domain/utils/cycle-detection';
import { generateFromStringList } from '../generator-helpers';

export const noCyclesPlugin: ContractPlugin = {
  type: ContractType.NoCycles,
  constraintName: 'noCycles',
  diagnosticCode: DiagnosticCode.CircularDependency,

  validate(args) {
    if (args.length < 1) {
      return `noCycles requires at least 1 argument, got ${args.length}`;
    }
    return null;
  },

  generate(value, instanceSymbol, kindName, location) {
    return generateFromStringList(value, instanceSymbol, kindName, location, ContractType.NoCycles, 'noCycles');
  },

  check(contract, ctx) {
    const diagnostics: Diagnostic[] = [];
    const symbols = contract.args;
    let filesAnalyzed = 0;

    const symbolFiles = new Map<string, string[]>();
    for (const sym of symbols) {
      if (sym.declaredLocation) {
        symbolFiles.set(sym.name, ctx.resolvedFiles.get(sym.declaredLocation) ?? []);
      } else {
        symbolFiles.set(sym.name, []);
      }
    }

    const edges = new Map<string, Set<string>>();
    for (const sym of symbols) {
      edges.set(sym.name, new Set());
    }

    for (const sym of symbols) {
      const files = symbolFiles.get(sym.name) || [];
      filesAnalyzed += files.length;

      for (const { sourceFile } of getSourceFilesForPaths(ctx, files)) {
        const imports = ctx.tsPort.getImports(sourceFile, ctx.checker);

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

    const cycles = findCycles(edges);
    for (const cycle of cycles) {
      const cycleStr = cycle.join(' → ') + ' → ' + cycle[0];
      diagnostics.push(new Diagnostic(
        `Circular dependency detected: ${cycleStr}`,
        DiagnosticCode.CircularDependency,
        '',
        0,
        0,
        contract.toReference(),
        cycle[0],
      ));
    }

    return { diagnostics, filesAnalyzed };
  },
};
