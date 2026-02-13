import { ContractPlugin, getSourceFilesForPaths } from '../contract-plugin.js';
import { Diagnostic } from '../../../../domain/entities/diagnostic.js';
import { SourceRef } from '../../../../domain/value-objects/source-ref.js';
import { ContractType } from '../../../../domain/types/contract-type.js';
import { DiagnosticCode } from '../../../../domain/constants/diagnostic-codes.js';
import { findCycles } from '../../../../domain/utils/cycle-detection.js';
import { generateFromStringList } from '../generator-helpers.js';

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
      symbolFiles.set(sym.name, sym.files);
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
            const targetFiles = new Set(symbolFiles.get(targetSym.name) || []);
            if (targetFiles.has(imp.targetFile)) {
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
        SourceRef.structural(cycle[0]),
        contract.toReference(),
      ));
    }

    return { diagnostics, filesAnalyzed };
  },
};
