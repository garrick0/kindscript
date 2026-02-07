/**
 * The kind of architectural symbol.
 *
 * This enum defines the different types of architectural entities
 * that can be modeled in KindScript.
 */
export enum ArchSymbolKind {
  /** A layer in a layered architecture (e.g., domain, application, infrastructure) */
  Layer = 'layer',

  /** A module or package within a layer */
  Module = 'module',

  /** A bounded context in DDD */
  Context = 'context',

  /** A port interface (hexagonal architecture) */
  Port = 'port',

  /** An adapter implementation (hexagonal architecture) */
  Adapter = 'adapter',

  /** A kind definition (the meta-level) */
  Kind = 'kind',

  /** An instance of a kind */
  Instance = 'instance',
}
