import { CarrierExpr, carrierKey, hasAnnotationAtom } from '../../src/domain/types/carrier';

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

    it('includes exportName in hash syntax when present', () => {
      const carrier: CarrierExpr = { type: 'path', path: 'src/handlers.ts', exportName: 'validate' };
      expect(carrierKey(carrier)).toBe('src/handlers.ts#validate');
    });

    it('omits hash when exportName is undefined', () => {
      const carrier: CarrierExpr = { type: 'path', path: 'src/handlers.ts' };
      expect(carrierKey(carrier)).toBe('src/handlers.ts');
    });
  });

  describe('annotation carriers', () => {
    it('returns annotation:<kindTypeName>', () => {
      const carrier: CarrierExpr = { type: 'annotation', kindTypeName: 'Decider' };
      expect(carrierKey(carrier)).toBe('annotation:Decider');
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
          { type: 'annotation', kindTypeName: 'Decider' },
          { type: 'path', path: 'src/ordering' },
        ],
      };
      expect(carrierKey(carrier)).toBe('intersect(annotation:Decider,src/ordering)');
    });

    it('sorts children for stable keys', () => {
      const carrier1: CarrierExpr = {
        type: 'intersect',
        children: [
          { type: 'path', path: 'src/ordering' },
          { type: 'annotation', kindTypeName: 'Decider' },
        ],
      };
      const carrier2: CarrierExpr = {
        type: 'intersect',
        children: [
          { type: 'annotation', kindTypeName: 'Decider' },
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
          { type: 'annotation', kindTypeName: 'Pure' },
          {
            type: 'exclude',
            base: { type: 'path', path: 'src' },
            excluded: { type: 'path', path: 'src/impure' },
          },
        ],
      };
      expect(carrierKey(carrier)).toBe('intersect(annotation:Pure,exclude(src,src/impure))');
    });
  });
});

describe('hasAnnotationAtom', () => {
  it('returns false for path carriers', () => {
    const carrier: CarrierExpr = { type: 'path', path: 'src/domain' };
    expect(hasAnnotationAtom(carrier)).toBe(false);
  });

  it('returns true for annotation carriers', () => {
    const carrier: CarrierExpr = { type: 'annotation', kindTypeName: 'Decider' };
    expect(hasAnnotationAtom(carrier)).toBe(true);
  });

  it('returns true for intersect containing annotation', () => {
    const carrier: CarrierExpr = {
      type: 'intersect',
      children: [
        { type: 'annotation', kindTypeName: 'Decider' },
        { type: 'path', path: 'src/ordering' },
      ],
    };
    expect(hasAnnotationAtom(carrier)).toBe(true);
  });

  it('returns false for union of paths', () => {
    const carrier: CarrierExpr = {
      type: 'union',
      children: [
        { type: 'path', path: 'src/domain' },
        { type: 'path', path: 'src/shared' },
      ],
    };
    expect(hasAnnotationAtom(carrier)).toBe(false);
  });

  it('returns true for union containing annotation', () => {
    const carrier: CarrierExpr = {
      type: 'union',
      children: [
        { type: 'path', path: 'src/domain' },
        { type: 'annotation', kindTypeName: 'Effector' },
      ],
    };
    expect(hasAnnotationAtom(carrier)).toBe(true);
  });

  it('returns true for exclude with annotation in base', () => {
    const carrier: CarrierExpr = {
      type: 'exclude',
      base: { type: 'annotation', kindTypeName: 'Pure' },
      excluded: { type: 'path', path: 'src/tests' },
    };
    expect(hasAnnotationAtom(carrier)).toBe(true);
  });

  it('returns false for exclude with only paths', () => {
    const carrier: CarrierExpr = {
      type: 'exclude',
      base: { type: 'path', path: 'src' },
      excluded: { type: 'path', path: 'src/tests' },
    };
    expect(hasAnnotationAtom(carrier)).toBe(false);
  });

  it('returns true for deeply nested annotation', () => {
    const carrier: CarrierExpr = {
      type: 'union',
      children: [
        { type: 'path', path: 'src/a' },
        {
          type: 'intersect',
          children: [
            { type: 'annotation', kindTypeName: 'Decider' },
            { type: 'path', path: 'src/b' },
          ],
        },
      ],
    };
    expect(hasAnnotationAtom(carrier)).toBe(true);
  });
});
