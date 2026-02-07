interface Kind<N extends string = string> {
  readonly kind: N;
  readonly location: string;
}

interface ContractConfig {
  noDependency?: [string, string][];
  mustImplement?: [string, string][];
  purity?: string[];
  noCycles?: string[];
  colocated?: [string, string][];
}
function defineContracts<_T = unknown>(config: ContractConfig): ContractConfig {
  return config;
}

export interface SimpleContext extends Kind<"SimpleContext"> {
  domain: DomainLayer;
}

export interface DomainLayer extends Kind<"DomainLayer"> {}

export const app: SimpleContext = {
  kind: "SimpleContext",
  location: "src",
  domain: {
    kind: "DomainLayer",
    location: "src/domain",
  },
};
