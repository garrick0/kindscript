/**
 * Configuration object for defining architectural contracts.
 *
 * Each key is a contract type, and the value is an array of
 * argument tuples specifying which members the contract applies to.
 */
export interface ContractConfig {
  /** Forbids dependencies from one member to another */
  noDependency?: [string, string][];

  /** Requires that every port has a corresponding adapter implementation */
  mustImplement?: [string, string][];

  /** Requires that a layer has no impure imports (no Node.js built-ins) */
  purity?: string[];

  /** Forbids circular dependencies between the listed layers */
  noCycles?: string[];

  /** Requires that files in the primary location have counterparts in the related location */
  colocated?: [string, string][];
}

/**
 * Define architectural contracts for a kind.
 *
 * This is a marker function — at runtime it returns the config object
 * unchanged. Its purpose is to be a recognizable call expression that
 * the KindScript classifier can find in the AST.
 *
 * The type parameter `T` is used by the classifier to associate contracts
 * with the correct kind definition.
 *
 * ```typescript
 * export const contracts = defineContracts<OrderingContext>({
 *   noDependency: [
 *     ["domain", "infrastructure"],
 *   ],
 * });
 * ```
 *
 * @typeParam T - The kind type these contracts apply to
 * @param config - Contract definitions
 * @returns The same config object (identity function)
 */
export function defineContracts<_T = unknown>(config: ContractConfig): ContractConfig {
  return config;
}
