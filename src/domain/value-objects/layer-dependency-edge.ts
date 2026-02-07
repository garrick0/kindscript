/**
 * Represents a dependency from one layer to another.
 *
 * This is a value object — immutable and defined by its properties.
 * The weight represents how many file-level imports exist between the layers.
 */
export class LayerDependencyEdge {
  constructor(
    /** The name of the layer that imports */
    public readonly from: string,

    /** The name of the layer being imported */
    public readonly to: string,

    /** Number of file-level imports between these layers */
    public readonly weight: number
  ) {}

  equals(other: LayerDependencyEdge): boolean {
    return (
      this.from === other.from &&
      this.to === other.to &&
      this.weight === other.weight
    );
  }

  toString(): string {
    return `${this.from} -> ${this.to} (${this.weight})`;
  }
}
