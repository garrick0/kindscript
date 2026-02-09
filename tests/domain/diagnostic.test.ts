import { Diagnostic } from '../../src/domain/entities/diagnostic';
import { ContractType } from '../../src/domain/types/contract-type';

describe('Diagnostic', () => {
  describe('construction', () => {
    it('creates a diagnostic with all properties', () => {
      const diagnostic = new Diagnostic(
        'Test error message',
        70001,
        'src/domain/entity.ts',
        42,
        10
      );

      expect(diagnostic.message).toBe('Test error message');
      expect(diagnostic.code).toBe(70001);
      expect(diagnostic.file).toBe('src/domain/entity.ts');
      expect(diagnostic.line).toBe(42);
      expect(diagnostic.column).toBe(10);
      expect(diagnostic.relatedContract).toBeUndefined();
    });

    it('creates a diagnostic with related contract', () => {
      const diagnostic = new Diagnostic(
        'Test error',
        70001,
        'file.ts',
        1,
        0,
        {
          contractName: 'no-deps',
          contractType: ContractType.NoDependency,
          location: 'architecture.ts:10',
        }
      );

      expect(diagnostic.relatedContract).toEqual({
        contractName: 'no-deps',
        contractType: ContractType.NoDependency,
        location: 'architecture.ts:10',
      });
    });
  });

  describe('toString', () => {
    it('formats diagnostic as string', () => {
      const diagnostic = new Diagnostic(
        'Test error message',
        70001,
        'src/domain/entity.ts',
        42,
        10
      );

      const formatted = diagnostic.toString();

      expect(formatted).toBe('src/domain/entity.ts:42:10 - error KS70001: Test error message');
    });
  });
});
