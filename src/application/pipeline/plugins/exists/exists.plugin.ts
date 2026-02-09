import { ContractPlugin } from '../contract-plugin';
import { Diagnostic } from '../../../../domain/entities/diagnostic';
import { ContractType } from '../../../../domain/types/contract-type';
import { DiagnosticCode } from '../../../../domain/constants/diagnostic-codes';
import { generateFromStringList } from '../generator-helpers';

export const existsPlugin: ContractPlugin = {
  type: ContractType.Exists,
  constraintName: 'filesystem.exists',
  diagnosticCode: DiagnosticCode.LocationNotFound,

  validate(args) {
    if (args.length < 1) {
      return `exists requires at least 1 argument, got ${args.length}`;
    }
    return null;
  },

  generate(value, instanceSymbol, kindName, location) {
    return generateFromStringList(value, instanceSymbol, kindName, location, ContractType.Exists, 'filesystem.exists');
  },

  check(contract, ctx) {
    const diagnostics: Diagnostic[] = [];

    for (const symbol of contract.args) {
      const location = symbol.declaredLocation;
      if (!location) continue;
      if (!ctx.resolvedFiles.has(location)) {
        diagnostics.push(new Diagnostic(
          `Derived location '${location}' does not exist. ` +
          `Expected directory for member '${symbol.name}' of ${symbol.kindTypeName ?? 'unknown'} ` +
          `(derived from root '${contract.location ?? ''}').`,
          DiagnosticCode.LocationNotFound,
          '',
          0,
          0,
          undefined,
          location,
        ));
      }
    }

    return { diagnostics, filesAnalyzed: 0 };
  },
};
