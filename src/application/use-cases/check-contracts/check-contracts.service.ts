import { CheckContractsUseCase } from './check-contracts.use-case';
import { CheckContractsRequest } from './check-contracts.request';
import { CheckContractsResponse } from './check-contracts.response';
import { TypeScriptPort, TypeChecker } from '../../ports/typescript.port';
import { FileSystemPort } from '../../ports/filesystem.port';
import { ArchSymbol } from '../../../domain/entities/arch-symbol';
import { Contract } from '../../../domain/entities/contract';
import { Diagnostic } from '../../../domain/entities/diagnostic';
import { ContractType } from '../../../domain/types/contract-type';
import { DiagnosticCode } from '../../../domain/constants/diagnostic-codes';
import { Program } from '../../../domain/entities/program';
import { NODE_BUILTINS } from '../../../domain/constants/node-builtins';
import { isFileInSymbol } from '../../../domain/utils/path-matching';
import { findCycles } from '../../../domain/utils/cycle-detection';

/**
 * Real implementation of CheckContractsUseCase.
 *
 * Evaluates architectural contracts against a TypeScript program.
 */
export class CheckContractsService implements CheckContractsUseCase {
  constructor(
    private readonly tsPort: TypeScriptPort,
    private readonly fsPort: FileSystemPort
  ) {}

  execute(request: CheckContractsRequest): CheckContractsResponse {
    const diagnostics: Diagnostic[] = [];
    let filesAnalyzed = 0;

    const program = request.program;
    const checker = this.tsPort.getTypeChecker(program);

    for (const contract of request.contracts) {
      const validationError = contract.validate();
      if (validationError) {
        diagnostics.push(new Diagnostic(
          `Invalid contract '${contract.name}': ${validationError}`,
          DiagnosticCode.InvalidContract,
          contract.location ?? '<config>',
          0,
          0
        ));
        continue;
      }

      switch (contract.type) {
        case ContractType.NoDependency: {
          const result = this.checkNoDependency(contract, program, checker);
          diagnostics.push(...result.diagnostics);
          filesAnalyzed += result.filesAnalyzed;
          break;
        }
        case ContractType.Purity: {
          const result = this.checkPurity(contract, program);
          diagnostics.push(...result.diagnostics);
          filesAnalyzed += result.filesAnalyzed;
          break;
        }
        case ContractType.NoCycles: {
          const result = this.checkNoCycles(contract, program, checker);
          diagnostics.push(...result.diagnostics);
          filesAnalyzed += result.filesAnalyzed;
          break;
        }
        case ContractType.MustImplement: {
          const result = this.checkMustImplement(contract, program);
          diagnostics.push(...result.diagnostics);
          filesAnalyzed += result.filesAnalyzed;
          break;
        }
        case ContractType.Colocated: {
          const result = this.checkColocated(contract);
          diagnostics.push(...result.diagnostics);
          filesAnalyzed += result.filesAnalyzed;
          break;
        }
      }
    }

    // Existence checking for locate-based instances (locationDerived members)
    for (const symbol of request.symbols) {
      const existenceResult = this.checkExistence(symbol);
      diagnostics.push(...existenceResult.diagnostics);
    }

    return {
      diagnostics,
      contractsChecked: request.contracts.length,
      violationsFound: diagnostics.length,
      filesAnalyzed,
    };
  }

  /**
   * Check that all derived member locations actually exist on the filesystem.
   * Only checks members with locationDerived === true (from locate<T>() calls).
   */
  private checkExistence(symbol: ArchSymbol): { diagnostics: Diagnostic[] } {
    const diagnostics: Diagnostic[] = [];

    for (const member of symbol.descendants()) {
      if (!member.locationDerived) continue;
      if (!member.declaredLocation) continue;
      if (!this.fsPort.directoryExists(member.declaredLocation)) {
        diagnostics.push(Diagnostic.locationNotFound(
          member.declaredLocation,
          member.name,
          member.kindTypeName ?? 'unknown',
          symbol.declaredLocation ?? '',
        ));
      }
    }

    return { diagnostics };
  }

  private checkNoDependency(
    contract: Contract,
    program: Program,
    checker: TypeChecker
  ): { diagnostics: Diagnostic[]; filesAnalyzed: number } {
    const [fromSymbol, toSymbol] = contract.args;
    const diagnostics: Diagnostic[] = [];

    // Resolve files for 'from' symbol
    const fromLocation = fromSymbol.declaredLocation;
    const toLocation = toSymbol.declaredLocation;
    if (!fromLocation || !toLocation) {
      return { diagnostics, filesAnalyzed: 0 };
    }

    const fromFiles = this.fsPort.readDirectory(fromLocation, true);
    const toFiles = new Set(this.fsPort.readDirectory(toLocation, true));

    // For each file in the 'from' symbol, check imports
    for (const fromFile of fromFiles) {
      const sourceFile = this.tsPort.getSourceFile(program, fromFile);
      if (!sourceFile) continue;

      const imports = this.tsPort.getImports(sourceFile, checker);

      for (const imp of imports) {
        // Check if the import target is in the 'to' file set
        if (isFileInSymbol(imp.targetFile, toLocation, toFiles)) {
          diagnostics.push(Diagnostic.forbiddenDependency(imp, contract));
        }
      }
    }

    return { diagnostics, filesAnalyzed: fromFiles.length };
  }

