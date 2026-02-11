import { BindResult, BindUseCase } from './bind.types';
import { ParseResult } from '../parse/parse.types';
import { ScanResult } from '../scan/scan.types';
import { TypeNodeView } from '../views';
import { ArchSymbol } from '../../../domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../../domain/types/arch-symbol-kind';
import { Contract } from '../../../domain/entities/contract';
import { ContractType } from '../../../domain/types/contract-type';
import { FileSystemPort } from '../../ports/filesystem.port';
import type { ConstraintProvider } from '../plugins/constraint-provider';

/**
 * KindScript Binder — resolves names and generates Contracts.
 *
 * This is the third pipeline stage. It performs two binding operations:
 *
 * 1. **Name resolution** — resolves each symbol's id to
 *    actual code files, producing `resolvedFiles`. Uses a unified
 *    resolution strategy: TypeKind members → declaration resolution,
 *    then directory → folder resolution, then file → file resolution.
 *
 * 2. **Constraint binding** — walks constraint trees and generates
 *    Contracts that connect symbols to the rules they must obey.
 *
 * Analogous to TypeScript's Binder which takes the AST and creates
 * a Symbol table with scope chains (name resolution) and flow
 * containers (control flow analysis).
 */
export class BindService implements BindUseCase {
  private readonly pluginsByName: Map<string, ConstraintProvider>;
  private readonly intrinsicPlugins: ConstraintProvider[];

  constructor(
    plugins: ConstraintProvider[],
    private readonly fsPort: FileSystemPort,
  ) {
    this.pluginsByName = new Map(plugins.map(p => [p.constraintName, p]));
    this.intrinsicPlugins = plugins.filter(p => p.intrinsic != null);
  }

  execute(parseResult: ParseResult, scanResult: ScanResult): BindResult {
    const contracts: Contract[] = [];
    const errors: string[] = [];

    // 1. Name resolution — resolve symbols to code files
    const resolvedFiles = this.resolveMembers(parseResult.symbols, scanResult);

    // 1b. Container resolution — resolve instance roots to total owned file set
    const containerFiles = this.resolveContainers(parseResult.symbols);

    // 1c. Declaration ownership — map typed exports to their owning member symbol
    const declarationOwnership = this.buildDeclarationOwnership(parseResult.symbols, scanResult);

    // 2. Generate contracts from Kind constraints
    for (const [kindName, kindDef] of parseResult.kindDefs) {
      const instances = parseResult.instanceSymbols.get(kindName);
      if (!instances || instances.length === 0) continue;

      for (const instanceSymbol of instances) {
        // 2a. Generate contracts from the Kind's own relational constraints
        if (kindDef.constraints) {
          this.walkConstraints(
            kindDef.constraints, instanceSymbol, kindName, `type:${kindName}`, contracts, errors
          );
        }

        // 2b. Propagate intrinsic constraints from member Kinds
        for (const prop of kindDef.members) {
          if (!prop.typeName) continue;
          const memberKindDef = parseResult.kindDefs.get(prop.typeName);
          if (!memberKindDef?.constraints) continue;

          for (const plugin of this.intrinsicPlugins) {
            if (!plugin.intrinsic!.detect(memberKindDef.constraints)) continue;

            const memberSymbol = instanceSymbol.findByPath(prop.name);
            if (memberSymbol) {
              const contract = plugin.intrinsic!.propagate(
                memberSymbol, prop.name, `type:${kindName}`
              );
              // Deduplicate: don't add if already declared for THIS specific member symbol
              const isDuplicate = contracts.some(c =>
                c.type === contract.type &&
                c.args.length === 1 &&
                c.args[0] === memberSymbol
              );
              if (!isDuplicate) {
                contracts.push(contract);
              }
            }
          }
        }
      }
    }

    // 3. Generate scope contracts for instances whose Kind declares a scope
    for (const [kindName, kindDef] of parseResult.kindDefs) {
      if (!kindDef.scope) continue;
      const instances = parseResult.instanceSymbols.get(kindName);
      if (!instances) continue;

      for (const instanceSymbol of instances) {
        contracts.push(new Contract(
          ContractType.Scope,
          `scope:${kindDef.scope}(${instanceSymbol.name})`,
          [instanceSymbol],
          `type:${kindName}`,
        ));
      }
    }

    // 4. Generate overlap contracts for sibling members within each instance
    //    Skip folder-TypeKind pairs — they classify on orthogonal axes
    //    (location vs type annotation), so shared files are composition, not overlap.
    const isTypeKindMember = (m: ArchSymbol) =>
      m.kindTypeName != null && scanResult.typeKindDefs.has(m.kindTypeName);

    for (const [, instances] of parseResult.instanceSymbols) {
      for (const instanceSymbol of instances) {
        const members = instanceSymbol.getAllMembers();
        for (let i = 0; i < members.length; i++) {
          for (let j = i + 1; j < members.length; j++) {
            if (isTypeKindMember(members[i]) !== isTypeKindMember(members[j])) continue;

            contracts.push(new Contract(
              ContractType.Overlap,
              `overlap:${members[i].name}/${members[j].name}`,
              [members[i], members[j]],
              `instance:${instanceSymbol.name}`,
            ));
          }
        }
      }
    }

    // 5. Generate contracts from TypeKind constraints (standalone, not inside a parent Kind)
    this.generateTypeKindContracts(scanResult, contracts, resolvedFiles);

    return { contracts, resolvedFiles, containerFiles, declarationOwnership, errors };
  }

