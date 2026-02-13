import type { Kind, Instance } from 'kindscript';

// Wrapped Kind: pure command handlers
type HandlerFn = (command: unknown) => unknown[];
type CommandHandler = Kind<"CommandHandler", {}, { pure: true }, { wraps: HandlerFn }>;

// Layer Kinds
type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;
type ApplicationLayer = Kind<"ApplicationLayer">;
type InfrastructureLayer = Kind<"InfrastructureLayer">;

// Full architecture
type OrderingContext = Kind<"OrderingContext", {
  domain: [DomainLayer, './domain'];
  application: [ApplicationLayer, './application'];
  infrastructure: [InfrastructureLayer, './infrastructure'];
  handlers: CommandHandler;
}, {
  noDependency: [
    ["domain", "infrastructure"],
    ["domain", "application"],
    ["handlers", "infrastructure"],
  ];
  noCycles: ["domain", "application", "infrastructure"];
}>;

export const ordering = {
  domain: {},
  application: {},
  infrastructure: {},
  handlers: {},
} satisfies Instance<OrderingContext, '.'>;