  private checkPurity(
    contract: Contract,
    program: Program
  ): { diagnostics: Diagnostic[]; filesAnalyzed: number } {
    const [symbol] = contract.args;
    const diagnostics: Diagnostic[] = [];

    const location = symbol.declaredLocation;
    if (!location) {
      return { diagnostics, filesAnalyzed: 0 };
    }

    const files = this.fsPort.readDirectory(location, true);

    for (const file of files) {
      const sourceFile = this.tsPort.getSourceFile(program, file);
      if (!sourceFile) continue;

      const specifiers = this.tsPort.getImportModuleSpecifiers(program, sourceFile);
      for (const spec of specifiers) {
        if (NODE_BUILTINS.has(spec.moduleName)) {
          diagnostics.push(Diagnostic.impureImport(
            file, spec.moduleName, spec.line, spec.column, contract
          ));
        }
      }
    }

    return { diagnostics, filesAnalyzed: files.length };
  }

  private checkNoCycles(
    contract: Contract,
    program: Program,
    checker: TypeChecker
  ): { diagnostics: Diagnostic[]; filesAnalyzed: number } {
    const diagnostics: Diagnostic[] = [];
    const symbols = contract.args;
    let filesAnalyzed = 0;

    // Map each symbol name to its files
    const symbolFiles = new Map<string, string[]>();
    for (const sym of symbols) {
      if (sym.declaredLocation) {
        symbolFiles.set(sym.name, this.fsPort.readDirectory(sym.declaredLocation, true));
      } else {
        symbolFiles.set(sym.name, []);
      }
    }

    // Build directed graph: edges[A] = Set of B where A imports from B
    const edges = new Map<string, Set<string>>();
    for (const sym of symbols) {
      edges.set(sym.name, new Set());
    }

    for (const sym of symbols) {
      const files = symbolFiles.get(sym.name) || [];
      filesAnalyzed += files.length;

      for (const file of files) {
        const sourceFile = this.tsPort.getSourceFile(program, file);
        if (!sourceFile) continue;

        const imports = this.tsPort.getImports(sourceFile, checker);

        for (const imp of imports) {
          // Check if import target lands in any other symbol
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

    // Detect cycles using shared domain utility
    const cycles = findCycles(edges);
    for (const cycle of cycles) {
      diagnostics.push(Diagnostic.circularDependency(cycle, contract));
    }

    return { diagnostics, filesAnalyzed };
  }

  private checkMustImplement(
    contract: Contract,
    program: Program
  ): { diagnostics: Diagnostic[]; filesAnalyzed: number } {
    const [portsSymbol, adaptersSymbol] = contract.args;
    const diagnostics: Diagnostic[] = [];

    const portsLocation = portsSymbol.declaredLocation;
    const adaptersLocation = adaptersSymbol.declaredLocation;
    if (!portsLocation || !adaptersLocation) {
      return { diagnostics, filesAnalyzed: 0 };
    }

    const portFiles = this.fsPort.readDirectory(portsLocation, true);
    const adapterFiles = this.fsPort.readDirectory(adaptersLocation, true);

    // Collect all exported interface names from port files
    const interfaceNames: string[] = [];
    for (const file of portFiles) {
      const sourceFile = this.tsPort.getSourceFile(program, file);
      if (!sourceFile) continue;
      interfaceNames.push(...this.tsPort.getExportedInterfaceNames(program, sourceFile));
    }

    // For each interface, check if any adapter file implements it
    for (const ifaceName of interfaceNames) {
      let found = false;
      for (const file of adapterFiles) {
        const sourceFile = this.tsPort.getSourceFile(program, file);
        if (!sourceFile) continue;
        if (this.tsPort.hasClassImplementing(program, sourceFile, ifaceName)) {
          found = true;
          break;
        }
      }
      if (!found) {
        diagnostics.push(Diagnostic.missingImplementation(
          ifaceName, adaptersLocation, contract
        ));
      }
    }

    return { diagnostics, filesAnalyzed: portFiles.length + adapterFiles.length };
  }

  private checkColocated(
    contract: Contract
  ): { diagnostics: Diagnostic[]; filesAnalyzed: number } {
    const [primarySymbol, relatedSymbol] = contract.args;
    const diagnostics: Diagnostic[] = [];

    const primaryLocation = primarySymbol.declaredLocation;
    const relatedLocation = relatedSymbol.declaredLocation;
    if (!primaryLocation || !relatedLocation) {
      return { diagnostics, filesAnalyzed: 0 };
    }

    const primaryFiles = this.fsPort.readDirectory(primaryLocation, true);
    const relatedFiles = new Set(
      this.fsPort.readDirectory(relatedLocation, true)
        .map(f => this.fsPort.basename(f))
    );

    for (const file of primaryFiles) {
      const basename = this.fsPort.basename(file);
      if (!relatedFiles.has(basename)) {
        const expectedFile = `${relatedLocation}/${basename}`;
        diagnostics.push(Diagnostic.notColocated(file, expectedFile, contract));
      }
    }

    return { diagnostics, filesAnalyzed: primaryFiles.length };
  }

}
