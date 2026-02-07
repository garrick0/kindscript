import { ArchitecturePattern } from '../types/architecture-pattern';
import { DetectedLayer } from '../value-objects/detected-layer';
import { LayerDependencyEdge } from '../value-objects/layer-dependency-edge';

/**
 * Entity representing a detected architectural pattern in a project.
 *
 * Contains the detected pattern type, the layers found, and the
 * dependency edges between them.
 */
export class DetectedArchitecture {
  constructor(
    /** The detected architectural pattern */
    public readonly pattern: ArchitecturePattern,

    /** The layers found in the project */
    public readonly layers: DetectedLayer[],

    /** The dependency edges between layers */
    public readonly dependencies: LayerDependencyEdge[]
  ) {}

  /**
   * Get all dependency edges originating from the given layer.
   */
  getDependenciesOf(layerName: string): LayerDependencyEdge[] {
    return this.dependencies.filter(edge => edge.from === layerName);
  }

  /**
   * Get all dependency edges pointing to the given layer.
   */
  getDependentsOf(layerName: string): LayerDependencyEdge[] {
    return this.dependencies.filter(edge => edge.to === layerName);
  }
}