  /**
   * Unified name resolution — resolves each symbol's id
   * to actual code files.
   *
   * Resolution strategy per member:
   * 1. TypeKind member (has entry in typeKindDefs) → declaration resolution
   *    (collect typed exports within parent scope)
   * 2. Directory exists at location → folder resolution
   *    (all .ts files in that directory)
   * 3. File exists at location → file resolution
   *    (that single file)
   * 4. None matched → unresolved (omitted from resolvedFiles)
   */
  private resolveMembers(
    symbols: ArchSymbol[],
    scanResult: ScanResult,
  ): Map<string, string[]> {
    const resolvedFiles = new Map<string, string[]>();

    // Resolve filesystem locations (directory/file)
    for (const symbol of symbols) {
      for (const s of [symbol, ...symbol.descendants()]) {
        if (!s.id || resolvedFiles.has(s.id)) continue;

        // Check if this is a TypeKind member — handled separately below
        if (s.kindTypeName && scanResult.typeKindDefs.has(s.kindTypeName)) continue;

        const files = this.resolvePathToFiles(s.id);
        if (files) {
          resolvedFiles.set(s.id, files);
        }
      }
    }

    // Resolve TypeKind members (typed exports within parent scope)
    for (const instanceSymbol of symbols) {
      if (instanceSymbol.kind !== ArchSymbolKind.Instance) continue;
      const parentScope = instanceSymbol.id;
      if (!parentScope) continue;

      for (const member of instanceSymbol.members.values()) {
        if (!member.kindTypeName) continue;
        if (!scanResult.typeKindDefs.has(member.kindTypeName)) continue;

        // Collect matching typed exports within parent scope
        const matchingFiles = new Set<string>();
        for (const tki of scanResult.typeKindInstances) {
          if (tki.view.kindTypeName === member.kindTypeName &&
              this.isUnderScope(tki.sourceFileName, parentScope)) {
            matchingFiles.add(tki.sourceFileName);
          }
        }

        if (member.id) {
          resolvedFiles.set(member.id, Array.from(matchingFiles));
        }
      }
    }

    return resolvedFiles;
  }

  /**
   * Resolve instance roots to total owned file sets.
   * One readDirectory() call per folder-scoped instance.
   */
  private resolveContainers(symbols: ArchSymbol[]): Map<string, string[]> {
    const containerFiles = new Map<string, string[]>();

    for (const symbol of symbols) {
      if (symbol.kind !== ArchSymbolKind.Instance) continue;
      const root = symbol.id;
      if (!root || containerFiles.has(root)) continue;

      const files = this.resolvePathToFiles(root);
      if (files) {
        containerFiles.set(root, files);
      }
    }

    return containerFiles;
  }

  /**
   * Build declaration-level ownership mapping for intra-file dependency checking.
   *
   * For each TypeKind member in each instance, maps the typed export
   * declarations back to the member's symbol ID. This lets the checker
   * know which declarations belong to which member when checking
   * intra-file noDependency constraints.
   */
  private buildDeclarationOwnership(
    symbols: ArchSymbol[],
    scanResult: ScanResult,
  ): Map<string, Map<string, string>> {
    const ownership = new Map<string, Map<string, string>>();

    for (const instanceSymbol of symbols) {
      if (instanceSymbol.kind !== ArchSymbolKind.Instance) continue;
      const parentScope = instanceSymbol.id;
      if (!parentScope) continue;

      for (const member of instanceSymbol.members.values()) {
        if (!member.kindTypeName || !member.id) continue;
        if (!scanResult.typeKindDefs.has(member.kindTypeName)) continue;

        for (const tki of scanResult.typeKindInstances) {
          if (tki.view.kindTypeName !== member.kindTypeName) continue;
          if (!this.isUnderScope(tki.sourceFileName, parentScope)) continue;

          const fileMap = ownership.get(tki.sourceFileName) ?? new Map<string, string>();
          fileMap.set(tki.view.exportName, member.id);
          ownership.set(tki.sourceFileName, fileMap);
        }
      }
    }

    return ownership;
  }

