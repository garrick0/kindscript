/**
 * The role a detected layer plays in the architecture.
 */
export enum LayerRole {
  Domain = 'domain',
  Application = 'application',
  Infrastructure = 'infrastructure',
  Presentation = 'presentation',
  Ports = 'ports',
  Adapters = 'adapters',
  Unknown = 'unknown',
}
