import { ClassifyASTUseCase } from './classify-ast.use-case';
import { ClassifyASTRequest, ClassifyASTResponse } from './classify-ast.types';
import { ASTViewPort, KindDefinitionView, MemberValueView, TypeNodeView } from '../../ports/ast.port';
import { ArchSymbol } from '../../../domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../../domain/types/arch-symbol-kind';
import { Contract } from '../../../domain/entities/contract';
import { joinPath, dirnamePath } from '../../../domain/utils/path-matching';
import type { ConstraintProvider } from './constraint-provider';

/**
 * Real implementation of ClassifyASTUseCase.
 *
 * This is the "KindScript Binder" from V4 Part 4.1. It has two responsibilities:
 * 1. Find Kind definitions (type aliases referencing Kind<N, Members, Constraints>)
 * 2. Find Instance declarations ({ ... } satisfies InstanceConfig<T>)
 *
 * After finding Kind definitions it performs constraint propagation:
 * when a Kind used as a member carries its own constraints (e.g., pure: true),
 * those constraints are automatically applied to the parent Kind's scope.
 *
 * The service consumes pre-extracted domain views from ASTViewPort,
 * keeping all AST mechanics in the adapter layer.
 */
export class ClassifyASTService implements ClassifyASTUseCase {
  private readonly pluginsByName: Map<string, ConstraintProvider>;
  private readonly intrinsicPlugins: ConstraintProvider[];

  constructor(
    private readonly astPort: ASTViewPort,
    plugins: ConstraintProvider[],
  ) {
    this.pluginsByName = new Map(plugins.map(p => [p.constraintName, p]));
    this.intrinsicPlugins = plugins.filter(p => p.intrinsic != null);
  }

  execute(request: ClassifyASTRequest): ClassifyASTResponse {
    const symbols: ArchSymbol[] = [];
    const contracts: Contract[] = [];
    const errors: string[] = [];

    // Maps for cross-referencing between phases
    const kindDefs = new Map<string, KindDefinitionView>();
    const instanceSymbols = new Map<string, ArchSymbol[]>(); // kindName → instance ArchSymbols
    const instanceTypeNames = new Map<string, string>(); // instanceName → kindTypeName

    // First pass: Find Kind definitions and Instance declarations across all files.
    for (const sourceFile of request.definitionFiles) {
      // Phase 1: Extract Kind definitions
      const kindResult = this.astPort.getKindDefinitions(sourceFile, request.checker);
      errors.push(...kindResult.errors);
      for (const view of kindResult.data) {
        kindDefs.set(view.typeName, view);
      }

      // Phase 2: Extract Instance declarations
      const instanceResult = this.astPort.getInstanceDeclarations(sourceFile, request.checker);
      errors.push(...instanceResult.errors);
      for (const view of instanceResult.data) {
        const kindDef = kindDefs.get(view.kindTypeName);
        if (!kindDef) {
          errors.push(`InstanceConfig<${view.kindTypeName}>: no Kind definition found for '${view.kindTypeName}'.`);
          continue;
        }

        // Root is the directory containing the definition file
        const resolvedRoot = dirnamePath(sourceFile.fileName);

        // Build member tree from Kind definition + instance member values
        const members = this.buildMemberTree(kindDef, resolvedRoot, view.members, kindDefs);

        const symbol = new ArchSymbol(
          view.variableName,
          ArchSymbolKind.Instance,
          resolvedRoot,
          members,
          view.kindTypeName,
        );

        symbols.push(symbol);

        const arr = instanceSymbols.get(view.kindTypeName) ?? [];
        arr.push(symbol);
        instanceSymbols.set(view.kindTypeName, arr);
        instanceTypeNames.set(view.variableName, view.kindTypeName);
      }
    }

    // Generate contracts from type-level constraints (constraints + propagation)
    this.generateTypeLevelContracts(kindDefs, instanceSymbols, contracts, errors);

    // Also add kind definitions to symbol list as Kind-type ArchSymbols
    for (const [name] of kindDefs) {
      const kindSymbol = new ArchSymbol(
        name,
        ArchSymbolKind.Kind,
        undefined, // Kinds don't have locations, instances do
      );
      symbols.push(kindSymbol);
    }

    return { symbols, contracts, instanceTypeNames, errors };
  }

  /**
   * Build member ArchSymbols from a Kind definition tree and instance member values.
   * Pure domain logic — no port calls, walks MemberValueView[] against Kind-defined members.
   */
  private buildMemberTree(
    kindDef: KindDefinitionView,
    parentPath: string,
    memberValues: MemberValueView[],
    kindDefs: Map<string, KindDefinitionView>,
  ): Map<string, ArchSymbol> {
    const members = new Map<string, ArchSymbol>();

    for (const property of kindDef.members) {
      const memberName = property.name;
      const memberKindTypeName = property.typeName;

      // Get child Kind definition for recursion
      const childKindDef = memberKindTypeName ? kindDefs.get(memberKindTypeName) : undefined;

      // Find corresponding member value from the instance declaration
      const memberValue = memberValues.find(m => m.name === memberName);

      const memberPath = joinPath(parentPath, memberName);

      // Recurse if child Kind has properties and member value has children
      let childMembers = new Map<string, ArchSymbol>();
      if (childKindDef && childKindDef.members.length > 0 && memberValue?.children) {
        childMembers = this.buildMemberTree(
          childKindDef, memberPath, memberValue.children, kindDefs
        );
      }

      const memberSymbol = new ArchSymbol(
        memberName,
        ArchSymbolKind.Member,
        memberPath,
        childMembers,
        memberKindTypeName,
        true, // locationDerived
      );
      members.set(memberName, memberSymbol);
    }

    return members;
  }

  /**
   * Generate contracts from type-level constraints on Kind definitions.
   * Also propagates intrinsic constraints (e.g., pure) from member Kinds to their parents.
   */
  private generateTypeLevelContracts(
    kindDefs: Map<string, KindDefinitionView>,
    instanceSymbols: Map<string, ArchSymbol[]>,
    contracts: Contract[],
    errors: string[],
  ): void {
    for (const [kindName, kindDef] of kindDefs) {
      const instances = instanceSymbols.get(kindName);
      if (!instances || instances.length === 0) continue; // No instances for this Kind — skip

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
          const memberKindDef = kindDefs.get(prop.typeName);
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
