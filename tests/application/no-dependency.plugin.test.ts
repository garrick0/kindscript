import { noDependencyPlugin } from '../../src/application/pipeline/plugins/no-dependency/no-dependency.plugin';
import { CheckContext } from '../../src/application/pipeline/plugins/contract-plugin';
import { MockTypeScriptAdapter } from '../helpers/mocks/mock-typescript.adapter';
import { ArchSymbol } from '../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { Program } from '../../src/domain/entities/program';
import { makeSymbol, noDependency } from '../helpers/factories';

describe('noDependencyPlugin.check', () => {
  let mockTS: MockTypeScriptAdapter;

  function makeContext(resolvedFiles?: Map<string, string[]>): CheckContext {
    const program = new Program([], {});
    return {
      tsPort: mockTS,
      program,
      checker: mockTS.getTypeChecker(program),
      resolvedFiles: resolvedFiles ?? new Map(),
    };
  }

  beforeEach(() => {
    mockTS = new MockTypeScriptAdapter();
  });

  afterEach(() => {
    mockTS.reset();
  });

  it('detects forbidden dependency from domain to infrastructure', () => {
    const domain = makeSymbol('domain');
    const infra = makeSymbol('infrastructure');

    mockTS
      .withSourceFile('src/domain/service.ts', 'import { Db } from "../infrastructure/database";')
      .withSourceFile('src/infrastructure/database.ts', 'export class Db {}')
      .withImport('src/domain/service.ts', 'src/infrastructure/database.ts', '../infrastructure/database', 1);

    const resolvedFiles = new Map([
      ['src/domain', ['src/domain/service.ts']],
      ['src/infrastructure', ['src/infrastructure/database.ts']],
    ]);

    const result = noDependencyPlugin.check(noDependency(domain, infra), makeContext(resolvedFiles));

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe(70001);
    expect(result.diagnostics[0].message).toContain('src/domain/service.ts');
    expect(result.diagnostics[0].message).toContain('src/infrastructure/database.ts');
  });

  it('handles symbols with no declared location', () => {
    const noLoc = new ArchSymbol('noLoc', ArchSymbolKind.Member);
    const withLoc = makeSymbol('withLoc');

    const result = noDependencyPlugin.check(noDependency(noLoc, withLoc), makeContext());
    expect(result.diagnostics).toHaveLength(0);
  });

  it('allows permitted dependency direction', () => {
    const domain = makeSymbol('domain');
    const infra = makeSymbol('infrastructure');

    mockTS
      .withSourceFile('src/domain/entity.ts', 'export class Entity {}')
      .withSourceFile('src/infrastructure/repo.ts', 'import { Entity } from "../domain/entity";')
      .withImport('src/infrastructure/repo.ts', 'src/domain/entity.ts', '../domain/entity', 1);

    const resolvedFiles = new Map([
      ['src/domain', ['src/domain/entity.ts']],
      ['src/infrastructure', ['src/infrastructure/repo.ts']],
    ]);

    const result = noDependencyPlugin.check(noDependency(domain, infra), makeContext(resolvedFiles));
    expect(result.diagnostics).toHaveLength(0);
  });

  it('detects multiple violations in the same file', () => {
    const domain = makeSymbol('domain');
    const infra = makeSymbol('infrastructure');

    mockTS
      .withSourceFile('src/domain/service.ts', '')
      .withSourceFile('src/infrastructure/database.ts', '')
      .withSourceFile('src/infrastructure/cache.ts', '')
      .withImport('src/domain/service.ts', 'src/infrastructure/database.ts', '../infrastructure/database', 1)
      .withImport('src/domain/service.ts', 'src/infrastructure/cache.ts', '../infrastructure/cache', 2);

    const resolvedFiles = new Map([
      ['src/domain', ['src/domain/service.ts']],
      ['src/infrastructure', ['src/infrastructure/database.ts', 'src/infrastructure/cache.ts']],
    ]);

    const result = noDependencyPlugin.check(noDependency(domain, infra), makeContext(resolvedFiles));
    expect(result.diagnostics).toHaveLength(2);
  });

  it('detects violations across multiple source files', () => {
    const domain = makeSymbol('domain');
    const infra = makeSymbol('infrastructure');

    mockTS
      .withSourceFile('src/domain/a.ts', '')
      .withSourceFile('src/domain/b.ts', '')
      .withSourceFile('src/infrastructure/db.ts', '')
      .withImport('src/domain/a.ts', 'src/infrastructure/db.ts', '../infrastructure/db', 1)
      .withImport('src/domain/b.ts', 'src/infrastructure/db.ts', '../infrastructure/db', 1);

    const resolvedFiles = new Map([
      ['src/domain', ['src/domain/a.ts', 'src/domain/b.ts']],
      ['src/infrastructure', ['src/infrastructure/db.ts']],
    ]);

    const result = noDependencyPlugin.check(noDependency(domain, infra), makeContext(resolvedFiles));
    expect(result.diagnostics).toHaveLength(2);
  });

  it('returns clean result when no violations exist', () => {
    const domain = makeSymbol('domain');
    const infra = makeSymbol('infrastructure');

    mockTS
      .withSourceFile('src/domain/entity.ts', '')
      .withSourceFile('src/domain/service.ts', '')
      .withImport('src/domain/service.ts', 'src/domain/entity.ts', './entity', 1);

    const resolvedFiles = new Map([
      ['src/domain', ['src/domain/entity.ts', 'src/domain/service.ts']],
      ['src/infrastructure', []],
    ]);

    const result = noDependencyPlugin.check(noDependency(domain, infra), makeContext(resolvedFiles));
    expect(result.diagnostics).toHaveLength(0);
  });

  it('handles symbol with no declared location', () => {
    const domain = makeSymbol('domain', ArchSymbolKind.Member, undefined);
    const infra = makeSymbol('infrastructure');

    const result = noDependencyPlugin.check(noDependency(domain, infra), makeContext());
    expect(result.diagnostics).toHaveLength(0);
  });

  it('does not false-positive on path prefix collisions', () => {
    const domain = makeSymbol('domain');
    const infra = makeSymbol('infrastructure');

    mockTS
      .withSourceFile('src/domain/service.ts', '')
      .withSourceFile('src/domain-extensions/helper.ts', '')
      .withImport('src/domain/service.ts', 'src/domain-extensions/helper.ts', '../domain-extensions/helper', 1);

    const resolvedFiles = new Map([
      ['src/domain', ['src/domain/service.ts']],
      ['src/infrastructure', []],
    ]);

    const result = noDependencyPlugin.check(noDependency(domain, infra), makeContext(resolvedFiles));
    expect(result.diagnostics).toHaveLength(0);
  });

  it('skips files where getSourceFile returns undefined', () => {
    const domain = makeSymbol('domain');
    const infra = makeSymbol('infrastructure');

    mockTS.withSourceFile('src/infrastructure/db.ts', '');

    const resolvedFiles = new Map([
      ['src/domain', ['src/domain/orphan.ts']],
      ['src/infrastructure', ['src/infrastructure/db.ts']],
    ]);

    const result = noDependencyPlugin.check(noDependency(domain, infra), makeContext(resolvedFiles));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.filesAnalyzed).toBe(1);
  });

  it('detects violation via path prefix matching with absolute paths', () => {
    const domain = makeSymbol('domain', ArchSymbolKind.Member, '/abs/src/domain');
    const infra = makeSymbol('infrastructure', ArchSymbolKind.Member, '/abs/src/infrastructure');

    mockTS
      .withSourceFile('/abs/src/domain/service.ts', '')
      .withSourceFile('/abs/src/infrastructure/database.ts', '')
      .withImport('/abs/src/domain/service.ts', '/abs/src/infrastructure/database.ts', '../infrastructure/database', 1);

    const resolvedFiles = new Map([
      ['/abs/src/domain', ['/abs/src/domain/service.ts']],
      ['/abs/src/infrastructure', ['/abs/src/infrastructure/database.ts']],
    ]);

    const result = noDependencyPlugin.check(noDependency(domain, infra), makeContext(resolvedFiles));
    expect(result.diagnostics).toHaveLength(1);
  });

  it('handles empty directory', () => {
    const domain = makeSymbol('domain');
    const infra = makeSymbol('infrastructure');

    const result = noDependencyPlugin.check(noDependency(domain, infra), makeContext());
    expect(result.diagnostics).toHaveLength(0);
  });
});

describe('noDependencyPlugin.generate', () => {
  it('returns empty for wrong shape', () => {
    const instance = makeSymbol('inst');
    const result = noDependencyPlugin.generate!(
      { kind: 'stringList', values: ['a'] }, instance, 'K', 'loc'
    );
    expect(result.contracts).toHaveLength(0);
  });

  it('reports error for missing member', () => {
    const instance = makeSymbol('inst');
    const result = noDependencyPlugin.generate!(
      { kind: 'tuplePairs', values: [['missing', 'also']] }, instance, 'K', 'loc'
    );
    expect(result.errors).toHaveLength(1);
  });
});

describe('noDependencyPlugin.validate', () => {
  it('accepts 2 args', () => {
    const from = makeSymbol('domain');
    const to = makeSymbol('infra');
    expect(noDependencyPlugin.validate([from, to])).toBeNull();
  });

  it('rejects wrong arg count', () => {
    const s = makeSymbol('domain');
    expect(noDependencyPlugin.validate([s])).toContain('requires exactly 2 arguments');
  });
});
