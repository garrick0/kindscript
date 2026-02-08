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
 * Users create type aliases referencing Kind to define architectural patterns:
 *
 * ```typescript
 * // Leaf kind (no members, with intrinsic constraint)
 * type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;
 *
 * // Composite kind (with members and relational constraints)
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
