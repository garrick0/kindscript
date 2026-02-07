import { ArchitecturePattern } from '../types/architecture-pattern';

/**
 * Mapping from detected architecture patterns to their stdlib package names.
 */
export const PATTERN_TO_PACKAGE: Partial<Record<ArchitecturePattern, string>> = {
  [ArchitecturePattern.CleanArchitecture]: '@kindscript/clean-architecture',
  [ArchitecturePattern.Hexagonal]: '@kindscript/hexagonal',
};

/**
 * Mapping from package names to their exported context type names.
 * Note: These may differ from inferred context names (see naming-conventions.ts).
 */
export const PACKAGE_CONTEXT_TYPE: Record<string, string> = {
  '@kindscript/clean-architecture': 'CleanContext',
  '@kindscript/hexagonal': 'HexagonalContext',
};
