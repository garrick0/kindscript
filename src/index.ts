/**
 * KindScript — Architectural enforcement for TypeScript.
 *
 * This is the public API entry point. Users import Kind, InstanceConfig,
 * and ConstraintConfig from 'kindscript' to write type-safe architectural
 * definitions.
 *
 * All exports are type-only — zero runtime footprint.
 */
export type { Kind, ConstraintConfig } from './runtime/kind';
export type { MemberMap, InstanceConfig } from './runtime/locate';
