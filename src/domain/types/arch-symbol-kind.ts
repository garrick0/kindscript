/**
 * The kind of architectural symbol.
 *
 * This enum defines the different types of architectural entities
 * that can be modeled in KindScript.
 */
export enum ArchSymbolKind {
  /** A member within a Kind instance (e.g., domain, infrastructure, ports) */
  Member = 'member',

  /** A kind definition (the meta-level) */
  Kind = 'kind',

  /** An instance of a kind */
  Instance = 'instance',
}
