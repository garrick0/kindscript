/**
 * Architectural kind definitions for the clean-arch fixture.
 */

// Kind<N> interface (normally imported from 'kindscript')
interface Kind<N extends string = string> {
  readonly kind: N;
  readonly location: string;
}

// MemberMap + locate (normally imported from 'kindscript')
type MemberMap<T extends Kind> = {
  [K in keyof T as K extends 'kind' | 'location' ? never : K]:
    T[K] extends Kind
      ? MemberMap<T[K]> | { path: string } & Partial<MemberMap<T[K]>> | Record<string, never>
      : never;
};
function locate<T extends Kind>(root: string, members: MemberMap<T>): MemberMap<T> {
  void root;
  return members;
}

// Contract config type (normally imported from 'kindscript')
interface ContractConfig {
  noDependency?: [string, string][];
}
function defineContracts<_T = unknown>(config: ContractConfig): ContractConfig {
  return config;
}

// Kind definitions
export interface CleanContext extends Kind<"CleanContext"> {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}

export interface DomainLayer extends Kind<"DomainLayer"> {
}

export interface InfrastructureLayer extends Kind<"InfrastructureLayer"> {
}

// Instance declaration using locate<T>()
export const app = locate<CleanContext>("src", {
  domain: {},
  infrastructure: {},
});

// Contract declaration
export const contracts = defineContracts<CleanContext>({
  noDependency: [
    ["domain", "infrastructure"],
  ],
});
