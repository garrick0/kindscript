interface Kind<N extends string = string> {
  readonly kind: N;
  readonly location: string;
}

interface ContractConfig {
  noDependency?: [string, string][];
  purity?: string[];
}
function defineContracts<_T = unknown>(config: ContractConfig): ContractConfig {
  return config;
}

export interface AppContext extends Kind<"AppContext"> {
  domain: DomainLayer;
}

export interface DomainLayer extends Kind<"DomainLayer"> {
}

export const app: AppContext = {
  kind: "AppContext",
  location: "src",
  domain: {
    kind: "DomainLayer",
    location: "src/domain",
  },
};

export const contracts = defineContracts<AppContext>({
  purity: ["domain"],
});
