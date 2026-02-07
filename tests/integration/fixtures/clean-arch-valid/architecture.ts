interface Kind<N extends string = string> {
  readonly kind: N;
  readonly location: string;
}

interface ContractConfig {
  noDependency?: [string, string][];
}
function defineContracts<_T = unknown>(config: ContractConfig): ContractConfig {
  return config;
}

export interface CleanContext extends Kind<"CleanContext"> {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}

export interface DomainLayer extends Kind<"DomainLayer"> {}

export interface InfrastructureLayer extends Kind<"InfrastructureLayer"> {}

export const app: CleanContext = {
  kind: "CleanContext",
  location: "src",
  domain: {
    kind: "DomainLayer",
    location: "src/domain",
  },
  infrastructure: {
    kind: "InfrastructureLayer",
    location: "src/infrastructure",
  },
};

export const contracts = defineContracts<CleanContext>({
  noDependency: [
    ["domain", "infrastructure"],
  ],
});
