import { ImportEdge } from '../../../src/domain/value-objects/import-edge';
import { DependencyRule } from '../../../src/domain/value-objects/dependency-rule';
import { ArchSymbol } from '../../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../../src/domain/types/arch-symbol-kind';

describe('Architecture Validation: Value Objects', () => {
  describe('ImportEdge', () => {
    it('models import relationships', () => {
      const edge = new ImportEdge(
        'src/application/service.ts',
        'src/domain/entity.ts',
        10,
        5,
        '../domain/entity'
      );

      expect(edge.sourceFile).toBe('src/application/service.ts');
      expect(edge.targetFile).toBe('src/domain/entity.ts');
      expect(edge.line).toBe(10);
      expect(edge.column).toBe(5);
      expect(edge.importPath).toBe('../domain/entity');
    });

    it('implements value object equality', () => {
      const edge1 = new ImportEdge('a.ts', 'b.ts', 1, 0, './b');
      const edge2 = new ImportEdge('a.ts', 'b.ts', 1, 0, './b');
      const edge3 = new ImportEdge('a.ts', 'c.ts', 1, 0, './c');

      expect(edge1.equals(edge2)).toBe(true);
      expect(edge1.equals(edge3)).toBe(false);
    });

    it('provides human-readable representation', () => {
      const edge = new ImportEdge('a.ts', 'b.ts', 42, 0, './b');

      expect(edge.toString()).toBe('a.ts:42 → b.ts');
    });
  });

  describe('DependencyRule', () => {
    it('models allowed dependencies', () => {
      const from = new ArchSymbol('infrastructure', ArchSymbolKind.Layer, 'src/infrastructure');
      const to = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');

      const rule = new DependencyRule(from, to, true);

      expect(rule.allowed).toBe(true);
      expect(rule.from).toBe(from);
      expect(rule.to).toBe(to);
    });

    it('models forbidden dependencies', () => {
      const from = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');
      const to = new ArchSymbol('infrastructure', ArchSymbolKind.Layer, 'src/infrastructure');

      const rule = new DependencyRule(from, to, false);

      expect(rule.allowed).toBe(false);
    });

    it('checks if specific import violates rule', () => {
      const domain = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');
      const infra = new ArchSymbol('infrastructure', ArchSymbolKind.Layer, 'src/infrastructure');

      const rule = new DependencyRule(domain, infra, false); // domain CANNOT depend on infra

      // Violating import
      const violates = rule.check('src/domain/service.ts', 'src/infrastructure/database.ts');
      expect(violates).toBe(false); // Not allowed

      // Allowed import (reverse direction)
      const allowed = rule.check('src/infrastructure/repository.ts', 'src/domain/entity.ts');
      expect(allowed).toBe(true); // Rule doesn't apply to this direction
    });

    it('provides human-readable representation', () => {
      const from = new ArchSymbol('domain', ArchSymbolKind.Layer);
      const to = new ArchSymbol('infrastructure', ArchSymbolKind.Layer);

      const allowed = new DependencyRule(from, to, true);
      const forbidden = new DependencyRule(from, to, false);

      expect(allowed.toString()).toBe('domain → infrastructure');
      expect(forbidden.toString()).toBe('domain ↛ infrastructure');
    });
  });

  describe('Integration: modeling dependency graph', () => {
    it('models complete dependency scenario', () => {
      // Arrange: Create symbols
      const domain = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');
      const application = new ArchSymbol('application', ArchSymbolKind.Layer, 'src/application');
      const infrastructure = new ArchSymbol('infrastructure', ArchSymbolKind.Layer, 'src/infrastructure');

      // Arrange: Create dependency rules
      const rules = [
        new DependencyRule(domain, application, false), // domain cannot depend on application
        new DependencyRule(domain, infrastructure, false), // domain cannot depend on infrastructure
        new DependencyRule(application, domain, true), // application CAN depend on domain
        new DependencyRule(application, infrastructure, false), // application cannot depend on infrastructure
        new DependencyRule(infrastructure, domain, true), // infrastructure CAN depend on domain
        new DependencyRule(infrastructure, application, true), // infrastructure CAN depend on application
      ];

      // Arrange: Create import edges
      const imports = [
        new ImportEdge('src/application/service.ts', 'src/domain/entity.ts', 1, 0, '../domain/entity'),
        new ImportEdge('src/infrastructure/repository.ts', 'src/domain/entity.ts', 1, 0, '../../domain/entity'),
        new ImportEdge('src/infrastructure/controller.ts', 'src/application/service.ts', 1, 0, '../application/service'),
      ];

      // Act & Assert: Check each import against each rule
      for (const importEdge of imports) {
        for (const rule of rules) {
          const result = rule.check(importEdge.sourceFile, importEdge.targetFile);

          if (importEdge.sourceFile.includes('application') && importEdge.targetFile.includes('domain')) {
            // application → domain is allowed
            if (rule.from.name === 'application' && rule.to.name === 'domain') {
              expect(result).toBe(true);
            }
          }

          if (importEdge.sourceFile.includes('infrastructure') && importEdge.targetFile.includes('domain')) {
            // infrastructure → domain is allowed
            if (rule.from.name === 'infrastructure' && rule.to.name === 'domain') {
              expect(result).toBe(true);
            }
          }

          if (importEdge.sourceFile.includes('infrastructure') && importEdge.targetFile.includes('application')) {
            // infrastructure → application is allowed
            if (rule.from.name === 'infrastructure' && rule.to.name === 'application') {
              expect(result).toBe(true);
            }
          }
        }
      }

      // This demonstrates that our value objects can model a complete
      // dependency graph with rules and actual imports
    });
  });
});
