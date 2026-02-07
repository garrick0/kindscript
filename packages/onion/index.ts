/**
 * @kindscript/onion
 *
 * Pre-built Kind definitions and contracts for the Onion Architecture pattern.
 *
 * Onion Architecture organizes code into concentric rings:
 *   - Core: Domain model, entities, value objects
 *   - Domain Services: Domain logic that spans multiple entities
 *   - Application Services: Use case orchestration, application logic
 *   - Infrastructure: External concerns (persistence, messaging, UI)
 *
 * Dependencies point inward — outer rings depend on inner rings, never the reverse.
 *
 * @see https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/
 */

import { Kind, ContractConfig, defineContracts, locate, MemberMap } from 'kindscript';

// Re-export locate and MemberMap for consumers of this package
export { locate, MemberMap };

/** A bounded context following Onion Architecture. */
export interface OnionContext extends Kind<"OnionContext"> {
  /** Innermost ring — domain model, entities, value objects. */
  core: CoreLayer;
  /** Domain services spanning multiple entities. */
  domainServices: DomainServicesLayer;
  /** Application services — use case orchestration. */
  applicationServices: ApplicationServicesLayer;
  /** Outermost ring — external system integration. */
  infrastructure: InfrastructureLayer;
}

/** Core layer — domain model. */
export interface CoreLayer extends Kind<"CoreLayer"> {}

/** Domain services layer. */
export interface DomainServicesLayer extends Kind<"DomainServicesLayer"> {}

/** Application services layer. */
export interface ApplicationServicesLayer extends Kind<"ApplicationServicesLayer"> {}

/** Infrastructure layer — external concerns. */
export interface InfrastructureLayer extends Kind<"InfrastructureLayer"> {}

/** Pre-configured contracts enforcing Onion Architecture dependency rules. */
export const onionContracts = defineContracts<OnionContext>({
  noDependency: [
    ["core", "domainServices"],
    ["core", "applicationServices"],
    ["core", "infrastructure"],
    ["domainServices", "infrastructure"],
    ["applicationServices", "infrastructure"],
  ],
  purity: ["core"],
});
