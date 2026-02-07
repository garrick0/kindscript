interface Kind<N extends string = string> {
  readonly kind: N;
  readonly location: string;
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

export const ordering: OrderingContext = {
  kind: "OrderingContext",
  location: "src/ordering",
  domain: {
    kind: "OrderingDomain",
    location: "src/ordering/domain",
  },
  infrastructure: {
    kind: "OrderingInfra",
    location: "src/ordering/infrastructure",
  },
};

export const billing: BillingContext = {
  kind: "BillingContext",
  location: "src/billing",
  domain: {
    kind: "BillingDomain",
    location: "src/billing/domain",
  },
  adapters: {
    kind: "BillingAdapters",
    location: "src/billing/adapters",
  },
};
