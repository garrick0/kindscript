import { ResolveFilesService } from '../../src/application/use-cases/resolve-files/resolve-files.service';
import { MockFileSystemAdapter } from '../../src/infrastructure/adapters/testing/mock-filesystem.adapter';
import { ArchSymbol } from '../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';

describe('ResolveFilesService', () => {
  let service: ResolveFilesService;
  let mockFS: MockFileSystemAdapter;

  beforeEach(() => {
    mockFS = new MockFileSystemAdapter();
    service = new ResolveFilesService(mockFS);
  });

  afterEach(() => {
    mockFS.reset();
  });

  it('resolves directory to .ts files', () => {
    mockFS
      .withFile('/project/src/domain/entity.ts', '')
      .withFile('/project/src/domain/service.ts', '');

    const symbol = new ArchSymbol('domain', ArchSymbolKind.Member, '/project/src/domain');

    const result = service.execute({
      symbol,
      projectRoot: '/project',
    });

    expect(result.resolved.count).toBe(2);
    expect(result.resolved.files).toContain('/project/src/domain/entity.ts');
    expect(result.resolved.files).toContain('/project/src/domain/service.ts');
    expect(result.errors).toHaveLength(0);
  });

  it('resolves relative location against project root', () => {
    mockFS
      .withFile('/project/src/domain/entity.ts', '');

    const symbol = new ArchSymbol('domain', ArchSymbolKind.Member, 'src/domain');

    const result = service.execute({
      symbol,
      projectRoot: '/project',
    });

    expect(result.resolved.count).toBe(1);
    expect(result.resolved.files).toContain('/project/src/domain/entity.ts');
  });

  it('returns empty for symbol with no location', () => {
    const symbol = new ArchSymbol('domain', ArchSymbolKind.Member);

    const result = service.execute({
      symbol,
      projectRoot: '/project',
    });

    expect(result.resolved.isEmpty).toBe(true);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('no declared location');
  });

  it('returns error for nonexistent directory', () => {
    const symbol = new ArchSymbol('domain', ArchSymbolKind.Member, 'src/nonexistent');

    const result = service.execute({
      symbol,
      projectRoot: '/project',
    });

    expect(result.resolved.isEmpty).toBe(true);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Directory not found');
  });

  it('excludes files in child symbol directories', () => {
    mockFS
      .withFile('/project/src/domain/root-file.ts', '')
      .withFile('/project/src/domain/entities/entity.ts', '')
      .withFile('/project/src/domain/ports/port.ts', '');

    const entitiesMember = new ArchSymbol('entities', ArchSymbolKind.Member, 'src/domain/entities');
    const portsMember = new ArchSymbol('ports', ArchSymbolKind.Member, 'src/domain/ports');

    const members = new Map<string, ArchSymbol>();
    members.set('entities', entitiesMember);
    members.set('ports', portsMember);

    const symbol = new ArchSymbol('domain', ArchSymbolKind.Member, 'src/domain', members);

    const result = service.execute({
      symbol,
      projectRoot: '/project',
    });

    // Only root-file.ts should remain (entities and ports files are excluded)
    expect(result.resolved.count).toBe(1);
    expect(result.resolved.files).toContain('/project/src/domain/root-file.ts');
  });

  it('handles nested child exclusion (grandchildren)', () => {
    mockFS
      .withFile('/project/src/root.ts', '')
      .withFile('/project/src/domain/service.ts', '')
      .withFile('/project/src/domain/entities/entity.ts', '');

    const entitiesMember = new ArchSymbol('entities', ArchSymbolKind.Member, 'src/domain/entities');
    const domainMembers = new Map<string, ArchSymbol>();
    domainMembers.set('entities', entitiesMember);

    const domainMember = new ArchSymbol('domain', ArchSymbolKind.Member, 'src/domain', domainMembers);
    const topMembers = new Map<string, ArchSymbol>();
    topMembers.set('domain', domainMember);

    const symbol = new ArchSymbol('root', ArchSymbolKind.Instance, 'src', topMembers);

    const result = service.execute({
      symbol,
      projectRoot: '/project',
    });

    // Only root.ts should remain — domain/ and domain/entities/ are excluded
    expect(result.resolved.count).toBe(1);
    expect(result.resolved.files).toContain('/project/src/root.ts');
  });

  it('skips child members with no declared location', () => {
    mockFS
      .withFile('/project/src/domain/entity.ts', '')
      .withFile('/project/src/domain/service.ts', '');

    // Child member with no location — should be skipped during exclusion
    const childNoLocation = new ArchSymbol('abstract', ArchSymbolKind.Member);
    const members = new Map<string, ArchSymbol>();
    members.set('abstract', childNoLocation);

    const symbol = new ArchSymbol('domain', ArchSymbolKind.Member, 'src/domain', members);

    const result = service.execute({
      symbol,
      projectRoot: '/project',
    });

    // All files should be present since the child has no location to exclude
    expect(result.resolved.count).toBe(2);
  });

  it('handles symbol with no children', () => {
    mockFS
      .withFile('/project/src/domain/entity.ts', '')
      .withFile('/project/src/domain/service.ts', '');

    const symbol = new ArchSymbol('domain', ArchSymbolKind.Member, 'src/domain');

    const result = service.execute({
      symbol,
      projectRoot: '/project',
    });

    expect(result.resolved.count).toBe(2);
  });

  it('handles absolute location paths', () => {
    mockFS
      .withFile('/absolute/path/domain/entity.ts', '');

    const symbol = new ArchSymbol('domain', ArchSymbolKind.Member, '/absolute/path/domain');

    const result = service.execute({
      symbol,
      projectRoot: '/project',
    });

    expect(result.resolved.count).toBe(1);
    expect(result.resolved.files).toContain('/absolute/path/domain/entity.ts');
  });
});
