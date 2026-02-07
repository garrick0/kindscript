import { LayerDependencyEdge } from '../../../src/domain/value-objects/layer-dependency-edge';

describe('LayerDependencyEdge', () => {
  describe('equals', () => {
    it('returns true for identical edges', () => {
      const a = new LayerDependencyEdge('application', 'domain', 3);
      const b = new LayerDependencyEdge('application', 'domain', 3);

      expect(a.equals(b)).toBe(true);
    });

    it('returns false when from differs', () => {
      const a = new LayerDependencyEdge('application', 'domain', 3);
      const b = new LayerDependencyEdge('infrastructure', 'domain', 3);

      expect(a.equals(b)).toBe(false);
    });

    it('returns false when to differs', () => {
      const a = new LayerDependencyEdge('application', 'domain', 3);
      const b = new LayerDependencyEdge('application', 'infrastructure', 3);

      expect(a.equals(b)).toBe(false);
    });

    it('returns false when weight differs', () => {
      const a = new LayerDependencyEdge('application', 'domain', 3);
      const b = new LayerDependencyEdge('application', 'domain', 5);

      expect(a.equals(b)).toBe(false);
    });
  });

  describe('toString', () => {
    it('formats edge as from -> to (weight)', () => {
      const edge = new LayerDependencyEdge('application', 'domain', 3);

      expect(edge.toString()).toBe('application -> domain (3)');
    });
  });
});
