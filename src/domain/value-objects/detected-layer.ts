import { LayerRole } from '../types/layer-role';

/**
 * A detected architectural layer in the project.
 *
 * This is a value object — immutable and defined by its properties.
 */
export class DetectedLayer {
  constructor(
    /** The directory name of this layer */
    public readonly name: string,

    /** The filesystem path of this layer */
    public readonly path: string,

    /** The architectural role assigned to this layer */
    public readonly role: LayerRole
  ) {}

  equals(other: DetectedLayer): boolean {
    return (
      this.name === other.name &&
      this.path === other.path &&
      this.role === other.role
    );
  }

  toString(): string {
    return `${this.name} (${this.path}) [${this.role}]`;
  }
}
