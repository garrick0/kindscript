import { ParseResult, ParseUseCase } from './parse.types';
import { ScanResult } from '../scan/scan.types';
import { KindDefinitionView, MemberValueView } from '../views';
import { ArchSymbol } from '../../../domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../../domain/types/arch-symbol-kind';
import { CarrierExpr } from '../../../domain/types/carrier';
import { joinPath, dirnamePath, resolvePath } from '../../../infrastructure/path/path-utils';

/**
 * KindScript Parser — builds the ArchSymbol tree from scanner output.
 *
 * This is the second pipeline stage. It takes raw views extracted by
 * the Scanner and builds the structured domain representation:
 * - ArchSymbol hierarchies (Instance → Members)
 * - Kind-type ArchSymbols
 *
 * The parser is purely structural — it builds the tree and computes
 * carrier expressions, but does NOT resolve carriers to actual files.
 * Carrier resolution (symbol.files) is the Binder's responsibility.
 *
 * Analogous to TypeScript's Parser which takes tokens and builds
 * an AST of Nodes (no semantic info, no symbol table).
 */
export class ParseService implements ParseUseCase {
  execute(scanResult: ScanResult): ParseResult {
    const symbols: ArchSymbol[] = [];
    const errors: string[] = [];
    const instanceSymbols = new Map<string, ArchSymbol[]>();
    const instanceTypeNames = new Map<string, string>();

    // Build Instance ArchSymbols from scanned instances
    for (const { view, sourceFileName } of scanResult.instances) {
      const kindDef = scanResult.kindDefs.get(view.kindTypeName);
      if (!kindDef) {
        errors.push(`Instance<${view.kindTypeName}>: no Kind definition found for '${view.kindTypeName}'.`);
        continue;
      }

      // Resolve instance location from declared path (relative to declaration file)
      const baseDir = dirnamePath(sourceFileName);
      let resolvedRoot: string;
      let exportName: string | undefined;

      const hashIndex = view.declaredPath.indexOf('#');
      if (hashIndex !== -1) {
        // Sub-file path: ./file.ts#exportName
        const filePart = view.declaredPath.substring(0, hashIndex);
        exportName = view.declaredPath.substring(hashIndex + 1);
        resolvedRoot = resolvePath(baseDir, filePart);
      } else {
        resolvedRoot = resolvePath(baseDir, view.declaredPath);
      }

      // Build member tree from Kind definition + instance member values
      const members = this.buildMemberTree(kindDef, resolvedRoot, view.members, scanResult.kindDefs);

      const carrier: CarrierExpr = exportName
        ? { type: 'path', path: resolvedRoot, exportName }
        : { type: 'path', path: resolvedRoot };

      const symbol = new ArchSymbol(
        view.variableName,
        ArchSymbolKind.Instance,
        carrier,
        members,
        view.kindTypeName,
      );

      symbols.push(symbol);

      const arr = instanceSymbols.get(view.kindTypeName) ?? [];
      arr.push(symbol);
      instanceSymbols.set(view.kindTypeName, arr);
      instanceTypeNames.set(view.variableName, view.kindTypeName);
    }

    // Add Kind-type ArchSymbols
    for (const [name] of scanResult.kindDefs) {
      symbols.push(new ArchSymbol(name, ArchSymbolKind.Kind, undefined));
    }

    return {
      symbols,
      kindDefs: scanResult.kindDefs,
      instanceSymbols,
      instanceTypeNames,
      errors,
    };
  }

  /**
   * Build member ArchSymbols from a Kind definition tree and instance member values.
   * Pure domain logic — walks MemberValueView[] against Kind-defined members.
   * Produces carrier expressions for each member.
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

      // Use explicit location from Kind definition when available;
      // fall back to name-based derivation
      const memberPath = property.location
        ? resolvePath(parentPath, property.location)
        : joinPath(parentPath, memberName);

      // Determine carrier expression: wrapped Kind members get intersect(tagged, path)
      const isWrapped = memberKindTypeName != null
        && childKindDef?.wrapsTypeName != null;

      const carrier: CarrierExpr = isWrapped
        ? {
            // Scoped annotation carrier: intersect the global annotation set with the parent's path.
            // "All annotated declarations within the parent instance's scope."
            type: 'intersect',
            children: [
              { type: 'annotation', kindTypeName: memberKindTypeName! },
              { type: 'path', path: parentPath },
            ],
          }
        : { type: 'path', path: memberPath };

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
        carrier,
        childMembers,
        memberKindTypeName,
      );
      members.set(memberName, memberSymbol);
    }

    return members;
  }
}
