import { ContractPlugin, getSourceFilesForPaths } from '../contract-plugin';
import { Contract } from '../../../../domain/entities/contract';
import { Diagnostic } from '../../../../domain/entities/diagnostic';
import { ContractType } from '../../../../domain/types/contract-type';
import { DiagnosticCode } from '../../../../domain/constants/diagnostic-codes';
import { NODE_BUILTINS } from '../../../../domain/constants/node-builtins';

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

    const location = symbol.declaredLocation;
    if (!location) {
      return { diagnostics, filesAnalyzed: 0 };
    }

    const filePaths = ctx.resolvedFiles.get(location) ?? [];

    for (const { file, sourceFile } of getSourceFilesForPaths(ctx, filePaths)) {
      const specifiers = ctx.tsPort.getImportModuleSpecifiers(ctx.program, sourceFile);
      for (const spec of specifiers) {
        if (NODE_BUILTINS.has(spec.moduleName)) {
          diagnostics.push(new Diagnostic(
            `Impure import in pure layer: '${spec.moduleName}'`,
            DiagnosticCode.ImpureImport,
            file,
            spec.line,
            spec.column,
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
