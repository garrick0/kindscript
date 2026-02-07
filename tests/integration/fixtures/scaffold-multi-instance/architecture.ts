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

export interface OrderingContext extends Kind<"OrderingContext"> {
  domain: OrderingDomain;
  infrastructure: OrderingInfra;
}

export interface OrderingDomain extends Kind<"OrderingDomain"> {}
export interface OrderingInfra extends Kind<"OrderingInfra"> {}

export interface BillingContext extends Kind<"BillingContext"> {
  domain: BillingDomain;
  adapters: BillingAdapters;
}

export interface BillingDomain extends Kind<"BillingDomain"> {}
export interface BillingAdapters extends Kind<"BillingAdapters"> {}

export const ordering = locate<OrderingContext>("src/ordering", {
  domain: {},
  infrastructure: {},
});

export const billing = locate<BillingContext>("src/billing", {
  domain: {},
  adapters: {},
});
