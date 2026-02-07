/**
 * KindScript — Architectural enforcement for TypeScript.
 *
 * This is the public API entry point. Users import Kind and defineContracts
 * from 'kindscript' to write type-safe architectural definitions.
 */
export { Kind } from './runtime/kind';
export { defineContracts, ContractConfig } from './runtime/define-contracts';
