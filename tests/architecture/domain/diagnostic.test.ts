import { Diagnostic } from '../../../src/domain/entities/diagnostic';
import { ImportEdge } from '../../../src/domain/value-objects/import-edge';
import { Contract } from '../../../src/domain/entities/contract';
import { ContractType } from '../../../src/domain/types/contract-type';
import { ArchSymbol } from '../../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../../src/domain/types/arch-symbol-kind';

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

  describe('factory methods', () => {
    describe('forbiddenDependency', () => {
      it('creates diagnostic for forbidden dependency', () => {
        const edge = new ImportEdge(
          'src/domain/service.ts',
          'src/infrastructure/database.ts',
          5,
          12,
          '../infrastructure/database'
        );

        const contract = new Contract(
          ContractType.NoDependency,
          'no-infra-deps',
          [
            new ArchSymbol('domain', ArchSymbolKind.Layer),
            new ArchSymbol('infrastructure', ArchSymbolKind.Layer),
          ],
          'architecture.ts:10'
        );

        const diagnostic = Diagnostic.forbiddenDependency(edge, contract);

        expect(diagnostic.code).toBe(70001);
        expect(diagnostic.message).toContain('Forbidden dependency');
        expect(diagnostic.message).toContain('src/domain/service.ts');
        expect(diagnostic.message).toContain('src/infrastructure/database.ts');
        expect(diagnostic.file).toBe('src/domain/service.ts');
        expect(diagnostic.line).toBe(5);
        expect(diagnostic.column).toBe(12);
        expect(diagnostic.relatedContract?.contractName).toBe('no-infra-deps');
      });
    });

    describe('missingImplementation', () => {
      it('creates diagnostic for missing implementation', () => {
        const contract = new Contract(
          ContractType.MustImplement,
          'ports-have-adapters',
          [
            new ArchSymbol('ports', ArchSymbolKind.Module),
            new ArchSymbol('adapters', ArchSymbolKind.Module),
          ],
          'architecture.ts:20'
        );

        const diagnostic = Diagnostic.missingImplementation(
          'DatabasePort',
          'src/infrastructure/adapters',
          contract
        );

        expect(diagnostic.code).toBe(70002);
        expect(diagnostic.message).toContain('DatabasePort');
        expect(diagnostic.message).toContain('no corresponding adapter');
        expect(diagnostic.message).toContain('src/infrastructure/adapters');
        expect(diagnostic.relatedContract?.contractName).toBe('ports-have-adapters');
      });
    });

    describe('impureImport', () => {
      it('creates diagnostic for impure import', () => {
        const contract = new Contract(
          ContractType.Purity,
          'pure-domain',
          [new ArchSymbol('domain', ArchSymbolKind.Layer)],
          'architecture.ts:30'
        );

        const diagnostic = Diagnostic.impureImport(
          'src/domain/service.ts',
          'fs',
          10,
          5,
          contract
        );

        expect(diagnostic.code).toBe(70003);
        expect(diagnostic.message).toContain('Impure import');
        expect(diagnostic.message).toContain('fs');
        expect(diagnostic.file).toBe('src/domain/service.ts');
        expect(diagnostic.line).toBe(10);
        expect(diagnostic.column).toBe(5);
      });
    });

    describe('circularDependency', () => {
      it('creates diagnostic for circular dependency', () => {
        const contract = new Contract(
          ContractType.NoCycles,
          'no-cycles',
          [new ArchSymbol('module', ArchSymbolKind.Module)],
          'architecture.ts:40'
        );

        const cycle = ['moduleA.ts', 'moduleB.ts', 'moduleC.ts'];
        const diagnostic = Diagnostic.circularDependency(cycle, contract);

        expect(diagnostic.code).toBe(70004);
        expect(diagnostic.message).toContain('Circular dependency');
        expect(diagnostic.message).toContain('moduleA.ts → moduleB.ts → moduleC.ts → moduleA.ts');
        expect(diagnostic.file).toBe('moduleA.ts');
      });
    });

    describe('notColocated', () => {
      it('creates diagnostic for colocation violation', () => {
        const contract = new Contract(
          ContractType.Colocated,
          'tests-with-features',
          [
            new ArchSymbol('feature', ArchSymbolKind.Module),
            new ArchSymbol('test', ArchSymbolKind.Module),
          ]
        );

        const diagnostic = Diagnostic.notColocated(
          'src/features/user.ts',
          'tests/unit/user.test.ts',
          contract
        );

        expect(diagnostic.code).toBe(70005);
        expect(diagnostic.message).toContain('must be co-located');
        expect(diagnostic.message).toContain('src/features/user.ts');
        expect(diagnostic.message).toContain('tests/unit/user.test.ts');
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
