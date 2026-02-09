import { mustImplementPlugin } from '../../src/application/pipeline/plugins/must-implement/must-implement.plugin';
import { CheckContext } from '../../src/application/pipeline/plugins/contract-plugin';
import { MockTypeScriptAdapter } from '../helpers/mocks/mock-typescript.adapter';
import { ArchSymbol } from '../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { Program } from '../../src/domain/entities/program';
import { makeSymbol, mustImplement } from '../helpers/factories';

describe('mustImplementPlugin.check', () => {
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

  it('handles mustImplement with no declared location', () => {
    const noLoc = new ArchSymbol('noLoc', ArchSymbolKind.Member);
    const withLoc = makeSymbol('withLoc');

    const result = mustImplementPlugin.check(mustImplement(noLoc, withLoc), makeContext());
    expect(result.diagnostics).toHaveLength(0);
  });

  it('detects missing implementation', () => {
    const ports = makeSymbol('ports', ArchSymbolKind.Member, 'src/ports');
    const adapters = makeSymbol('adapters', ArchSymbolKind.Member, 'src/adapters');

    mockTS
      .withSourceFile('src/ports/repository.port.ts', '')
      .withSourceFile('src/adapters/empty.ts', '')
      .withExportedInterface('src/ports/repository.port.ts', 'RepositoryPort');

    const resolvedFiles = new Map([
      ['src/ports', ['src/ports/repository.port.ts']],
      ['src/adapters', ['src/adapters/empty.ts']],
    ]);

    const result = mustImplementPlugin.check(mustImplement(ports, adapters), makeContext(resolvedFiles));
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe(70002);
    expect(result.diagnostics[0].message).toContain('RepositoryPort');
  });

  it('passes when all interfaces are implemented', () => {
    const ports = makeSymbol('ports', ArchSymbolKind.Member, 'src/ports');
    const adapters = makeSymbol('adapters', ArchSymbolKind.Member, 'src/adapters');

    mockTS
      .withSourceFile('src/ports/repository.port.ts', '')
      .withSourceFile('src/adapters/repository.adapter.ts', '')
      .withExportedInterface('src/ports/repository.port.ts', 'RepositoryPort')
      .withClassImplementing('src/adapters/repository.adapter.ts', 'RepositoryPort');

    const resolvedFiles = new Map([
      ['src/ports', ['src/ports/repository.port.ts']],
      ['src/adapters', ['src/adapters/repository.adapter.ts']],
    ]);

    const result = mustImplementPlugin.check(mustImplement(ports, adapters), makeContext(resolvedFiles));
    expect(result.diagnostics).toHaveLength(0);
  });

  it('handles multiple interfaces', () => {
    const ports = makeSymbol('ports', ArchSymbolKind.Member, 'src/ports');
    const adapters = makeSymbol('adapters', ArchSymbolKind.Member, 'src/adapters');

    mockTS
      .withSourceFile('src/ports/repo.port.ts', '')
      .withSourceFile('src/ports/cache.port.ts', '')
      .withSourceFile('src/adapters/repo.adapter.ts', '')
      .withExportedInterface('src/ports/repo.port.ts', 'RepositoryPort')
      .withExportedInterface('src/ports/cache.port.ts', 'CachePort')
      .withClassImplementing('src/adapters/repo.adapter.ts', 'RepositoryPort');

    const resolvedFiles = new Map([
      ['src/ports', ['src/ports/repo.port.ts', 'src/ports/cache.port.ts']],
      ['src/adapters', ['src/adapters/repo.adapter.ts']],
    ]);

    const result = mustImplementPlugin.check(mustImplement(ports, adapters), makeContext(resolvedFiles));
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].message).toContain('CachePort');
  });

  it('handles missing locations', () => {
    const ports = makeSymbol('ports', ArchSymbolKind.Member, undefined);
    const adapters = makeSymbol('adapters', ArchSymbolKind.Member, 'src/adapters');

    const result = mustImplementPlugin.check(mustImplement(ports, adapters), makeContext());
    expect(result.diagnostics).toHaveLength(0);
    expect(result.filesAnalyzed).toBe(0);
  });

  it('handles empty adapter directory', () => {
    const ports = makeSymbol('ports', ArchSymbolKind.Member, 'src/ports');
    const adapters = makeSymbol('adapters', ArchSymbolKind.Member, 'src/adapters');

    mockTS
      .withSourceFile('src/ports/repo.port.ts', '')
      .withExportedInterface('src/ports/repo.port.ts', 'RepositoryPort');

    const resolvedFiles = new Map([
      ['src/ports', ['src/ports/repo.port.ts']],
      ['src/adapters', []],
    ]);

    const result = mustImplementPlugin.check(mustImplement(ports, adapters), makeContext(resolvedFiles));
    expect(result.diagnostics).toHaveLength(1);
  });

  it('skips port files where getSourceFile returns undefined', () => {
    const ports = makeSymbol('ports', ArchSymbolKind.Member, 'src/ports');
    const adapters = makeSymbol('adapters', ArchSymbolKind.Member, 'src/adapters');

    mockTS.withSourceFile('src/adapters/adapter.ts', '');

    const resolvedFiles = new Map([
      ['src/ports', ['src/ports/orphan.port.ts']],
      ['src/adapters', ['src/adapters/adapter.ts']],
    ]);

    const result = mustImplementPlugin.check(mustImplement(ports, adapters), makeContext(resolvedFiles));
    expect(result.diagnostics).toHaveLength(0);
  });

  it('skips adapter files where getSourceFile returns undefined', () => {
    const ports = makeSymbol('ports', ArchSymbolKind.Member, 'src/ports');
    const adapters = makeSymbol('adapters', ArchSymbolKind.Member, 'src/adapters');

    mockTS
      .withSourceFile('src/ports/repo.port.ts', '')
      .withExportedInterface('src/ports/repo.port.ts', 'RepoPort');

    const resolvedFiles = new Map([
      ['src/ports', ['src/ports/repo.port.ts']],
      ['src/adapters', ['src/adapters/orphan.ts']],
    ]);

    const result = mustImplementPlugin.check(mustImplement(ports, adapters), makeContext(resolvedFiles));
    expect(result.diagnostics).toHaveLength(1);
  });
});

describe('mustImplementPlugin.generate', () => {
  it('returns empty for wrong shape', () => {
    const instance = makeSymbol('inst');
    const result = mustImplementPlugin.generate!(
      { kind: 'stringList', values: ['a'] }, instance, 'K', 'loc'
    );
    expect(result.contracts).toHaveLength(0);
  });

  it('reports error for missing first member', () => {
    const instance = makeSymbol('inst');
    const result = mustImplementPlugin.generate!(
      { kind: 'tuplePairs', values: [['missing', 'also-missing']] }, instance, 'K', 'loc'
    );
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('missing');
  });

  it('reports error for missing second member', () => {
    const members = new Map([['a', makeSymbol('a')]]);
    const instance = new ArchSymbol('inst', ArchSymbolKind.Instance, 'src/inst', members);
    const result = mustImplementPlugin.generate!(
      { kind: 'tuplePairs', values: [['a', 'missing']] }, instance, 'K', 'loc'
    );
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('missing');
  });
});

describe('mustImplementPlugin.validate', () => {
  it('accepts 2 args', () => {
    const p = makeSymbol('ports');
    const a = makeSymbol('adapters');
    expect(mustImplementPlugin.validate([p, a])).toBeNull();
  });

  it('rejects wrong arg count', () => {
    const s = makeSymbol('ports');
    expect(mustImplementPlugin.validate([s])).toContain('requires exactly 2 arguments');
  });
});
