import { ContractPlugin, getSourceFilesForPaths } from '../contract-plugin';
import { Diagnostic } from '../../../../domain/entities/diagnostic';
import { SourceRef } from '../../../../domain/value-objects/source-ref';
import { ContractType } from '../../../../domain/types/contract-type';
import { DiagnosticCode } from '../../../../domain/constants/diagnostic-codes';
import { carrierKey } from '../../../../domain/types/carrier';
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

    const fromKey = fromSymbol.carrier ? carrierKey(fromSymbol.carrier) : undefined;
    const toKey = toSymbol.carrier ? carrierKey(toSymbol.carrier) : undefined;
    if (!fromKey || !toKey) {
      return { diagnostics, filesAnalyzed: 0 };
    }

    const fromFilePaths = ctx.resolvedFiles.get(fromKey) ?? [];
    const toFiles = new Set(ctx.resolvedFiles.get(toKey) ?? []);

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
    if (ctx.declarationOwnership) {
      const sharedFiles = fromFilePaths.filter(f => toFiles.has(f));

      for (const filePath of sharedFiles) {
        const fileOwnership = ctx.declarationOwnership.get(filePath);
        if (!fileOwnership) continue;

        const sfEntry = getSourceFilesForPaths(ctx, [filePath])[0];
        if (!sfEntry) continue;

        const edges = ctx.tsPort.getIntraFileReferences(sfEntry.sourceFile, ctx.checker);

        for (const edge of edges) {
          const fromOwner = fileOwnership.get(edge.fromDeclaration);
          const toOwner = fileOwnership.get(edge.toDeclaration);

          if (fromOwner === fromKey && toOwner === toKey) {
            diagnostics.push(new Diagnostic(
              `Forbidden dependency: ${fromSymbol.name} → ${toSymbol.name} (${edge.fromDeclaration} → ${edge.toDeclaration})`,
              DiagnosticCode.ForbiddenDependency,
              SourceRef.at(filePath, edge.line, edge.column),
              contract.toReference(),
            ));
          }
        }
      }
    }

    return { diagnostics, filesAnalyzed: fromFilePaths.length };
  },
};
