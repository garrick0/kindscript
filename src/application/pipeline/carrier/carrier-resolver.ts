import { CarrierExpr } from '../../../domain/types/carrier';
import { FileSystemPort } from '../../ports/filesystem.port';

/**
 * Scan context needed for resolving annotation carriers.
 * Just the slice of ScanResult required for annotated export filtering.
 */
export interface ScanContext {
  annotatedExports: Array<{
    sourceFileName: string;
    view: { kindTypeName: string };
  }>;
}

/**
 * CarrierResolver — resolves carrier expressions to file sets.
 *
 * Translates algebraic CarrierExpr values into concrete file lists
 * through filesystem probing (for path carriers) and annotated export
 * filtering (for annotation carriers), with algebraic operations (union,
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
   * @param scanContext - Required for annotation carriers; optional for path-only carriers
   * @returns Array of file paths that belong to this carrier
   */
  resolve(carrier: CarrierExpr, scanContext?: ScanContext): string[] {
    switch (carrier.type) {
      case 'path':
        return this.resolvePath(carrier.path);

      case 'annotation': {
        if (!scanContext) {
          throw new Error('Annotation carriers require scan context');
        }
        return this.resolveAnnotation(carrier, scanContext);
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
   * Resolve an annotation carrier to all files containing annotated declarations.
   * Scopeless — returns ALL matching exports globally.
   * Scoping is expressed via intersect(annotation, path) in the algebra.
   */
  private resolveAnnotation(
    carrier: CarrierExpr & { type: 'annotation' },
    ctx: ScanContext,
  ): string[] {
    const matchingFiles = new Set<string>();
    for (const entry of ctx.annotatedExports) {
      if (entry.view.kindTypeName === carrier.kindTypeName) {
        matchingFiles.add(entry.sourceFileName);
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
   * Optimization: intersect(annotation, path) is the common "scoped annotation carrier"
   * pattern. Use path as a filter on annotation results rather than resolving both
   * independently (avoids needing the directory to exist for filtering-only paths).
   */
  private resolveIntersect(children: readonly CarrierExpr[], ctx?: ScanContext): string[] {
    // Optimization for intersect(annotation, path): use path as a filter, not a file source
    const annotationChild = children.find(c => c.type === 'annotation');
    const pathChild = children.find(c => c.type === 'path');

    if (children.length === 2 && annotationChild && pathChild) {
      // Special case: intersect(annotation, path) — resolve annotation, filter by path boundary
      const annotationFiles = this.resolve(annotationChild, ctx);
      const scopePath = (pathChild as { type: 'path'; path: string }).path;
      return annotationFiles.filter(f => f.startsWith(scopePath + '/') || f === scopePath);
    }

    // General case: resolve all children and intersect
    const sets = children.map(c => new Set(this.resolve(c, ctx)));
    if (sets.length === 0) return [];
    return Array.from(sets[0]).filter(f => sets.every(s => s.has(f)));
  }
}
