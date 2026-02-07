import { ArchitecturePattern } from '../types/architecture-pattern';

/**
 * Naming conventions for generated architecture.ts files.
 *
 * These functions define the single source of truth for how
 * architecture patterns and layer names map to TypeScript type names
 * in inferred output.
 *
 * Note: stdlib packages may use different context type names
 * (see architecture-packages.ts PACKAGE_CONTEXT_TYPE).
 */

/** Convert an ArchitecturePattern to its context interface name. */
export function toContextName(pattern: ArchitecturePattern): string {
  switch (pattern) {
    case ArchitecturePattern.CleanArchitecture:
      return 'CleanArchitectureContext';
    case ArchitecturePattern.Hexagonal:
      return 'HexagonalContext';
    case ArchitecturePattern.Layered:
      return 'LayeredContext';
    default:
      return 'UnknownContext';
  }
}

/** Convert a layer directory name to a PascalCase TypeScript type name (e.g. "use-cases" → "UseCasesLayer"). */
export function toLayerTypeName(name: string): string {
  const capitalized = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return capitalized + 'Layer';
}
