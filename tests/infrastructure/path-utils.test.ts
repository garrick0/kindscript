import { relativePath, resolvePath } from '../../src/infrastructure/path/path-utils';

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

describe('resolvePath', () => {
  it('"." returns the base unchanged', () => {
    expect(resolvePath('/project/src', '.')).toBe('/project/src');
  });

  it('"./foo" appends to base', () => {
    expect(resolvePath('/project/src', './ordering')).toBe('/project/src/ordering');
  });

  it('"../foo" navigates up one level', () => {
    expect(resolvePath('/project/src/ordering', '../shared')).toBe('/project/src/shared');
  });

  it('resolves nested relative path', () => {
    expect(resolvePath('/project/src', './ordering/domain')).toBe('/project/src/ordering/domain');
  });

  it('resolves multiple .. segments', () => {
    expect(resolvePath('/project/src/a/b', '../../shared')).toBe('/project/src/shared');
  });

  it('preserves file extensions in the relative path', () => {
    expect(resolvePath('/project/src', './helpers.ts')).toBe('/project/src/helpers.ts');
  });

  it('normalizes backslashes', () => {
    expect(resolvePath('project\\src', '.\\ordering')).toBe('project/src/ordering');
  });

  it('strips trailing slash from base', () => {
    expect(resolvePath('/project/src/', './ordering')).toBe('/project/src/ordering');
  });
});
