import { ContractPlugin, getSourceFilesForPaths } from '../contract-plugin.js';
import { Diagnostic } from '../../../../domain/entities/diagnostic.js';
import { SourceRef } from '../../../../domain/value-objects/source-ref.js';
import { ContractType } from '../../../../domain/types/contract-type.js';
import { DiagnosticCode } from '../../../../domain/constants/diagnostic-codes.js';
import { generateFromTuplePairs } from '../generator-helpers.js';

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

    const fromFilePaths = fromSymbol.files;
    const toFiles = new Set(toSymbol.files);
    if (fromFilePaths.length === 0) {
      return { diagnostics, filesAnalyzed: 0 };
    }

    // Cross-file import checks
    for (const { sourceFile } of getSourceFilesForPaths(ctx, fromFilePaths)) {
      const imports = ctx.tsPort.getImports(sourceFile, ctx.checker);

      for (const imp of imports) {
        if (toFiles.has(imp.targetFile)) {
          diagnostics.push(new Diagnostic(
            `Forbidden dependency: ${fromSymbol.name} → ${toSymbol.name} (${imp.sourceFile} → ${imp.targetFile})`,
            DiagnosticCode.ForbiddenDependency,
            SourceRef.at(imp.sourceFile, imp.line, imp.column),
            contract.toReference(),
          ));
        }
      }
    }

    // Intra-file reference checks (for wrapped Kind members sharing a file)
    const sharedFiles = fromFilePaths.filter(f => toFiles.has(f));

    for (const filePath of sharedFiles) {
      const fromDecls = fromSymbol.declarations?.get(filePath);
      const toDecls = toSymbol.declarations?.get(filePath);
      if (!fromDecls && !toDecls) continue;

      const sfEntry = getSourceFilesForPaths(ctx, [filePath])[0];
      if (!sfEntry) continue;

      const edges = ctx.tsPort.getIntraFileReferences(sfEntry.sourceFile, ctx.checker);

      for (const edge of edges) {
        const isFromOwned = fromDecls?.has(edge.fromDeclaration) ?? false;
        const isToOwned = toDecls?.has(edge.toDeclaration) ?? false;

        if (isFromOwned && isToOwned) {
          diagnostics.push(new Diagnostic(
            `Forbidden dependency: ${fromSymbol.name} → ${toSymbol.name} (${edge.fromDeclaration} → ${edge.toDeclaration})`,
            DiagnosticCode.ForbiddenDependency,
            SourceRef.at(filePath, edge.line, edge.column),
            contract.toReference(),
          ));
        }
      }
    }

    return { diagnostics, filesAnalyzed: fromFilePaths.length };
  },
};
