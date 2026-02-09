/**
 * KindScript — Architectural enforcement for TypeScript.
 *
 * This is the public API entry point. Users import Kind, InstanceConfig,
 * and ConstraintConfig from 'kindscript' to write type-safe architectural
 * definitions.
 *
 * All exports are type-only — zero runtime footprint.
 */

/**
 * Constraint configuration for a Kind type.
 *
 * Intrinsic constraints (e.g., `pure`) apply to the kind itself.
 * Relational constraints (e.g., `noDependency`) apply between members.
 *
 * Member names in relational constraints are type-checked against `keyof Members`.
 *
 * @typeParam Members - The members type to validate member name references against
 */
export type ConstraintConfig<Members = Record<string, never>> = {
  /** Mark this kind as pure — no side-effect imports allowed */
  pure?: true;

  /** Forbid dependencies from one member to another */
  noDependency?: ReadonlyArray<readonly [keyof Members & string, keyof Members & string]>;

  /** Require every port interface in one member to have an adapter in another */
  mustImplement?: ReadonlyArray<readonly [keyof Members & string, keyof Members & string]>;

  /** Forbid circular dependencies between the listed members */
  noCycles?: ReadonlyArray<keyof Members & string>;

  /** Filesystem structure constraints */
  filesystem?: {
    /** Require that these member directories exist on disk */
    exists?: ReadonlyArray<keyof Members & string>;

    /** Require files in one member to have corresponding files in another */
    mirrors?: ReadonlyArray<readonly [keyof Members & string, keyof Members & string]>;
  };
};

/**
 * Base type for all architectural kind definitions.
 *
 * Users create type aliases referencing Kind to define architectural patterns.
 * All Kinds work the same way — having members is a property, not a category.
 * Constraints apply to the Kind's scope regardless of whether it has members.
 *
 * ```typescript
 * // Kind with no members — constraints apply to its own scope
 * type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;
 *
 * // Kind with members — constraints apply between members and to its scope
 * type CleanArchitecture = Kind<"CleanArchitecture", {
 *   domain: DomainLayer;
 *   infrastructure: InfrastructureLayer;
 * }, {
 *   noDependency: [["domain", "infrastructure"]];
 * }>;
 * ```
 *
 * @typeParam N - The kind name as a string literal type
 * @typeParam Members - Child kind members (defaults to none)
 * @typeParam Constraints - Architectural constraints (defaults to none)
 */
export type Kind<
  N extends string = string,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  Members extends Record<string, Kind> = {},
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  _Constraints extends ConstraintConfig<Members> = {},
> = {
  /** Discriminant identifying this kind by name */
  readonly kind: N;

  /** Filesystem path where this architectural entity lives */
  readonly location: string;
} & Members;

/**
 * Transforms a Kind type into a location-assignment type.
 *
 * Strips `kind` and `location` (derived automatically), keeps member
 * names, and allows either an empty object `{}` (no sub-members) or a
 * nested `MemberMap<ChildKind>` (with sub-members).
 *
 * @typeParam T - A Kind type
 */
export type MemberMap<T extends Kind> = {
  [K in keyof T as K extends 'kind' | 'location' ? never : K]:
    T[K] extends Kind
      ? MemberMap<T[K]> | Record<string, never>
      : never;
};

/**
 * Instance configuration type for declaring a Kind instance.
 *
 * Used with `satisfies` in regular `.ts` source files. The root directory
 * is inferred from the file's location — no explicit root needed.
 *
 * ```typescript
 * // src/architecture.ts — root is automatically "src/"
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
