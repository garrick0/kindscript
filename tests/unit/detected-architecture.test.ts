import { DetectedArchitecture } from '../../src/domain/entities/detected-architecture';
import { ArchitecturePattern } from '../../src/domain/types/architecture-pattern';
import { DetectedLayer } from '../../src/domain/value-objects/detected-layer';
import { LayerDependencyEdge } from '../../src/domain/value-objects/layer-dependency-edge';
import { LayerRole } from '../../src/domain/types/layer-role';

describe('DetectedArchitecture', () => {
  const domainLayer = new DetectedLayer('domain', 'src/domain', LayerRole.Domain);
  const appLayer = new DetectedLayer('application', 'src/application', LayerRole.Application);
  const infraLayer = new DetectedLayer('infrastructure', 'src/infrastructure', LayerRole.Infrastructure);

  const edges = [
    new LayerDependencyEdge('application', 'domain', 3),
    new LayerDependencyEdge('infrastructure', 'domain', 2),
    new LayerDependencyEdge('infrastructure', 'application', 1),
  ];

  describe('construction', () => {
    it('creates a valid object with pattern, layers, and dependencies', () => {
      const arch = new DetectedArchitecture(
        ArchitecturePattern.CleanArchitecture,
        [domainLayer, appLayer, infraLayer],
        edges
      );

      expect(arch.pattern).toBe(ArchitecturePattern.CleanArchitecture);
      expect(arch.layers).toHaveLength(3);
      expect(arch.dependencies).toHaveLength(3);
    });
  });

  describe('getDependenciesOf', () => {
    it('returns edges originating from the given layer', () => {
      const arch = new DetectedArchitecture(
        ArchitecturePattern.CleanArchitecture,
        [domainLayer, appLayer, infraLayer],
        edges
      );

      const infraDeps = arch.getDependenciesOf('infrastructure');
      expect(infraDeps).toHaveLength(2);
      expect(infraDeps[0].to).toBe('domain');
      expect(infraDeps[1].to).toBe('application');
    });

    it('returns empty array for layer with no outward dependencies', () => {
      const arch = new DetectedArchitecture(
        ArchitecturePattern.CleanArchitecture,
        [domainLayer, appLayer, infraLayer],
        edges
      );

      const domainDeps = arch.getDependenciesOf('domain');
      expect(domainDeps).toHaveLength(0);
    });

    it('returns empty array for non-existent layer', () => {
      const arch = new DetectedArchitecture(
        ArchitecturePattern.CleanArchitecture,
        [domainLayer],
        []
      );

      expect(arch.getDependenciesOf('nonexistent')).toHaveLength(0);
    });
  });

  describe('getDependentsOf', () => {
    it('returns edges pointing to the given layer', () => {
      const arch = new DetectedArchitecture(
        ArchitecturePattern.CleanArchitecture,
        [domainLayer, appLayer, infraLayer],
        edges
      );

      const domainDependents = arch.getDependentsOf('domain');
      expect(domainDependents).toHaveLength(2);
      expect(domainDependents[0].from).toBe('application');
      expect(domainDependents[1].from).toBe('infrastructure');
    });

    it('returns empty array for layer with no dependents', () => {
      const arch = new DetectedArchitecture(
        ArchitecturePattern.CleanArchitecture,
        [domainLayer, appLayer, infraLayer],
        [new LayerDependencyEdge('application', 'domain', 1)]
      );

      expect(arch.getDependentsOf('infrastructure')).toHaveLength(0);
    });
  });
});
