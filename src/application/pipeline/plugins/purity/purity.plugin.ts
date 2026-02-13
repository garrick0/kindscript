import { ContractPlugin, getSourceFilesForPaths } from '../contract-plugin.js';
import { Contract } from '../../../../domain/entities/contract.js';
import { Diagnostic } from '../../../../domain/entities/diagnostic.js';
import { SourceRef } from '../../../../domain/value-objects/source-ref.js';
import { ContractType } from '../../../../domain/types/contract-type.js';
import { DiagnosticCode } from '../../../../domain/constants/diagnostic-codes.js';
import { NODE_BUILTINS } from '../../../../domain/constants/node-builtins.js';

export const purityPlugin: ContractPlugin = {
  type: ContractType.Purity,
  constraintName: 'pure',
  diagnosticCode: DiagnosticCode.ImpureImport,
  codeFix: {
    fixName: 'kindscript-remove-impure-import',
    description: 'Remove this import (impure import in pure layer)',
  },

  validate(args) {
    if (args.length !== 1) {
      return `purity requires exactly 1 argument (symbol), got ${args.length}`;
    }
    return null;
  },

  check(contract, ctx) {
    const [symbol] = contract.args;
    const diagnostics: Diagnostic[] = [];

    const filePaths = symbol.files;
    if (filePaths.length === 0) {
      return { diagnostics, filesAnalyzed: 0 };
    }

    for (const { file, sourceFile } of getSourceFilesForPaths(ctx, filePaths)) {
      const specifiers = ctx.tsPort.getImportModuleSpecifiers(ctx.program, sourceFile);
      for (const spec of specifiers) {
        if (NODE_BUILTINS.has(spec.moduleName)) {
          diagnostics.push(new Diagnostic(
            `Impure import in '${symbol.name}': '${spec.moduleName}'`,
            DiagnosticCode.ImpureImport,
            SourceRef.at(file, spec.line, spec.column),
            contract.toReference(),
          ));
        }
      }
    }

    return { diagnostics, filesAnalyzed: filePaths.length };
  },

  intrinsic: {
    detect(view) {
      if (view.kind !== 'object') return false;
      return view.properties.some(p => p.name === 'pure' && p.value.kind === 'boolean');
    },

    propagate(memberSymbol, memberName, location) {
      return new Contract(
        ContractType.Purity,
        `purity(${memberName})`,
        [memberSymbol],
        location,
      );
    },
  },
};
