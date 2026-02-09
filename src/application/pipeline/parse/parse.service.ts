import { ParseResult, ParseUseCase } from './parse.types';
import { ScanResult } from '../scan/scan.types';
import { KindDefinitionView, MemberValueView } from '../views';
import { FileSystemPort } from '../../ports/filesystem.port';
import { ArchSymbol } from '../../../domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../../domain/types/arch-symbol-kind';
import { joinPath, dirnamePath } from '../../../domain/utils/path-matching';

/**
 * KindScript Parser — builds the ArchSymbol tree from scanner output.
 *
 * This is the second pipeline stage. It takes raw views extracted by
 * the Scanner and builds the structured domain representation:
 * - ArchSymbol hierarchies (Instance → Members)
 * - Kind-type ArchSymbols
 * - Resolved file locations
 *
 * Analogous to TypeScript's Parser which takes tokens and builds
 * an AST of Nodes.
 */
export class ParseService implements ParseUseCase {
  constructor(private readonly fsPort: FileSystemPort) {}

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

      // Composite Kinds (with members) → root is the directory (members need subdirectories)
      // Leaf Kinds (no members) → root is the file itself (the file IS the entity)
      const hasMembers = kindDef.members.length > 0;
      const resolvedRoot = hasMembers
        ? dirnamePath(sourceFileName)
        : sourceFileName;

      // Build member tree from Kind definition + instance member values
      const members = this.buildMemberTree(kindDef, resolvedRoot, view.members, scanResult.kindDefs);

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

    // Add Kind-type ArchSymbols
    for (const [name] of scanResult.kindDefs) {
      symbols.push(new ArchSymbol(name, ArchSymbolKind.Kind, undefined));
    }

    // Resolve symbol locations to files
    const resolvedFiles = this.resolveSymbolFiles(symbols);

    return {
      symbols,
      kindDefs: scanResult.kindDefs,
      instanceSymbols,
      resolvedFiles,
      instanceTypeNames,
      errors,
    };
  }

  /**
   * Build member ArchSymbols from a Kind definition tree and instance member values.
   * Pure domain logic — walks MemberValueView[] against Kind-defined members.
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
   * Pre-resolve all symbol locations to their file listings.
   *
   * Walks the symbol tree and builds a map from each symbol's
   * declaredLocation to the files it contains. Only locations that
   * exist on disk are included.
   */
  private resolveSymbolFiles(symbols: ArchSymbol[]): Map<string, string[]> {
    const resolved = new Map<string, string[]>();
    for (const symbol of symbols) {
      for (const s of [symbol, ...symbol.descendants()]) {
        if (s.declaredLocation && !resolved.has(s.declaredLocation)) {
          if (this.fsPort.directoryExists(s.declaredLocation)) {
            resolved.set(
              s.declaredLocation,
              this.fsPort.readDirectory(s.declaredLocation, true),
            );
          } else if (this.fsPort.fileExists(s.declaredLocation)) {
            // File-scoped location: the location IS the single file
            resolved.set(s.declaredLocation, [s.declaredLocation]);
          }
        }
      }
    }
    return resolved;
  }
}
