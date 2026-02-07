import { ArchSymbol } from '../../domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../domain/types/arch-symbol-kind';
import { Contract } from '../../domain/entities/contract';
import { ContractType } from '../../domain/types/contract-type';
import { KindScriptConfig } from '../ports/config.port';

/**
 * Result of building symbols and contracts from config.
 */
export interface ConfigBuildResult {
  symbols: ArchSymbol[];
  contracts: Contract[];
  errors: string[];
}

/**
 * Builds ArchSymbol and Contract domain objects from a kindscript.json config.
 *
 * This is a temporary bridge for M1. In M2, symbols will come from
 * real AST classification of Kind<N> definitions.
 */
export class ConfigSymbolBuilder {
  /**
   * Build symbols and contracts from config.
   * @param config The KindScript config
   * @param projectRoot Optional absolute project root to resolve relative paths
   */
  build(config: KindScriptConfig, projectRoot?: string): ConfigBuildResult {
    const symbolMap = new Map<string, ArchSymbol>();
    const contracts: Contract[] = [];
    const errors: string[] = [];

    if (!config.contracts) {
      return { symbols: [], contracts: [], errors: [] };
    }

    // Warn about unsupported contract types
    const supportedTypes = new Set<string>([ContractType.NoDependency]);
    for (const key of Object.keys(config.contracts)) {
      if (!supportedTypes.has(key)) {
        errors.push(`Contract type '${key}' is not yet supported (will be available in a future milestone). Skipping.`);
      }
    }

    // Process noDependency contracts
    const noDeps = config.contracts[ContractType.NoDependency];
    if (Array.isArray(noDeps)) {
      for (const entry of noDeps) {
        const result = this.parseNoDependencyEntry(entry, symbolMap, projectRoot);
        if (result.error) {
          errors.push(result.error);
        } else if (result.contract) {
          contracts.push(result.contract);
        }
      }
    }

    return {
      symbols: Array.from(symbolMap.values()),
      contracts,
      errors,
    };
  }

  private parseNoDependencyEntry(
    entry: unknown,
    symbolMap: Map<string, ArchSymbol>,
    projectRoot?: string
  ): { contract?: Contract; error?: string } {
    // Support two formats:
    // 1. { from: "src/domain", to: "src/infrastructure" }
    // 2. ["src/domain", "src/infrastructure"]

    let fromPath: string;
    let toPath: string;

    if (Array.isArray(entry) && entry.length === 2) {
      fromPath = String(entry[0]);
      toPath = String(entry[1]);
    } else if (entry && typeof entry === 'object' && 'from' in entry && 'to' in entry) {
      const obj = entry as { from: string; to: string };
      fromPath = obj.from;
      toPath = obj.to;
    } else {
      return { error: `Invalid noDependency entry: ${JSON.stringify(entry)}. Expected { from, to } or [from, to].` };
    }

    // Resolve relative paths against project root
    const resolvedFrom = projectRoot ? this.joinPath(projectRoot, fromPath) : fromPath;
    const resolvedTo = projectRoot ? this.joinPath(projectRoot, toPath) : toPath;

    const fromSymbol = this.getOrCreateSymbol(resolvedFrom, symbolMap);
    const toSymbol = this.getOrCreateSymbol(resolvedTo, symbolMap);

    const contract = new Contract(
      ContractType.NoDependency,
      `noDependency(${fromPath} -> ${toPath})`,
      [fromSymbol, toSymbol],
      'kindscript.json'
    );

    return { contract };
  }

  private joinPath(root: string, relative: string): string {
    // Simple path join that avoids importing Node's path module
    // to keep the application layer pure
    const normalizedRoot = root.replace(/\/$/, '');
    const normalizedRelative = relative.replace(/^\//, '');
    return `${normalizedRoot}/${normalizedRelative}`;
  }

  private getOrCreateSymbol(path: string, symbolMap: Map<string, ArchSymbol>): ArchSymbol {
    const existing = symbolMap.get(path);
    if (existing) return existing;

    // Infer the symbol name from the last path segment
    const name = path.split('/').pop() || path;

    const symbol = new ArchSymbol(
      name,
      ArchSymbolKind.Layer,
      path
    );

    symbolMap.set(path, symbol);
    return symbol;
  }
}
