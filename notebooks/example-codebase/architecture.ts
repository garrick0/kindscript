// ─── Runtime types (inlined so the example is self-contained) ───

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
  purity?: string[];
  mustImplement?: [string, string][];
}
function defineContracts<_T = unknown>(config: ContractConfig): ContractConfig {
  return config;
}

// ─── Kind Definitions ───

export interface ShopContext extends Kind<"ShopContext"> {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}

export interface DomainLayer extends Kind<"DomainLayer"> {}
export interface ApplicationLayer extends Kind<"ApplicationLayer"> {}
export interface InfrastructureLayer extends Kind<"InfrastructureLayer"> {}

// ─── Instance ───

export const shop = locate<ShopContext>("src", {
  domain: {},
  application: {},
  infrastructure: {},
});

// ─── Contracts ───

export const contracts = defineContracts<ShopContext>({
  // Domain cannot reach outward
  noDependency: [
    ["domain", "application"],
    ["domain", "infrastructure"],
    ["application", "infrastructure"],
  ],

  // Domain must be free of Node.js built-ins (fs, http, crypto, etc.)
  purity: ["domain"],

  // Every exported interface in application must have an `implements` in infrastructure
  mustImplement: [
    ["application", "infrastructure"],
  ],
});
