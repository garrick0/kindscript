/**
 * Algebraic expression describing what code a symbol operates over.
 *
 * Atoms:
 * - `path`   — code at a filesystem path (directory or file, determined at resolution)
 * - `tagged` — ALL declarations annotated with InstanceOf<K> across the project
 *
 * Operations:
 * - `union`     — files from any child carrier
 * - `exclude`   — files from base minus files from excluded
 * - `intersect` — files common to all child carriers
 *
 * Scoping is expressed through composition, not built into atoms.
 * A "scoped tagged carrier" is `intersect(tagged(K), path(scope))`.
 *
 * CarrierExpr is a pure value — no behavior, no resolution, no filesystem access.
 * Resolution is the CarrierResolver's responsibility.
 */
export type CarrierExpr =
  | { readonly type: 'path'; readonly path: string }
  | { readonly type: 'tagged'; readonly kindTypeName: string }
  | { readonly type: 'union'; readonly children: readonly CarrierExpr[] }
  | { readonly type: 'exclude'; readonly base: CarrierExpr; readonly excluded: CarrierExpr }
  | { readonly type: 'intersect'; readonly children: readonly CarrierExpr[] };

/**
 * Deterministic string serialization of a CarrierExpr, usable as a Map key.
 *
 * CRITICAL PROPERTY: For path carriers, returns the raw path string.
 * This ensures backward compatibility during migration — map lookups that used
 * `symbol.id` (which was the path string) now use `carrierKey(symbol.carrier)`
 * and get the same string for path-based symbols.
 */
export function carrierKey(carrier: CarrierExpr): string {
  switch (carrier.type) {
    case 'path':
      return carrier.path;
    case 'tagged':
      return `tagged:${carrier.kindTypeName}`;
    case 'union':
      return `union(${carrier.children.map(carrierKey).sort().join(',')})`;
    case 'exclude':
      return `exclude(${carrierKey(carrier.base)},${carrierKey(carrier.excluded)})`;
    case 'intersect':
      return `intersect(${carrier.children.map(carrierKey).sort().join(',')})`;
  }
}

/**
 * Check if a carrier expression contains a tagged atom (indicating a wrapped Kind member).
 *
 * Replaces the old `isWrappedKind(kindDefs, typeName)` pattern.
 * The carrier itself encodes whether it involves tagged declarations.
 */
export function hasTaggedAtom(carrier: CarrierExpr): boolean {
  switch (carrier.type) {
    case 'tagged':
      return true;
    case 'path':
      return false;
    case 'union':
    case 'intersect':
      return carrier.children.some(hasTaggedAtom);
    case 'exclude':
      return hasTaggedAtom(carrier.base);
  }
}
