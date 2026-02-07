interface Kind<N extends string = string> {
  readonly kind: N;
  readonly location: string;
}

interface ContractConfig {
  noDependency?: [string, string][];
  noCycles?: string[];
}
function defineContracts<_T = unknown>(config: ContractConfig): ContractConfig {
  return config;
}

export interface AppContext extends Kind<"AppContext"> {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}

export interface DomainLayer extends Kind<"DomainLayer"> {
}

export interface InfrastructureLayer extends Kind<"InfrastructureLayer"> {
}

export const app: AppContext = {
  kind: "AppContext",
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

export const contracts = defineContracts<AppContext>({
  noCycles: ["domain", "infrastructure"],
});
