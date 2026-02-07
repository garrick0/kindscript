import { CheckContractsUseCase } from './check-contracts.use-case';
import { CheckContractsRequest } from './check-contracts.request';
import { CheckContractsResponse } from './check-contracts.response';
import { TypeScriptPort } from '../../ports/typescript.port';
import { FileSystemPort } from '../../ports/filesystem.port';
import { Contract } from '../../../domain/entities/contract';
import { Diagnostic } from '../../../domain/entities/diagnostic';
import { ContractType } from '../../../domain/types/contract-type';
import { Program } from '../../../domain/entities/program';

/** Node.js built-in modules that indicate impure imports. */
const NODE_BUILTINS = new Set([
  'fs', 'path', 'http', 'https', 'net', 'child_process', 'crypto', 'os',
  'process', 'stream', 'url', 'util', 'zlib', 'dns', 'tls', 'dgram',
  'cluster', 'readline', 'repl', 'vm', 'worker_threads', 'perf_hooks',
  'async_hooks', 'inspector', 'trace_events', 'v8', 'assert',
  'node:fs', 'node:path', 'node:http', 'node:https', 'node:net',
  'node:child_process', 'node:crypto', 'node:os', 'node:process',
  'node:stream', 'node:url', 'node:util', 'node:zlib', 'node:dns',
  'node:tls', 'node:dgram', 'node:cluster', 'node:readline', 'node:repl',
  'node:vm', 'node:worker_threads', 'node:perf_hooks', 'node:async_hooks',
  'node:inspector', 'node:trace_events', 'node:v8', 'node:assert',
  'fs/promises', 'stream/promises', 'dns/promises', 'readline/promises',
  'node:fs/promises', 'node:stream/promises', 'node:dns/promises',
  'node:readline/promises',
]);

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

    // Create the TypeScript program
    const program = this.tsPort.createProgram(
      request.programRootFiles,
      request.config.compilerOptions ?? {}
    );

    const checker = this.tsPort.getTypeChecker(program);

    for (const contract of request.contracts) {
      const validationError = contract.validate();
      if (validationError) {
        diagnostics.push(new Diagnostic(
          `Invalid contract '${contract.name}': ${validationError}`,
          70099,
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

    return {
      diagnostics,
      contractsChecked: request.contracts.length,
      violationsFound: diagnostics.length,
      filesAnalyzed,
    };
  }

  private checkNoDependency(
    contract: Contract,
    program: Program,
    checker: unknown
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

      const imports = this.tsPort.getImports(
        sourceFile,
        checker as ReturnType<TypeScriptPort['getTypeChecker']>
      );

      for (const imp of imports) {
        // Check if the import target is in the 'to' file set
        if (this.isFileInSymbol(imp.targetFile, toLocation, toFiles)) {
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
    checker: unknown
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

        const imports = this.tsPort.getImports(
          sourceFile,
          checker as ReturnType<TypeScriptPort['getTypeChecker']>
        );

        for (const imp of imports) {
          // Check if import target lands in any other symbol
          for (const targetSym of symbols) {
            if (targetSym.name === sym.name) continue;
            const targetLocation = targetSym.declaredLocation;
            if (!targetLocation) continue;
            const targetFiles = new Set(symbolFiles.get(targetSym.name) || []);
            if (this.isFileInSymbol(imp.targetFile, targetLocation, targetFiles)) {
              edges.get(sym.name)!.add(targetSym.name);
            }
          }
        }
      }
    }

    // DFS cycle detection
    const visited = new Set<string>();
    const inStack = new Set<string>();

    const dfs = (node: string, path: string[]): void => {
      if (inStack.has(node)) {
        // Found a cycle — extract the cycle from the path
        const cycleStart = path.indexOf(node);
        const cycle = path.slice(cycleStart);
        diagnostics.push(Diagnostic.circularDependency(cycle, contract));
        return;
      }
      if (visited.has(node)) return;

      visited.add(node);
      inStack.add(node);
      path.push(node);

      for (const neighbor of edges.get(node) || []) {
        dfs(neighbor, path);
      }

      path.pop();
      inStack.delete(node);
    };

    for (const sym of symbols) {
      dfs(sym.name, []);
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

  /**
   * Check if a file belongs to a symbol by checking both the resolved
   * file set and the path prefix with strict boundary checks.
   *
   * Uses '/' boundary delimiters to avoid false positives like
   * "src/domain-extensions/foo.ts" matching symbol "src/domain".
   */
  private isFileInSymbol(filePath: string, symbolLocation: string, resolvedFiles: Set<string>): boolean {
    if (resolvedFiles.has(filePath)) return true;

    // Normalize paths: backslashes to forward slashes, strip trailing slashes
    const normalizedFile = filePath.replace(/\\/g, '/');
    const normalizedLocation = symbolLocation.replace(/\\/g, '/').replace(/\/$/, '');

    // Strict boundary check: the location must be followed by '/' or be the exact path
    // This prevents "src/domain" from matching "src/domain-extensions/foo.ts"
    if (normalizedFile === normalizedLocation) return true;

    // Check as a path prefix with a '/' boundary
    const prefix = normalizedLocation + '/';
    if (normalizedFile.startsWith(prefix)) return true;

    // Also check when the location appears as a segment in an absolute path
    if (normalizedFile.includes('/' + prefix)) return true;

    return false;
  }
}
