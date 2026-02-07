import { Kind } from './kind';

/**
 * Transforms a Kind interface into a location-assignment type.
 *
 * Strips `kind` and `location` (derived automatically), keeps member
 * names, and allows either an empty object `{}` (leaf) or a nested
 * `MemberMap<ChildKind>` (branch). A `path` override can be provided
 * to change the derived directory name.
 *
 * @typeParam T - A Kind interface
 */
export type MemberMap<T extends Kind> = {
  [K in keyof T as K extends 'kind' | 'location' ? never : K]:
    T[K] extends Kind
      ? MemberMap<T[K]> | { path: string } & Partial<MemberMap<T[K]>> | Record<string, never>
      : never;
};

/**
 * Declare an instance of a Kind at a root filesystem location.
 *
 * At runtime this is an identity function — it returns the members
 * object unchanged. Its purpose is to be a recognizable call expression
 * that the KindScript classifier can find in the AST.
 *
 * The classifier reads:
 * 1. The type argument `T` to identify the Kind definition
 * 2. The `root` string as the base filesystem path
 * 3. The `members` object for sub-member assignments
 *
 * Member paths are derived as `root + "/" + memberName` recursively.
 *
 * ```typescript
 * export const app = locate<CleanContext>("src", {
 *   domain: {},
 *   application: {},
 *   infrastructure: {},
 * });
 * ```
 *
 * @typeParam T - The Kind type this instance conforms to
 * @param root - Base filesystem path for this instance
 * @param members - Member assignments (structure, not locations)
 * @returns The same members object (identity function)
 */
export function locate<T extends Kind>(
  root: string,
  members: MemberMap<T>
): MemberMap<T> {
  // Suppress unused parameter warning — root is read by the AST classifier
  void root;
  return members;
}
