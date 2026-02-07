/**
 * @kindscript/clean-architecture
 *
 * Pre-built Kind definitions and contracts for the Clean Architecture pattern.
 *
 * Clean Architecture organizes code into three concentric layers:
 *   - Domain: Pure business logic with no external dependencies
 *   - Application: Use cases orchestrating domain objects
 *   - Infrastructure: Adapters connecting to external systems
 *
 * @see https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
 */

import { Kind, ContractConfig, defineContracts, locate, MemberMap } from 'kindscript';

// Re-export locate and MemberMap for consumers of this package
export { locate, MemberMap };

/** A bounded context following Clean Architecture principles. */
export interface CleanContext extends Kind<"CleanContext"> {
  /** Pure business logic with no external dependencies. */
  domain: DomainLayer;
  /** Use cases orchestrating domain objects. */
  application: ApplicationLayer;
  /** Adapters connecting to external systems. */
  infrastructure: InfrastructureLayer;
}

/** Domain layer — pure business logic, no I/O. */
export interface DomainLayer extends Kind<"DomainLayer"> {}

/** Application layer — use case orchestration. */
export interface ApplicationLayer extends Kind<"ApplicationLayer"> {}

/** Infrastructure layer — external system adapters. */
export interface InfrastructureLayer extends Kind<"InfrastructureLayer"> {}

/** Pre-configured contracts enforcing Clean Architecture dependency rules. */
export const cleanArchitectureContracts = defineContracts<CleanContext>({
  noDependency: [
    ["domain", "infrastructure"],
    ["domain", "application"],
    ["application", "infrastructure"],
  ],
  purity: ["domain"],
});
