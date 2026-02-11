/**
 * KindScript — Architectural enforcement for TypeScript.
 *
 * This is the public API entry point. Users import Kind, Instance,
 * and Constraints from 'kindscript' to write type-safe architectural
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
export type Constraints<Members = Record<string, never>> = {
  /** Mark this kind as pure — no side-effect imports allowed */
  pure?: true;

  /** Forbid dependencies from one member to another */
  noDependency?: ReadonlyArray<readonly [keyof Members & string, keyof Members & string]>;

  /** Forbid circular dependencies between the listed members */
  noCycles?: ReadonlyArray<keyof Members & string>;

  /** Require all files in the instance scope to be assigned to a member */
  exhaustive?: true;
};

/**
 * Configuration for Kind behavior.
 *
 * @property wraps - When set, this Kind wraps a TypeScript type (declaration-level).
 *   The Kind produces `T & { brand }` instead of `{ kind, location } & Members`.
 * @property scope - Declare the expected instance scope: "folder" or "file". Validated by the scope contract.
 */
export type KindConfig = {
  wraps?: unknown;
  scope?: 'folder' | 'file';
};

/**
 * Phantom marker type that both structural and wrapped Kinds satisfy.
 * Used as the constraint for the Members parameter so that both
 * `Kind<"Foo">` and `TypeKind<"Bar", Fn>` can be used as members.
 */
export type KindRef = { readonly __kindscript_ref?: string };

/**
 * Base type for all architectural kind definitions.
 *
 * Kind is a conditional type: when `Config` includes `wraps`, it produces
 * a wrapped type (`T & { brand }`) for use as a type annotation. Otherwise,
 * it produces a structural type (`{ kind, location } & Members`) for use
 * with `satisfies Instance<T, Path>`.
 *
 * `TypeKind<N, T, C>` is sugar for `Kind<N, {}, C, { wraps: T }>`.
 *
 * ```typescript
 * // Structural Kind — used with satisfies Instance<T, Path>
 * type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;
 *
 * // Wrapped Kind — used as type annotation on exports
 * type Decider = Kind<"Decider", {}, { pure: true }, { wraps: DeciderFn }>;
 *
 * // Or equivalently using the TypeKind sugar:
 * type Decider = TypeKind<"Decider", DeciderFn, { pure: true }>;
 * ```
 *
 * @typeParam N - The kind name as a string literal type
 * @typeParam Members - Child kind members (defaults to none)
 * @typeParam _Constraints - Architectural constraints (defaults to none)
 * @typeParam _Config - Kind configuration (wraps, scope)
 */
export type Kind<
  N extends string = string,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  Members extends Record<string, KindRef | readonly [KindRef, string]> = {},
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  _Constraints extends Constraints<Members> = {},
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  _Config extends KindConfig = {},
> = (_Config extends { wraps: infer T }
  ? T & { readonly __kindscript_brand?: N } & KindRef
  : {
    /** Discriminant identifying this kind by name */
    readonly kind: N;
    /** Filesystem path where this architectural entity lives */
    readonly location: string;
  } & Members & KindRef
);

/**
 * Transforms a Kind type into a location-assignment type.
 *
 * Strips `kind`, `location`, and phantom markers (derived automatically),
 * keeps member names, and allows either an empty object `{}` (no sub-members)
 * or a nested `MemberMap<ChildKind>` (with sub-members).
 *
 * @typeParam T - A Kind type
 */
export type MemberMap<T extends KindRef> = {
  [K in keyof T as K extends 'kind' | 'location' | '__kindscript_ref' | '__kindscript_brand' ? never : K]:
    T[K] extends readonly [infer K2 extends KindRef, string]
      ? MemberMap<K2> | Record<string, never>
      : T[K] extends KindRef
        ? MemberMap<T[K]> | Record<string, never>
        : never;
};

/**
 * Instance type for declaring a Kind instance with an explicit location.
 *
 * The second type parameter specifies where the instance lives in the
 * codebase, relative to the declaration file (same as TypeScript imports).
 *
 * ```typescript
 * // src/ordering/context.ts
 * export const ordering = {
 *   domain: {},
 *   infrastructure: {},
 * } satisfies Instance<CleanArchitecture, '.'>;
 *
 * // src/architecture.ts — points to a sibling directory
 * export const ordering = {
 *   domain: {},
 *   infrastructure: {},
 * } satisfies Instance<CleanArchitecture, './ordering'>;
 * ```
 *
 * Location is required. Omitting it is a scanner error.
 *
 * Path syntax determines granularity:
 * - `'./ordering'` — folder (directory tree, all .ts files recursively)
 * - `'./helpers.ts'` — file (single source file)
 * - `'./handlers.ts#validate'` — sub-file (specific named export)
 *
 * @typeParam T - The Kind type this instance conforms to
 * @typeParam _Path - Relative path to the instance location
 */
export type Instance<T extends KindRef, _Path extends string = string> = MemberMap<T>;

/**
 * Sugar for a wrapped Kind — a type-level architectural kind that wraps
 * a TypeScript type.
 *
 * `TypeKind<N, T, C>` is exactly `Kind<N, {}, C, { wraps: T }>`.
 *
 * Instances are created by annotating exports with the TypeKind type.
 * The type annotation IS the architectural declaration — zero extra syntax.
 *
 * ```typescript
 * type DeciderFn = (command: Command) => readonly Event[];
 * type Decider = TypeKind<"Decider", DeciderFn, { pure: true }>;
 *
 * // The type annotation IS the instance:
 * export const validateOrder: Decider = (cmd) => { ... };
 * ```
 *
 * @typeParam N - The kind name as a string literal type
 * @typeParam T - The wrapped TypeScript type
 * @typeParam C - Optional constraints (e.g., `{ pure: true }`)
 */
export type TypeKind<
  N extends string,
  T,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  C extends Constraints = {},
> = Kind<N, {}, C, { wraps: T }>;
