interface Kind<N extends string = string> {
  readonly kind: N;
  readonly location: string;
}

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

interface ContractConfig {
  noDependency?: [string, string][];
}
function defineContracts<_T = unknown>(config: ContractConfig): ContractConfig {
  return config;
}

export interface CleanContext extends Kind<"CleanContext"> {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}

export interface DomainLayer extends Kind<"DomainLayer"> {}
export interface ApplicationLayer extends Kind<"ApplicationLayer"> {}
export interface InfrastructureLayer extends Kind<"InfrastructureLayer"> {}

export const app = locate<CleanContext>("src", {
  domain: {},
  application: {},
  infrastructure: {},
});

export const contracts = defineContracts<CleanContext>({
  noDependency: [
    ["domain", "infrastructure"],
  ],
});
