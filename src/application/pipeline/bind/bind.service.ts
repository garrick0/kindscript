import { BindResult, BindUseCase } from './bind.types';
import { ParseResult } from '../parse/parse.types';
import { ScanResult } from '../scan/scan.types';
import { TypeNodeView } from '../views';
import { ArchSymbol } from '../../../domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../../domain/types/arch-symbol-kind';
import { Contract } from '../../../domain/entities/contract';
import { ContractType } from '../../../domain/types/contract-type';
import type { ConstraintProvider } from '../plugins/constraint-provider';
import { carrierKey, hasTaggedAtom } from '../../../domain/types/carrier';
import { CarrierResolver } from '../carrier/carrier-resolver';

/**
 * KindScript Binder — resolves carriers and generates Contracts.
 *
 * This is the third pipeline stage. It performs two binding operations:
 *
 * 1. **Carrier resolution** — resolves each symbol's carrier expression
 *    to actual code files, producing `resolvedFiles`. Delegates to
 *    CarrierResolver for algebraic dispatch.
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
    private readonly resolver: CarrierResolver,
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
    //    Skip path-tagged pairs — they classify on orthogonal axes
    //    (location vs type annotation), so shared files are composition, not overlap.
    for (const [, instances] of parseResult.instanceSymbols) {
      for (const instanceSymbol of instances) {
        const members = instanceSymbol.getAllMembers();
        for (let i = 0; i < members.length; i++) {
          for (let j = i + 1; j < members.length; j++) {
            if (hasTaggedAtom(members[i].carrier!) !== hasTaggedAtom(members[j].carrier!)) continue;

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

    // 5. Generate contracts from wrapped Kind constraints (standalone, not inside a parent Kind)
    this.generateWrappedKindContracts(scanResult, parseResult, contracts, resolvedFiles);

    return { contracts, resolvedFiles, containerFiles, declarationOwnership, errors };
  }

  /**
   * Unified carrier resolution — resolves each symbol's carrier expression
   * to actual code files by delegating to CarrierResolver.
   */
  private resolveMembers(
    symbols: ArchSymbol[],
    scanResult: ScanResult,
  ): Map<string, string[]> {
    const resolvedFiles = new Map<string, string[]>();

    for (const symbol of symbols) {
      for (const s of [symbol, ...symbol.descendants()]) {
        if (!s.carrier) continue;
        const key = carrierKey(s.carrier);
        if (resolvedFiles.has(key)) continue;

        const files = this.resolver.resolve(s.carrier, { taggedExports: scanResult.taggedExports });
        if (files.length > 0) {
          resolvedFiles.set(key, files);
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
      if (!symbol.carrier) continue;
      const key = carrierKey(symbol.carrier);
      if (containerFiles.has(key)) continue;

      const files = this.resolver.resolve(symbol.carrier);
      if (files.length > 0) {
        containerFiles.set(key, files);
      }
    }

    return containerFiles;
  }

  /**
   * Build declaration-level ownership mapping for intra-file dependency checking.
   *
   * For each wrapped Kind member in each instance, maps the tagged export
   * declarations back to the member's carrier key. This lets the checker
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
      if (!instanceSymbol.carrier || instanceSymbol.carrier.type !== 'path') continue;

      for (const member of instanceSymbol.members.values()) {
        if (!member.carrier || !hasTaggedAtom(member.carrier)) continue;
        const memberKey = carrierKey(member.carrier);

        // Resolve the member's carrier to get matching files
        const memberFiles = new Set(
          this.resolver.resolve(member.carrier, { taggedExports: scanResult.taggedExports })
        );

        for (const tki of scanResult.taggedExports) {
          if (!memberFiles.has(tki.sourceFileName)) continue;
          if (tki.view.kindTypeName !== member.kindTypeName) continue;

          const fileMap = ownership.get(tki.sourceFileName) ?? new Map<string, string>();
          fileMap.set(tki.view.exportName, memberKey);
          ownership.set(tki.sourceFileName, fileMap);
        }
      }
    }

    return ownership;
  }

  /**
   * Generate contracts from wrapped Kind definitions that have their own constraints.
   *
   * For each wrapped Kind with constraints, create a synthetic ArchSymbol per file
   * containing a matching tagged export, then generate contracts via intrinsic
   * propagation. This enables `Kind<"Decider", {}, { pure: true }, { wraps: DeciderFn }>`
   * to enforce purity on every file containing a Decider-tagged export.
   */
  private generateWrappedKindContracts(
    scanResult: ScanResult,
    parseResult: ParseResult,
    contracts: Contract[],
    resolvedFiles: Map<string, string[]>,
  ): void {
    // Collect wrapped Kind names that are used as members of a parent Kind —
    // intrinsic propagation (step 2b) already generates contracts for these.
    const coveredByIntrinsic = new Set<string>();
    for (const [, kindDef] of parseResult.kindDefs) {
      for (const prop of kindDef.members) {
        if (prop.typeName) {
          const memberKindDef = parseResult.kindDefs.get(prop.typeName);
          if (memberKindDef?.wrapsTypeName && memberKindDef?.constraints) {
            coveredByIntrinsic.add(prop.typeName);
          }
        }
      }
    }

    for (const [kindName, kindDef] of parseResult.kindDefs) {
      if (!kindDef.wrapsTypeName) continue;
      if (!kindDef.constraints) continue;
      if (coveredByIntrinsic.has(kindName)) continue;

      // Collect files containing tagged exports of this wrapped Kind
      const fileSet = new Set<string>();
      for (const tki of scanResult.taggedExports) {
        if (tki.view.kindTypeName === kindName) {
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
          kindName,
          ArchSymbolKind.Member,
          { type: 'path', path: filePath },
        );

        for (const plugin of this.intrinsicPlugins) {
          if (!plugin.intrinsic!.detect(kindDef.constraints!)) continue;

          const contract = plugin.intrinsic!.propagate(
            syntheticSymbol, kindName, `kind:${kindName}`
          );
          // Deduplicate
          const isDuplicate = contracts.some(c =>
            c.type === contract.type &&
            c.args.length === 1 &&
            c.args[0].carrier && carrierKey(c.args[0].carrier) === filePath &&
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

}
