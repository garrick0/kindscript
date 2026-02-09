import { relativePath } from '../../src/domain/utils/path-matching';

describe('relativePath', () => {
  it('extracts relative portion when to is under from', () => {
    expect(relativePath('/project/src/domain', '/project/src/domain/entity.ts')).toBe('entity.ts');
  });

  it('handles nested subdirectories', () => {
    expect(relativePath('/project/src', '/project/src/domain/entities/user.ts')).toBe('domain/entities/user.ts');
  });

  it('returns to unchanged when not a subpath', () => {
    expect(relativePath('/project/src/domain', '/project/src/infrastructure/db.ts')).toBe('/project/src/infrastructure/db.ts');
  });

  it('handles trailing slash on from', () => {
    expect(relativePath('/project/src/domain/', '/project/src/domain/entity.ts')).toBe('entity.ts');
  });

  it('normalizes backslashes', () => {
    expect(relativePath('src\\domain', 'src\\domain\\entity.ts')).toBe('entity.ts');
  });

  it('handles relative paths', () => {
    expect(relativePath('src/components', 'src/components/button.ts')).toBe('button.ts');
  });

  it('does not false-positive on prefix collisions', () => {
    expect(relativePath('src/domain', 'src/domain-extensions/foo.ts')).toBe('src/domain-extensions/foo.ts');
  });
});
