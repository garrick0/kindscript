import { DetectedLayer } from '../../../src/domain/value-objects/detected-layer';
import { LayerRole } from '../../../src/domain/types/layer-role';

describe('DetectedLayer', () => {
  describe('equals', () => {
    it('returns true for identical layers', () => {
      const a = new DetectedLayer('domain', 'src/domain', LayerRole.Domain);
      const b = new DetectedLayer('domain', 'src/domain', LayerRole.Domain);

      expect(a.equals(b)).toBe(true);
    });

    it('returns false when name differs', () => {
      const a = new DetectedLayer('domain', 'src/domain', LayerRole.Domain);
      const b = new DetectedLayer('core', 'src/domain', LayerRole.Domain);

      expect(a.equals(b)).toBe(false);
    });

    it('returns false when path differs', () => {
      const a = new DetectedLayer('domain', 'src/domain', LayerRole.Domain);
      const b = new DetectedLayer('domain', 'lib/domain', LayerRole.Domain);

      expect(a.equals(b)).toBe(false);
    });

    it('returns false when role differs', () => {
      const a = new DetectedLayer('domain', 'src/domain', LayerRole.Domain);
      const b = new DetectedLayer('domain', 'src/domain', LayerRole.Application);

      expect(a.equals(b)).toBe(false);
    });
  });

  describe('toString', () => {
    it('formats layer as name (path) [role]', () => {
      const layer = new DetectedLayer('domain', 'src/domain', LayerRole.Domain);

      expect(layer.toString()).toBe('domain (src/domain) [domain]');
    });
  });
});
