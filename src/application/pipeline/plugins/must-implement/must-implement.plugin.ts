import { ContractPlugin, getSourceFilesForPaths } from '../contract-plugin';
import { Diagnostic } from '../../../../domain/entities/diagnostic';
import { ContractType } from '../../../../domain/types/contract-type';
import { DiagnosticCode } from '../../../../domain/constants/diagnostic-codes';
import { generateFromTuplePairs } from '../generator-helpers';

export const mustImplementPlugin: ContractPlugin = {
  type: ContractType.MustImplement,
  constraintName: 'mustImplement',
  diagnosticCode: DiagnosticCode.MissingImplementation,

  validate(args) {
    if (args.length !== 2) {
      return `mustImplement requires exactly 2 arguments (interface, implementation), got ${args.length}`;
    }
    return null;
  },

  generate(value, instanceSymbol, kindName, location) {
    return generateFromTuplePairs(value, instanceSymbol, kindName, location, ContractType.MustImplement, 'mustImplement');
  },

  check(contract, ctx) {
    const [portsSymbol, adaptersSymbol] = contract.args;
    const diagnostics: Diagnostic[] = [];

    const portsLocation = portsSymbol.declaredLocation;
    const adaptersLocation = adaptersSymbol.declaredLocation;
    if (!portsLocation || !adaptersLocation) {
      return { diagnostics, filesAnalyzed: 0 };
    }

    const portFilePaths = ctx.resolvedFiles.get(portsLocation) ?? [];
    const adapterFilePaths = ctx.resolvedFiles.get(adaptersLocation) ?? [];

    const interfaceNames: string[] = [];
    for (const { sourceFile } of getSourceFilesForPaths(ctx, portFilePaths)) {
      interfaceNames.push(...ctx.tsPort.getExportedInterfaceNames(ctx.program, sourceFile));
    }

    for (const ifaceName of interfaceNames) {
      let found = false;
      for (const { sourceFile } of getSourceFilesForPaths(ctx, adapterFilePaths)) {
        if (ctx.tsPort.hasClassImplementing(ctx.program, sourceFile, ifaceName)) {
          found = true;
          break;
        }
      }
      if (!found) {
        diagnostics.push(new Diagnostic(
          `Port '${ifaceName}' has no corresponding adapter implementation (expected in '${adaptersLocation}')`,
          DiagnosticCode.MissingImplementation,
          '',
          0,
          0,
          contract.toReference(),
          contract.location || adaptersLocation,
        ));
      }
    }

    return { diagnostics, filesAnalyzed: portFilePaths.length + adapterFilePaths.length };
  },
};
