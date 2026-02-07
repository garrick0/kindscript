/**
 * Architectural kind definitions for the clean-arch fixture.
 */

// Kind<N> interface (normally imported from 'kindscript')
interface Kind<N extends string = string> {
  readonly kind: N;
  readonly location: string;
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

// Instance declaration
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

// Contract declaration
export const contracts = defineContracts<CleanContext>({
  noDependency: [
    ["domain", "infrastructure"],
  ],
});
