import { BindResult, BindUseCase } from './bind.types';
import { ParseResult } from '../parse/parse.types';
import { TypeNodeView } from '../views';
import { ArchSymbol } from '../../../domain/entities/arch-symbol';
import { Contract } from '../../../domain/entities/contract';
import type { ConstraintProvider } from '../plugins/constraint-provider';

/**
 * KindScript Binder — generates Contracts from constraint trees.
 *
 * This is the third pipeline stage. It takes the parsed ArchSymbol tree
 * and creates bindings (Contracts) that connect symbols to the rules
 * they must obey. The `findByPath()` calls are name resolution — the
 * same thing TypeScript's binder does when it resolves an identifier
 * to a declaration.
 *
 * Analogous to TypeScript's Binder which takes the AST and creates
 * a Symbol table with scope chains.
 */
export class BindService implements BindUseCase {
  private readonly pluginsByName: Map<string, ConstraintProvider>;
  private readonly intrinsicPlugins: ConstraintProvider[];

  constructor(plugins: ConstraintProvider[]) {
    this.pluginsByName = new Map(plugins.map(p => [p.constraintName, p]));
    this.intrinsicPlugins = plugins.filter(p => p.intrinsic != null);
  }

  execute(parseResult: ParseResult): BindResult {
    const contracts: Contract[] = [];
    const errors: string[] = [];

    for (const [kindName, kindDef] of parseResult.kindDefs) {
      const instances = parseResult.instanceSymbols.get(kindName);
      if (!instances || instances.length === 0) continue;

      for (const instanceSymbol of instances) {
        // 1. Generate contracts from the Kind's own relational constraints
        if (kindDef.constraints) {
          this.walkConstraints(
            kindDef.constraints, instanceSymbol, kindName, `type:${kindName}`, contracts, errors
          );
        }

        // 2. Propagate intrinsic constraints from member Kinds
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

    return { contracts, errors };
  }

  /**
   * Walk a TypeNodeView constraint tree and generate Contract objects.
   * Uses plugins to map dotted property names to generators.
   * Recurses into 'object' nodes to build dotted names (e.g., "filesystem.exists").
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

      // Recurse into nested objects (e.g., filesystem: { exists: ..., mirrors: ... })
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
