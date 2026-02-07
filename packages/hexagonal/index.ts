/**
 * @kindscript/hexagonal
 *
 * Pre-built Kind definitions and contracts for the Hexagonal Architecture pattern
 * (Ports & Adapters).
 *
 * Hexagonal Architecture organizes code into:
 *   - Domain: Core business logic
 *   - Ports: Interfaces defining how the domain communicates with the outside
 *   - Adapters: Implementations of ports for specific technologies
 *
 * @see https://alistair.cockburn.us/hexagonal-architecture/
 */

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

/** A bounded context following Hexagonal Architecture (Ports & Adapters). */
export interface HexagonalContext extends Kind<"HexagonalContext"> {
  /** Core business logic — pure, no external dependencies. */
  domain: DomainLayer;
  /** Port interfaces defining external communication contracts. */
  ports: PortsLayer;
  /** Adapter implementations connecting ports to technologies. */
  adapters: AdaptersLayer;
}

/** Domain layer — core business logic. */
export interface DomainLayer extends Kind<"DomainLayer"> {}

/** Ports layer — interface definitions. */
export interface PortsLayer extends Kind<"PortsLayer"> {}

/** Adapters layer — port implementations. */
export interface AdaptersLayer extends Kind<"AdaptersLayer"> {}

/** Pre-configured contracts enforcing Hexagonal Architecture rules. */
export const hexagonalContracts = defineContracts<HexagonalContext>({
  noDependency: [
    ["domain", "adapters"],
  ],
  mustImplement: [
    ["ports", "adapters"],
  ],
  purity: ["domain"],
});
