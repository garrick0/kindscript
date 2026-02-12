import { ContractPlugin } from '../contract-plugin';
import { Diagnostic } from '../../../../domain/entities/diagnostic';
import { SourceRef } from '../../../../domain/value-objects/source-ref';
import { ContractType } from '../../../../domain/types/contract-type';
import { DiagnosticCode } from '../../../../domain/constants/diagnostic-codes';

export const scopePlugin: ContractPlugin = {
  type: ContractType.Scope,
  constraintName: 'scope',
  diagnosticCode: DiagnosticCode.ScopeMismatch,

  validate(args) {
    if (args.length !== 1) {
      return `scope requires exactly 1 argument (instance symbol), got ${args.length}`;
    }
    return null;
  },

  check(contract, _ctx) {
    const [symbol] = contract.args;
    const diagnostics: Diagnostic[] = [];

    if (!symbol.carrier || symbol.carrier.type !== 'path') {
      return { diagnostics, filesAnalyzed: 0 };
    }

    const location = symbol.carrier.path;

    // The contract name encodes the expected scope: "scope:folder(name)" or "scope:file(name)"
    const expectedScope = contract.name.startsWith('scope:folder') ? 'folder' : 'file';

    const filePaths = symbol.files;

    if (expectedScope === 'folder') {
      // Folder scope: location should resolve to multiple files (directory listing)
      // A file-level path (ending .ts/.tsx) indicates a mismatch
      if (location.match(/\.tsx?$/)) {
        diagnostics.push(new Diagnostic(
          `Scope mismatch for '${symbol.name}': Kind requires folder scope, but location '${location}' is a file`,
          DiagnosticCode.ScopeMismatch,
          SourceRef.structural(symbol.name),
          contract.toReference(),
        ));
      } else if (filePaths.length === 0) {
        diagnostics.push(new Diagnostic(
          `Scope mismatch for '${symbol.name}': Kind requires folder scope, but folder '${location}' was not found`,
          DiagnosticCode.ScopeMismatch,
          SourceRef.structural(symbol.name),
          contract.toReference(),
        ));
      }
    } else {
      // File scope: location should be a single file
      if (!location.match(/\.tsx?$/)) {
        diagnostics.push(new Diagnostic(
          `Scope mismatch for '${symbol.name}': Kind requires file scope, but location '${location}' is a folder`,
          DiagnosticCode.ScopeMismatch,
          SourceRef.structural(symbol.name),
          contract.toReference(),
        ));
      } else if (filePaths.length === 0) {
        diagnostics.push(new Diagnostic(
          `Scope mismatch for '${symbol.name}': Kind requires file scope, but file '${location}' was not found`,
          DiagnosticCode.ScopeMismatch,
          SourceRef.structural(symbol.name),
          contract.toReference(),
        ));
      }
    }

    return { diagnostics, filesAnalyzed: 0 };
  },
};
