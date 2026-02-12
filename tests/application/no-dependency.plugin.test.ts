import { noDependencyPlugin } from '../../src/application/pipeline/plugins/no-dependency/no-dependency.plugin';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { makeSymbol, noDependency } from '../helpers/factories';
import { setupPluginTestEnv } from '../helpers/plugin-test-helpers';

describe('noDependencyPlugin.check', () => {
  const { getMock, makeContext } = setupPluginTestEnv();

  it('detects forbidden dependency from domain to infrastructure', () => {
    const domain = makeSymbol('domain');
    const infra = makeSymbol('infrastructure');

    const mockTS = getMock();
    mockTS
      .withSourceFile('src/domain/service.ts', 'import { Db } from "../infrastructure/database";')
      .withSourceFile('src/infrastructure/database.ts', 'export class Db {}')
      .withImport('src/domain/service.ts', 'src/infrastructure/database.ts', '../infrastructure/database', 1);

    domain.files = ['src/domain/service.ts'];
    infra.files = ['src/infrastructure/database.ts'];

    const result = noDependencyPlugin.check(noDependency(domain, infra), makeContext());

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe(70001);
    expect(result.diagnostics[0].message).toContain('src/domain/service.ts');
    expect(result.diagnostics[0].message).toContain('src/infrastructure/database.ts');
  });

  it('allows permitted dependency direction', () => {
    const domain = makeSymbol('domain');
    const infra = makeSymbol('infrastructure');

    const mockTS = getMock();
    mockTS
      .withSourceFile('src/domain/entity.ts', 'export class Entity {}')
      .withSourceFile('src/infrastructure/repo.ts', 'import { Entity } from "../domain/entity";')
      .withImport('src/infrastructure/repo.ts', 'src/domain/entity.ts', '../domain/entity', 1);

    domain.files = ['src/domain/entity.ts'];
    infra.files = ['src/infrastructure/repo.ts'];

    const result = noDependencyPlugin.check(noDependency(domain, infra), makeContext());
    expect(result.diagnostics).toHaveLength(0);
  });

  it('detects multiple violations in the same file', () => {
    const domain = makeSymbol('domain');
    const infra = makeSymbol('infrastructure');

    const mockTS = getMock();
    mockTS
      .withSourceFile('src/domain/service.ts', '')
      .withSourceFile('src/infrastructure/database.ts', '')
      .withSourceFile('src/infrastructure/cache.ts', '')
      .withImport('src/domain/service.ts', 'src/infrastructure/database.ts', '../infrastructure/database', 1)
      .withImport('src/domain/service.ts', 'src/infrastructure/cache.ts', '../infrastructure/cache', 2);

    domain.files = ['src/domain/service.ts'];
    infra.files = ['src/infrastructure/database.ts', 'src/infrastructure/cache.ts'];

    const result = noDependencyPlugin.check(noDependency(domain, infra), makeContext());
    expect(result.diagnostics).toHaveLength(2);
  });

  it('detects violations across multiple source files', () => {
    const domain = makeSymbol('domain');
    const infra = makeSymbol('infrastructure');

    const mockTS = getMock();
    mockTS
      .withSourceFile('src/domain/a.ts', '')
      .withSourceFile('src/domain/b.ts', '')
      .withSourceFile('src/infrastructure/db.ts', '')
      .withImport('src/domain/a.ts', 'src/infrastructure/db.ts', '../infrastructure/db', 1)
      .withImport('src/domain/b.ts', 'src/infrastructure/db.ts', '../infrastructure/db', 1);

    domain.files = ['src/domain/a.ts', 'src/domain/b.ts'];
    infra.files = ['src/infrastructure/db.ts'];

    const result = noDependencyPlugin.check(noDependency(domain, infra), makeContext());
    expect(result.diagnostics).toHaveLength(2);
  });

  it('returns clean result when no violations exist', () => {
    const domain = makeSymbol('domain');
    const infra = makeSymbol('infrastructure');

    const mockTS = getMock();
    mockTS
      .withSourceFile('src/domain/entity.ts', '')
      .withSourceFile('src/domain/service.ts', '')
      .withImport('src/domain/service.ts', 'src/domain/entity.ts', './entity', 1);

    domain.files = ['src/domain/entity.ts', 'src/domain/service.ts'];
    infra.files = [];

    const result = noDependencyPlugin.check(noDependency(domain, infra), makeContext());
    expect(result.diagnostics).toHaveLength(0);
  });

  it('handles symbol with no declared location', () => {
    const domain = makeSymbol('domain', ArchSymbolKind.Member, undefined);
    const infra = makeSymbol('infrastructure');

    domain.files = [];

    const result = noDependencyPlugin.check(noDependency(domain, infra), makeContext());
    expect(result.diagnostics).toHaveLength(0);
  });

  it('does not false-positive on path prefix collisions', () => {
    const domain = makeSymbol('domain');
    const infra = makeSymbol('infrastructure');

    const mockTS = getMock();
    mockTS
      .withSourceFile('src/domain/service.ts', '')
      .withSourceFile('src/domain-extensions/helper.ts', '')
      .withImport('src/domain/service.ts', 'src/domain-extensions/helper.ts', '../domain-extensions/helper', 1);

    domain.files = ['src/domain/service.ts'];
    infra.files = [];

    const result = noDependencyPlugin.check(noDependency(domain, infra), makeContext());
    expect(result.diagnostics).toHaveLength(0);
  });

  it('skips files where getSourceFile returns undefined', () => {
    const domain = makeSymbol('domain');
    const infra = makeSymbol('infrastructure');

    const mockTS = getMock();
    mockTS.withSourceFile('src/infrastructure/db.ts', '');

    domain.files = ['src/domain/orphan.ts'];
    infra.files = ['src/infrastructure/db.ts'];

    const result = noDependencyPlugin.check(noDependency(domain, infra), makeContext());
    expect(result.diagnostics).toHaveLength(0);
    expect(result.filesAnalyzed).toBe(1);
  });

  it('detects violation via path prefix matching with absolute paths', () => {
    const domain = makeSymbol('domain', ArchSymbolKind.Member, '/abs/src/domain');
    const infra = makeSymbol('infrastructure', ArchSymbolKind.Member, '/abs/src/infrastructure');

    const mockTS = getMock();
    mockTS
      .withSourceFile('/abs/src/domain/service.ts', '')
      .withSourceFile('/abs/src/infrastructure/database.ts', '')
      .withImport('/abs/src/domain/service.ts', '/abs/src/infrastructure/database.ts', '../infrastructure/database', 1);

    domain.files = ['/abs/src/domain/service.ts'];
    infra.files = ['/abs/src/infrastructure/database.ts'];

    const result = noDependencyPlugin.check(noDependency(domain, infra), makeContext());
    expect(result.diagnostics).toHaveLength(1);
  });

  it('handles empty directory', () => {
    const domain = makeSymbol('domain');
    const infra = makeSymbol('infrastructure');

    domain.files = [];
    infra.files = [];

    const result = noDependencyPlugin.check(noDependency(domain, infra), makeContext());
    expect(result.diagnostics).toHaveLength(0);
  });
});

