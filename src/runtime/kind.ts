/**
 * Base interface for all architectural kind definitions.
 *
 * Users extend this interface to define architectural patterns:
 *
 * ```typescript
 * export interface OrderingContext extends Kind<"OrderingContext"> {
 *   domain: DomainLayer;
 *   infrastructure: InfrastructureLayer;
 * }
 * ```
 *
 * The type parameter `N` captures the kind name as a string literal type,
 * creating a nominal discriminant. The `location` property maps the kind
 * instance to a filesystem path.
 *
 * @typeParam N - The kind name as a string literal type
 */
export interface Kind<N extends string = string> {
  /** Discriminant identifying this kind by name */
  readonly kind: N;

  /** Filesystem path where this architectural entity lives */
  readonly location: string;
}
