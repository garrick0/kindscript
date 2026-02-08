import { Kind } from './kind';

/**
 * Transforms a Kind type into a location-assignment type.
 *
 * Strips `kind` and `location` (derived automatically), keeps member
 * names, and allows either an empty object `{}` (leaf) or a nested
 * `MemberMap<ChildKind>` (branch). A `path` override can be provided
 * to change the derived directory name.
 *
 * @typeParam T - A Kind type
 */
export type MemberMap<T extends Kind> = {
  [K in keyof T as K extends 'kind' | 'location' ? never : K]:
    T[K] extends Kind
      ? MemberMap<T[K]> | { path: string } & Partial<MemberMap<T[K]>> | Record<string, never>
      : never;
};

/**
 * Instance configuration type for declaring a Kind instance.
 *
 * Used with `satisfies` in `.k.ts` definition files. The root directory
 * is inferred from the `.k.ts` file's location — no explicit root needed.
 *
 * ```typescript
 * // src/context.k.ts — root is automatically "src/"
 * export const app = {
 *   domain: {},
 *   application: {},
 *   infrastructure: {},
 * } satisfies InstanceConfig<CleanArchitecture>;
 * ```
 *
 * @typeParam T - The Kind type this instance conforms to
 */
export type InstanceConfig<T extends Kind> = MemberMap<T>;
