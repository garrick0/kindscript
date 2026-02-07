/**
 * KindScript — Architectural enforcement for TypeScript.
 *
 * This is the public API entry point. Users import Kind, defineContracts,
 * locate, and MemberMap from 'kindscript' to write type-safe architectural
 * definitions.
 */
export { Kind } from './runtime/kind';
export { defineContracts, ContractConfig } from './runtime/define-contracts';
export { locate, MemberMap } from './runtime/locate';
