import { ContractPlugin, getSourceFilesForPaths } from '../contract-plugin';
import { Diagnostic } from '../../../../domain/entities/diagnostic';
import { SourceRef } from '../../../../domain/value-objects/source-ref';
import { ContractType } from '../../../../domain/types/contract-type';
import { DiagnosticCode } from '../../../../domain/constants/diagnostic-codes';
import { isFileInSymbol } from '../../../../infrastructure/path/path-utils';
import { generateFromTuplePairs } from '../generator-helpers';

export const noDependencyPlugin: ContractPlugin = {
  type: ContractType.NoDependency,
  constraintName: 'noDependency',
  diagnosticCode: DiagnosticCode.ForbiddenDependency,
  codeFix: {
    fixName: 'kindscript-remove-forbidden-import',
    description: 'Remove this import (forbidden dependency)',
  },

  validate(args) {
    if (args.length !== 2) {
      return `noDependency requires exactly 2 arguments (from, to), got ${args.length}`;
    }
    return null;
  },

  generate(value, instanceSymbol, kindName, location) {
    return generateFromTuplePairs(value, instanceSymbol, kindName, location, ContractType.NoDependency, 'noDependency');
  },

  check(contract, ctx) {
    const [fromSymbol, toSymbol] = contract.args;
    const diagnostics: Diagnostic[] = [];

    const fromLocation = fromSymbol.id;
    const toLocation = toSymbol.id;
    if (!fromLocation || !toLocation) {
      return { diagnostics, filesAnalyzed: 0 };
    }

    const fromFilePaths = ctx.resolvedFiles.get(fromLocation) ?? [];
    const toFiles = new Set(ctx.resolvedFiles.get(toLocation) ?? []);

    for (const { sourceFile } of getSourceFilesForPaths(ctx, fromFilePaths)) {
      const imports = ctx.tsPort.getImports(sourceFile, ctx.checker);

      for (const imp of imports) {
        if (isFileInSymbol(imp.targetFile, toLocation, toFiles)) {
          diagnostics.push(new Diagnostic(
            `Forbidden dependency: ${fromSymbol.name} → ${toSymbol.name} (${imp.sourceFile} → ${imp.targetFile})`,
            DiagnosticCode.ForbiddenDependency,
            SourceRef.at(imp.sourceFile, imp.line, imp.column),
            contract.toReference(),
          ));
        }
      }
    }

    return { diagnostics, filesAnalyzed: fromFilePaths.length };
  },
};