describe('noDependencyPlugin.check (intra-file)', () => {
  const { getMock, makeContext } = setupPluginTestEnv();

  it('detects forbidden intra-file reference between wrapped Kind members', () => {
    const deciders = makeSymbol('deciders', ArchSymbolKind.Member, 'src/order/deciders');
    const evolvers = makeSymbol('evolvers', ArchSymbolKind.Member, 'src/order/evolvers');

    const mockTS = getMock();
    mockTS
      .withSourceFile('src/order/decider.ts', '')
      .withIntraFileReference('src/order/decider.ts', 'decide', 'evolve', 5, 10);

    deciders.files = ['src/order/decider.ts'];
    evolvers.files = ['src/order/decider.ts'];

    deciders.declarations = new Map([['src/order/decider.ts', new Set(['decide'])]]);
    evolvers.declarations = new Map([['src/order/decider.ts', new Set(['evolve'])]]);

    const result = noDependencyPlugin.check(
      noDependency(deciders, evolvers),
      makeContext(),
    );

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe(70001);
    expect(result.diagnostics[0].message).toContain('deciders');
    expect(result.diagnostics[0].message).toContain('evolvers');
    expect(result.diagnostics[0].message).toContain('decide');
    expect(result.diagnostics[0].message).toContain('evolve');
  });

  it('allows intra-file reference within the same member', () => {
    const deciders = makeSymbol('deciders', ArchSymbolKind.Member, 'src/order/deciders');
    const evolvers = makeSymbol('evolvers', ArchSymbolKind.Member, 'src/order/evolvers');

    const mockTS = getMock();
    mockTS
      .withSourceFile('src/order/decider.ts', '')
      .withIntraFileReference('src/order/decider.ts', 'decide', 'parseCommand', 5, 10);

    deciders.files = ['src/order/decider.ts'];
    evolvers.files = ['src/order/decider.ts'];

    deciders.declarations = new Map([['src/order/decider.ts', new Set(['decide'])]]);
    evolvers.declarations = new Map([['src/order/decider.ts', new Set(['evolve'])]]);

    const result = noDependencyPlugin.check(
      noDependency(deciders, evolvers),
      makeContext(),
    );

    expect(result.diagnostics).toHaveLength(0);
  });

  it('allows reference to unassigned declaration', () => {
    const deciders = makeSymbol('deciders', ArchSymbolKind.Member, 'src/order/deciders');
    const evolvers = makeSymbol('evolvers', ArchSymbolKind.Member, 'src/order/evolvers');

    const mockTS = getMock();
    mockTS
      .withSourceFile('src/order/decider.ts', '')
      .withIntraFileReference('src/order/decider.ts', 'decide', 'deepClone', 8, 4);

    deciders.files = ['src/order/decider.ts'];
    evolvers.files = ['src/order/decider.ts'];

    deciders.declarations = new Map([['src/order/decider.ts', new Set(['decide'])]]);
    evolvers.declarations = new Map([['src/order/decider.ts', new Set(['evolve'])]]);

    const result = noDependencyPlugin.check(
      noDependency(deciders, evolvers),
      makeContext(),
    );

    expect(result.diagnostics).toHaveLength(0);
  });

  it('detects multiple intra-file violations', () => {
    const deciders = makeSymbol('deciders', ArchSymbolKind.Member, 'src/order/deciders');
    const evolvers = makeSymbol('evolvers', ArchSymbolKind.Member, 'src/order/evolvers');

    const mockTS = getMock();
    mockTS
      .withSourceFile('src/order/decider.ts', '')
      .withIntraFileReference('src/order/decider.ts', 'decide', 'evolve', 5, 10)
      .withIntraFileReference('src/order/decider.ts', 'decide', 'evolve2', 8, 10);

    deciders.files = ['src/order/decider.ts'];
    evolvers.files = ['src/order/decider.ts'];

    deciders.declarations = new Map([['src/order/decider.ts', new Set(['decide'])]]);
    evolvers.declarations = new Map([['src/order/decider.ts', new Set(['evolve', 'evolve2'])]]);

    const result = noDependencyPlugin.check(
      noDependency(deciders, evolvers),
      makeContext(),
    );

    expect(result.diagnostics).toHaveLength(2);
  });

  it('skips intra-file check when symbols have no declarations', () => {
    const deciders = makeSymbol('deciders', ArchSymbolKind.Member, 'src/order/deciders');
    const evolvers = makeSymbol('evolvers', ArchSymbolKind.Member, 'src/order/evolvers');

    const mockTS = getMock();
    mockTS
      .withSourceFile('src/order/decider.ts', '')
      .withIntraFileReference('src/order/decider.ts', 'decide', 'evolve', 5, 10);

    deciders.files = ['src/order/decider.ts'];
    evolvers.files = ['src/order/decider.ts'];

    // No declarations set → intra-file checks skipped

    const result = noDependencyPlugin.check(noDependency(deciders, evolvers), makeContext());
    expect(result.diagnostics).toHaveLength(0);
  });

  it('skips intra-file check when file has no declarations for either symbol', () => {
    const deciders = makeSymbol('deciders', ArchSymbolKind.Member, 'src/order/deciders');
    const evolvers = makeSymbol('evolvers', ArchSymbolKind.Member, 'src/order/evolvers');

    const mockTS = getMock();
    mockTS
      .withSourceFile('src/order/decider.ts', '')
      .withIntraFileReference('src/order/decider.ts', 'decide', 'evolve', 5, 10);

    deciders.files = ['src/order/decider.ts'];
    evolvers.files = ['src/order/decider.ts'];

    // Declarations exist but for a different file
    deciders.declarations = new Map([['src/other/file.ts', new Set(['decide'])]]);

    const result = noDependencyPlugin.check(
      noDependency(deciders, evolvers),
      makeContext(),
    );

    expect(result.diagnostics).toHaveLength(0);
  });

  it('does not check intra-file when files do not overlap', () => {
    const domain = makeSymbol('domain');
    const infra = makeSymbol('infrastructure');

    const mockTS = getMock();
    mockTS
      .withSourceFile('src/domain/service.ts', '')
      .withSourceFile('src/infrastructure/db.ts', '');

    domain.files = ['src/domain/service.ts'];
    infra.files = ['src/infrastructure/db.ts'];

    const result = noDependencyPlugin.check(
      noDependency(domain, infra),
      makeContext(),
    );

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
