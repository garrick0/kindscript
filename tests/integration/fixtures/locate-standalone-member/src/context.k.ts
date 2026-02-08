/**
 * Fixture for Axis 2: standalone variable reference.
 * The domain member is declared as a standalone variable, then referenced by identifier.
 */

type Kind<
  N extends string = string,
  Members extends Record<string, Kind> = {},
  _Constraints extends ConstraintConfig<Members> = {},
> = {
  readonly kind: N;
  readonly location: string;
} & Members;

type ConstraintConfig<Members = Record<string, never>> = {
  pure?: true;
  noDependency?: ReadonlyArray<readonly [keyof Members & string, keyof Members & string]>;
  mustImplement?: ReadonlyArray<readonly [keyof Members & string, keyof Members & string]>;
  noCycles?: ReadonlyArray<keyof Members & string>;
  filesystem?: {
    exists?: ReadonlyArray<keyof Members & string>;
    mirrors?: ReadonlyArray<readonly [keyof Members & string, keyof Members & string]>;
  };
};

type MemberMap<T extends Kind> = {
  [K in keyof T as K extends 'kind' | 'location' ? never : K]:
    T[K] extends Kind
      ? MemberMap<T[K]> | { path: string } & Partial<MemberMap<T[K]>> | Record<string, never>
      : never;
};

type InstanceConfig<T extends Kind> = MemberMap<T>;

export type DomainLayer = Kind<"DomainLayer">;

export type AppContext = Kind<"AppContext", {
  domain: DomainLayer;
}, {
  noDependency: [["domain", "domain"]];
}>;

// Standalone member variable -- referenced by identifier in the instance
const domainConfig = {};

export const app = {
  domain: domainConfig,
} satisfies InstanceConfig<AppContext>;