  /**
   * Generate contracts from TypeKind definitions that have their own constraints.
   *
   * For each TypeKind with constraints, create a synthetic ArchSymbol per file
   * containing a matching typed export, then generate contracts via intrinsic
   * propagation. This enables `TypeKind<"Decider", DeciderFn, { pure: true }>`
   * to enforce purity on every file containing a Decider-typed export.
   */
  private generateTypeKindContracts(
    scanResult: ScanResult,
    contracts: Contract[],
    resolvedFiles: Map<string, string[]>,
  ): void {
    for (const [tkName, tkDef] of scanResult.typeKindDefs) {
      if (!tkDef.constraints) continue;

      // Collect files containing exports of this TypeKind
      const fileSet = new Set<string>();
      for (const tki of scanResult.typeKindInstances) {
        if (tki.view.kindTypeName === tkName) {
          fileSet.add(tki.sourceFileName);
        }
      }

      if (fileSet.size === 0) continue;

      // For each file, create a synthetic symbol and generate intrinsic contracts
      for (const filePath of fileSet) {
        // Register this file in resolvedFiles so the checker can find it
        if (!resolvedFiles.has(filePath)) {
          resolvedFiles.set(filePath, [filePath]);
        }

        const syntheticSymbol = new ArchSymbol(
          tkName,
          ArchSymbolKind.Member,
          filePath,
        );

        for (const plugin of this.intrinsicPlugins) {
          if (!plugin.intrinsic!.detect(tkDef.constraints!)) continue;

          const contract = plugin.intrinsic!.propagate(
            syntheticSymbol, tkName, `typekind:${tkName}`
          );
          // Deduplicate
          const isDuplicate = contracts.some(c =>
            c.type === contract.type &&
            c.args.length === 1 &&
            c.args[0].id === filePath &&
            c.name === contract.name
          );
          if (!isDuplicate) {
            contracts.push(contract);
          }
        }
      }
    }
  }

  /**
   * Walk a TypeNodeView constraint tree and generate Contract objects.
   * Uses plugins to map dotted property names to generators.
   * Recurses into 'object' nodes to build dotted names.
   */
  private walkConstraints(
    view: TypeNodeView,
    instanceSymbol: ArchSymbol,
    kindName: string,
    location: string,
    contracts: Contract[],
    errors: string[],
    namePrefix: string = '',
  ): void {
    if (view.kind !== 'object') return;

    for (const prop of view.properties) {
      const fullName = namePrefix ? `${namePrefix}.${prop.name}` : prop.name;
      const value = prop.value;

      // Recurse into nested objects to build dotted constraint names
      if (value.kind === 'object') {
        this.walkConstraints(value, instanceSymbol, kindName, location, contracts, errors, fullName);
        continue;
      }

      // Look up plugin
      const plugin = this.pluginsByName.get(fullName);
      if (!plugin) {
        errors.push(`Unknown constraint '${fullName}' in Kind<${kindName}>.`);
        continue;
      }

      // Intrinsic constraints (e.g., pure) are handled by propagation, not here
      if (plugin.intrinsic && !plugin.generate) continue;

      const result = plugin.generate!(value, instanceSymbol, kindName, location);
      contracts.push(...result.contracts);
      errors.push(...result.errors);
    }
  }

  /** Resolve a path to its file list (directory → recursive listing, file → single-element). */
  private resolvePathToFiles(path: string): string[] | undefined {
    if (this.fsPort.directoryExists(path)) {
      return this.fsPort.readDirectory(path, true);
    }
    if (this.fsPort.fileExists(path)) {
      return [path];
    }
    return undefined;
  }

  /** Check that filePath starts with scope at a path segment boundary. */
  private isUnderScope(filePath: string, scope: string): boolean {
    return filePath.startsWith(scope + '/') || filePath === scope;
  }
}
