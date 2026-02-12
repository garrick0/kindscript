import { CarrierResolver, ScanContext } from '../../src/application/pipeline/carrier/carrier-resolver';
import { CarrierExpr } from '../../src/domain/types/carrier';
import { MockFileSystemAdapter } from '../helpers/mocks/mock-filesystem.adapter';

describe('CarrierResolver', () => {
  let mockFS: MockFileSystemAdapter;
  let resolver: CarrierResolver;

  beforeEach(() => {
    mockFS = new MockFileSystemAdapter();
    resolver = new CarrierResolver(mockFS);
  });

  describe('path carriers', () => {
    it('resolves directory to recursive file list', () => {
      mockFS.withDirectory('/project/src', ['a.ts', 'b.ts', 'sub/c.ts']);

      const carrier: CarrierExpr = { type: 'path', path: '/project/src' };
      const result = resolver.resolve(carrier);

      expect(result.sort()).toEqual([
        '/project/src/a.ts',
        '/project/src/b.ts',
        '/project/src/sub/c.ts',
      ]);
    });

    it('resolves file to single-element array', () => {
      mockFS.withFile('/project/src/entity.ts', 'export class Entity {}');

      const carrier: CarrierExpr = { type: 'path', path: '/project/src/entity.ts' };
      const result = resolver.resolve(carrier);

      expect(result).toEqual(['/project/src/entity.ts']);
    });

    it('returns empty for nonexistent path', () => {
      const carrier: CarrierExpr = { type: 'path', path: '/nonexistent' };
      const result = resolver.resolve(carrier);

      expect(result).toEqual([]);
    });
  });

  describe('annotation carriers', () => {
    it('filters by kindTypeName', () => {
      const scanContext: ScanContext = {
        annotatedExports: [
          { sourceFileName: '/project/src/a.ts', view: { kindTypeName: 'Decider' } },
          { sourceFileName: '/project/src/b.ts', view: { kindTypeName: 'Decider' } },
          { sourceFileName: '/project/src/c.ts', view: { kindTypeName: 'Effector' } },
        ],
      };

      const carrier: CarrierExpr = { type: 'annotation', kindTypeName: 'Decider' };
      const result = resolver.resolve(carrier, scanContext);

      expect(result.sort()).toEqual([
        '/project/src/a.ts',
        '/project/src/b.ts',
      ]);
    });

    it('throws when scan context is missing', () => {
      const carrier: CarrierExpr = { type: 'annotation', kindTypeName: 'Decider' };

      expect(() => resolver.resolve(carrier)).toThrow('Annotation carriers require scan context');
    });

    it('returns empty when no matching exports', () => {
      const scanContext: ScanContext = { annotatedExports: [] };

      const carrier: CarrierExpr = { type: 'annotation', kindTypeName: 'Decider' };
      const result = resolver.resolve(carrier, scanContext);

      expect(result).toEqual([]);
    });
  });

  describe('union carriers', () => {
    it('combines files from all children', () => {
      mockFS.withDirectory('/project/src/a', ['a1.ts', 'a2.ts']);
      mockFS.withDirectory('/project/src/b', ['b1.ts']);

      const carrier: CarrierExpr = {
        type: 'union',
        children: [
          { type: 'path', path: '/project/src/a' },
          { type: 'path', path: '/project/src/b' },
        ],
      };

      const result = resolver.resolve(carrier);

      expect(result.sort()).toEqual([
        '/project/src/a/a1.ts',
        '/project/src/a/a2.ts',
        '/project/src/b/b1.ts',
      ]);
    });

    it('deduplicates files appearing in multiple children', () => {
      mockFS.withFile('/project/src/shared.ts', '');
      mockFS.withDirectory('/project/src', ['shared.ts', 'other.ts']);

      const carrier: CarrierExpr = {
        type: 'union',
        children: [
          { type: 'path', path: '/project/src/shared.ts' },
          { type: 'path', path: '/project/src' },
        ],
      };

      const result = resolver.resolve(carrier);

      expect(result.sort()).toEqual([
        '/project/src/other.ts',
        '/project/src/shared.ts',
      ]);
    });
  });

  describe('exclude carriers', () => {
    it('removes excluded files from base', () => {
      mockFS.withDirectory('/project/src', ['a.ts', 'b.ts']);
      mockFS.withDirectory('/project/src/tests', ['test.ts']);

      const carrier: CarrierExpr = {
        type: 'exclude',
        base: { type: 'path', path: '/project/src' },
        excluded: { type: 'path', path: '/project/src/tests' },
      };

      const result = resolver.resolve(carrier);

      expect(result.sort()).toEqual([
        '/project/src/a.ts',
        '/project/src/b.ts',
      ]);
    });

    it('returns base when excluded has no files', () => {
      mockFS.withDirectory('/project/src', ['a.ts', 'b.ts']);

      const carrier: CarrierExpr = {
        type: 'exclude',
        base: { type: 'path', path: '/project/src' },
        excluded: { type: 'path', path: '/nonexistent' },
      };

      const result = resolver.resolve(carrier);

      expect(result.sort()).toEqual([
        '/project/src/a.ts',
        '/project/src/b.ts',
      ]);
    });
  });

  describe('intersect carriers', () => {
    it('returns files common to all children (general case)', () => {
      mockFS.withDirectory('/project/src/a', ['x.ts', 'y.ts']);
      mockFS.withDirectory('/project/src/b', ['y.ts', 'z.ts']);
      mockFS.withDirectory('/project/src', ['x.ts', 'y.ts', 'z.ts', 'a/x.ts', 'a/y.ts', 'b/y.ts', 'b/z.ts']);

      const carrier: CarrierExpr = {
        type: 'intersect',
        children: [
          { type: 'path', path: '/project/src/a' },
          { type: 'path', path: '/project/src/b' },
        ],
      };

      const result = resolver.resolve(carrier);

      // No files appear in both directories with the current mock setup
      // (a contains x, y under /a, b contains y, z under /b — no overlap)
      expect(result).toEqual([]);
    });

    it('handles intersect(tagged, path) — scoped annotation carrier pattern', () => {
      const scanContext: ScanContext = {
        annotatedExports: [
          { sourceFileName: '/project/src/orders/validate.ts', view: { kindTypeName: 'Decider' } },
          { sourceFileName: '/project/src/billing/charge.ts', view: { kindTypeName: 'Decider' } },
        ],
      };

      const carrier: CarrierExpr = {
        type: 'intersect',
        children: [
          { type: 'annotation', kindTypeName: 'Decider' },
          { type: 'path', path: '/project/src/orders' },
        ],
      };

      const result = resolver.resolve(carrier, scanContext);

      expect(result).toEqual(['/project/src/orders/validate.ts']);
    });

    it('filters annotated exports by path boundary', () => {
      const scanContext: ScanContext = {
        annotatedExports: [
          { sourceFileName: '/project/src/domain/entity.ts', view: { kindTypeName: 'Pure' } },
          { sourceFileName: '/project/src/domain-extensions/helper.ts', view: { kindTypeName: 'Pure' } },
        ],
      };

      const carrier: CarrierExpr = {
        type: 'intersect',
        children: [
          { type: 'annotation', kindTypeName: 'Pure' },
          { type: 'path', path: '/project/src/domain' },
        ],
      };

      const result = resolver.resolve(carrier, scanContext);

      // Only files under /project/src/domain/, not /project/src/domain-extensions/
      expect(result).toEqual(['/project/src/domain/entity.ts']);
    });

    it('returns empty when no overlap', () => {
      const scanContext: ScanContext = {
        annotatedExports: [
          { sourceFileName: '/project/src/billing/charge.ts', view: { kindTypeName: 'Decider' } },
        ],
      };

      const carrier: CarrierExpr = {
        type: 'intersect',
        children: [
          { type: 'annotation', kindTypeName: 'Decider' },
          { type: 'path', path: '/project/src/orders' },
        ],
      };

      const result = resolver.resolve(carrier, scanContext);

      expect(result).toEqual([]);
    });
  });

  describe('nested carriers', () => {
    it('handles union of intersects', () => {
      const scanContext: ScanContext = {
        annotatedExports: [
          { sourceFileName: '/project/src/a/x.ts', view: { kindTypeName: 'Pure' } },
          { sourceFileName: '/project/src/b/y.ts', view: { kindTypeName: 'Pure' } },
        ],
      };

      const carrier: CarrierExpr = {
        type: 'union',
        children: [
          {
            type: 'intersect',
            children: [
              { type: 'annotation', kindTypeName: 'Pure' },
              { type: 'path', path: '/project/src/a' },
            ],
          },
          {
            type: 'intersect',
            children: [
              { type: 'annotation', kindTypeName: 'Pure' },
              { type: 'path', path: '/project/src/b' },
            ],
          },
        ],
      };

      const result = resolver.resolve(carrier, scanContext);

      expect(result.sort()).toEqual([
        '/project/src/a/x.ts',
        '/project/src/b/y.ts',
      ]);
    });

    it('handles exclude with annotation base', () => {
      mockFS.withFile('/project/src/tests/test.ts', '');
      const scanContext: ScanContext = {
        annotatedExports: [
          { sourceFileName: '/project/src/pure.ts', view: { kindTypeName: 'Pure' } },
          { sourceFileName: '/project/src/tests/test.ts', view: { kindTypeName: 'Pure' } },
        ],
      };

      const carrier: CarrierExpr = {
        type: 'exclude',
        base: { type: 'annotation', kindTypeName: 'Pure' },
        excluded: {
          type: 'intersect',
          children: [
            { type: 'annotation', kindTypeName: 'Pure' },
            { type: 'path', path: '/project/src/tests' },
          ],
        },
      };

      const result = resolver.resolve(carrier, scanContext);

      expect(result).toEqual(['/project/src/pure.ts']);
    });
  });
});
