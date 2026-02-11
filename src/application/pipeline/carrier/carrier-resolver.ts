import { CarrierExpr } from '../../../domain/types/carrier';
import { FileSystemPort } from '../../ports/filesystem.port';

/**
 * Scan context needed for resolving tagged carriers.
 * Just the slice of ScanResult required for tagged export filtering.
 */
export interface ScanContext {
  taggedExports: Array<{
    sourceFileName: string;
    view: { kindTypeName: string };
  }>;
}

/**
 * CarrierResolver — resolves carrier expressions to file sets.
 *
 * Translates algebraic CarrierExpr values into concrete file lists
 * through filesystem probing (for path carriers) and tagged export
 * filtering (for tagged carriers), with algebraic operations (union,
 * exclude, intersect) composed recursively.
 *
 * This is an application-layer service that collaborates with the Binder.
 * It depends on FileSystemPort and receives ScanContext as data.
 */
export class CarrierResolver {
  constructor(private readonly fsPort: FileSystemPort) {}

  /**
   * Resolve a carrier expression to its constituent files.
   *
   * @param carrier - The carrier expression to resolve
   * @param scanContext - Required for tagged carriers; optional for path-only carriers
   * @returns Array of file paths that belong to this carrier
   */
  resolve(carrier: CarrierExpr, scanContext?: ScanContext): string[] {
    switch (carrier.type) {
      case 'path':
        return this.resolvePath(carrier.path);

      case 'tagged': {
        if (!scanContext) {
          throw new Error('Tagged carriers require scan context');
        }
        return this.resolveTagged(carrier, scanContext);
      }

      case 'union':
        return this.resolveUnion(carrier.children, scanContext);

      case 'exclude':
        return this.resolveExclude(carrier, scanContext);

      case 'intersect':
        return this.resolveIntersect(carrier.children, scanContext);
    }
  }

  /**
   * Resolve a path carrier to its file list.
   * Directories → recursive listing, files → single-element array.
   */
  private resolvePath(path: string): string[] {
    if (this.fsPort.directoryExists(path)) {
      return this.fsPort.readDirectory(path, true);
    }
    if (this.fsPort.fileExists(path)) {
      return [path];
    }
    return [];
  }

  /**
   * Resolve a tagged carrier to all files containing InstanceOf<K> declarations.
   * Scopeless — returns ALL matching exports globally.
   * Scoping is expressed via intersect(tagged, path) in the algebra.
   */
  private resolveTagged(
    carrier: CarrierExpr & { type: 'tagged' },
    ctx: ScanContext,
  ): string[] {
    const matchingFiles = new Set<string>();
    for (const tki of ctx.taggedExports) {
      if (tki.view.kindTypeName === carrier.kindTypeName) {
        matchingFiles.add(tki.sourceFileName);
      }
    }
    return Array.from(matchingFiles);
  }

  /**
   * Resolve a union carrier — files from any child.
   */
  private resolveUnion(children: readonly CarrierExpr[], ctx?: ScanContext): string[] {
    const all = new Set<string>();
    for (const child of children) {
      for (const f of this.resolve(child, ctx)) {
        all.add(f);
      }
    }
    return Array.from(all);
  }

  /**
   * Resolve an exclude carrier — files from base minus files from excluded.
   */
  private resolveExclude(
    carrier: CarrierExpr & { type: 'exclude' },
    ctx?: ScanContext,
  ): string[] {
    const base = new Set(this.resolve(carrier.base, ctx));
    for (const f of this.resolve(carrier.excluded, ctx)) {
      base.delete(f);
    }
    return Array.from(base);
  }

  /**
   * Resolve an intersect carrier — files common to all children.
   *
   * Optimization: intersect(tagged, path) is the common "scoped tagged carrier"
   * pattern. Use path as a filter on tagged results rather than resolving both
   * independently (avoids needing the directory to exist for filtering-only paths).
   */
  private resolveIntersect(children: readonly CarrierExpr[], ctx?: ScanContext): string[] {
    // Optimization for intersect(tagged, path): use path as a filter, not a file source
    const taggedChild = children.find(c => c.type === 'tagged');
    const pathChild = children.find(c => c.type === 'path');

    if (children.length === 2 && taggedChild && pathChild) {
      // Special case: intersect(tagged, path) — resolve tagged, filter by path boundary
      const taggedFiles = this.resolve(taggedChild, ctx);
      const scopePath = (pathChild as { type: 'path'; path: string }).path;
      return taggedFiles.filter(f => f.startsWith(scopePath + '/') || f === scopePath);
    }

    // General case: resolve all children and intersect
    const sets = children.map(c => new Set(this.resolve(c, ctx)));
    if (sets.length === 0) return [];
    return Array.from(sets[0]).filter(f => sets.every(s => s.has(f)));
  }
}
