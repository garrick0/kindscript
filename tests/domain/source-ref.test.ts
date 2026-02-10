import { SourceRef } from '../../src/domain/value-objects/source-ref';

describe('SourceRef', () => {
  describe('at()', () => {
    it('creates a file-scoped reference', () => {
      const ref = SourceRef.at('src/domain/entity.ts', 42, 10);

      expect(ref.file).toBe('src/domain/entity.ts');
      expect(ref.line).toBe(42);
      expect(ref.column).toBe(10);
      expect(ref.scope).toBeUndefined();
      expect(ref.isFileScoped).toBe(true);
    });
  });

  describe('structural()', () => {
    it('creates a structural reference with scope', () => {
      const ref = SourceRef.structural('domain');

      expect(ref.file).toBe('');
      expect(ref.line).toBe(0);
      expect(ref.column).toBe(0);
      expect(ref.scope).toBe('domain');
      expect(ref.isFileScoped).toBe(false);
    });

    it('creates a structural reference without scope', () => {
      const ref = SourceRef.structural();

      expect(ref.file).toBe('');
      expect(ref.scope).toBeUndefined();
      expect(ref.isFileScoped).toBe(false);
    });
  });

  describe('toString()', () => {
    it('formats file-scoped reference', () => {
      const ref = SourceRef.at('src/entity.ts', 5, 3);
      expect(ref.toString()).toBe('src/entity.ts:5:3');
    });

    it('formats structural reference with scope', () => {
      const ref = SourceRef.structural('domain');
      expect(ref.toString()).toBe('[domain]');
    });

    it('formats structural reference without scope', () => {
      const ref = SourceRef.structural();
      expect(ref.toString()).toBe(':0:0');
    });
  });
});
