import { CarrierExpr, carrierKey, hasTaggedAtom } from '../../src/domain/types/carrier';

describe('carrierKey', () => {
  describe('path carriers', () => {
    it('returns the raw path string', () => {
      const carrier: CarrierExpr = { type: 'path', path: 'src/domain' };
      expect(carrierKey(carrier)).toBe('src/domain');
    });

    it('returns absolute paths unchanged', () => {
      const carrier: CarrierExpr = { type: 'path', path: '/project/src/domain' };
      expect(carrierKey(carrier)).toBe('/project/src/domain');
    });

    it('returns file paths unchanged', () => {
      const carrier: CarrierExpr = { type: 'path', path: 'src/domain/entity.ts' };
      expect(carrierKey(carrier)).toBe('src/domain/entity.ts');
    });
  });

  describe('tagged carriers', () => {
    it('returns tagged:<kindTypeName>', () => {
      const carrier: CarrierExpr = { type: 'tagged', kindTypeName: 'Decider' };
      expect(carrierKey(carrier)).toBe('tagged:Decider');
    });
  });

  describe('union carriers', () => {
    it('combines children with union() wrapper', () => {
      const carrier: CarrierExpr = {
        type: 'union',
        children: [
          { type: 'path', path: 'src/domain' },
          { type: 'path', path: 'src/shared' },
        ],
      };
      expect(carrierKey(carrier)).toBe('union(src/domain,src/shared)');
    });

    it('sorts children for stable keys', () => {
      const carrier1: CarrierExpr = {
        type: 'union',
        children: [
          { type: 'path', path: 'src/shared' },
          { type: 'path', path: 'src/domain' },
        ],
      };
      const carrier2: CarrierExpr = {
        type: 'union',
        children: [
          { type: 'path', path: 'src/domain' },
          { type: 'path', path: 'src/shared' },
        ],
      };
      expect(carrierKey(carrier1)).toBe(carrierKey(carrier2));
    });
  });

  describe('exclude carriers', () => {
    it('returns exclude(base,excluded) format', () => {
      const carrier: CarrierExpr = {
        type: 'exclude',
        base: { type: 'path', path: 'src' },
        excluded: { type: 'path', path: 'src/tests' },
      };
      expect(carrierKey(carrier)).toBe('exclude(src,src/tests)');
    });
  });

  describe('intersect carriers', () => {
    it('combines children with intersect() wrapper', () => {
      const carrier: CarrierExpr = {
        type: 'intersect',
        children: [
          { type: 'tagged', kindTypeName: 'Decider' },
          { type: 'path', path: 'src/ordering' },
        ],
      };
      expect(carrierKey(carrier)).toBe('intersect(src/ordering,tagged:Decider)');
    });

    it('sorts children for stable keys', () => {
      const carrier1: CarrierExpr = {
        type: 'intersect',
        children: [
          { type: 'path', path: 'src/ordering' },
          { type: 'tagged', kindTypeName: 'Decider' },
        ],
      };
      const carrier2: CarrierExpr = {
        type: 'intersect',
        children: [
          { type: 'tagged', kindTypeName: 'Decider' },
          { type: 'path', path: 'src/ordering' },
        ],
      };
      expect(carrierKey(carrier1)).toBe(carrierKey(carrier2));
    });
  });

  describe('nested carriers', () => {
    it('handles nested unions', () => {
      const carrier: CarrierExpr = {
        type: 'union',
        children: [
          { type: 'path', path: 'src/a' },
          {
            type: 'union',
            children: [
              { type: 'path', path: 'src/b' },
              { type: 'path', path: 'src/c' },
            ],
          },
        ],
      };
      expect(carrierKey(carrier)).toBe('union(src/a,union(src/b,src/c))');
    });

    it('handles exclude within intersect', () => {
      const carrier: CarrierExpr = {
        type: 'intersect',
        children: [
          { type: 'tagged', kindTypeName: 'Pure' },
          {
            type: 'exclude',
            base: { type: 'path', path: 'src' },
            excluded: { type: 'path', path: 'src/impure' },
          },
        ],
      };
      expect(carrierKey(carrier)).toBe('intersect(exclude(src,src/impure),tagged:Pure)');
    });
  });
});

describe('hasTaggedAtom', () => {
  it('returns false for path carriers', () => {
    const carrier: CarrierExpr = { type: 'path', path: 'src/domain' };
    expect(hasTaggedAtom(carrier)).toBe(false);
  });

  it('returns true for tagged carriers', () => {
    const carrier: CarrierExpr = { type: 'tagged', kindTypeName: 'Decider' };
    expect(hasTaggedAtom(carrier)).toBe(true);
  });

  it('returns true for intersect containing tagged', () => {
    const carrier: CarrierExpr = {
      type: 'intersect',
      children: [
        { type: 'tagged', kindTypeName: 'Decider' },
        { type: 'path', path: 'src/ordering' },
      ],
    };
    expect(hasTaggedAtom(carrier)).toBe(true);
  });

  it('returns false for union of paths', () => {
    const carrier: CarrierExpr = {
      type: 'union',
      children: [
        { type: 'path', path: 'src/domain' },
        { type: 'path', path: 'src/shared' },
      ],
    };
    expect(hasTaggedAtom(carrier)).toBe(false);
  });

  it('returns true for union containing tagged', () => {
    const carrier: CarrierExpr = {
      type: 'union',
      children: [
        { type: 'path', path: 'src/domain' },
        { type: 'tagged', kindTypeName: 'Effector' },
      ],
    };
    expect(hasTaggedAtom(carrier)).toBe(true);
  });

  it('returns true for exclude with tagged in base', () => {
    const carrier: CarrierExpr = {
      type: 'exclude',
      base: { type: 'tagged', kindTypeName: 'Pure' },
      excluded: { type: 'path', path: 'src/tests' },
    };
    expect(hasTaggedAtom(carrier)).toBe(true);
  });

  it('returns false for exclude with only paths', () => {
    const carrier: CarrierExpr = {
      type: 'exclude',
      base: { type: 'path', path: 'src' },
      excluded: { type: 'path', path: 'src/tests' },
    };
    expect(hasTaggedAtom(carrier)).toBe(false);
  });

  it('returns true for deeply nested tagged', () => {
    const carrier: CarrierExpr = {
      type: 'union',
      children: [
        { type: 'path', path: 'src/a' },
        {
          type: 'intersect',
          children: [
            { type: 'tagged', kindTypeName: 'Decider' },
            { type: 'path', path: 'src/b' },
          ],
        },
      ],
    };
    expect(hasTaggedAtom(carrier)).toBe(true);
  });
});
