/**
 * Targeted tests for domain entities and utilities that lack direct unit tests.
 * Covers: NODE_BUILTINS, isFileInSymbol, ImportEdge, Program
 */
import { NODE_BUILTINS } from '../../src/domain/constants/node-builtins';
import { isFileInSymbol } from '../../src/infrastructure/path/path-utils';
import { ImportEdge } from '../../src/application/pipeline/check/import-edge';
import { Program } from '../../src/domain/entities/program';

describe('NODE_BUILTINS', () => {
  it('includes bare built-in modules', () => {
    expect(NODE_BUILTINS.has('fs')).toBe(true);
    expect(NODE_BUILTINS.has('path')).toBe(true);
    expect(NODE_BUILTINS.has('crypto')).toBe(true);
  });

  it('includes node:-prefixed modules', () => {
    expect(NODE_BUILTINS.has('node:fs')).toBe(true);
    expect(NODE_BUILTINS.has('node:path')).toBe(true);
  });

  it('includes subpath modules', () => {
    expect(NODE_BUILTINS.has('fs/promises')).toBe(true);
    expect(NODE_BUILTINS.has('node:fs/promises')).toBe(true);
  });

  it('excludes non-built-in modules', () => {
    expect(NODE_BUILTINS.has('lodash')).toBe(false);
    expect(NODE_BUILTINS.has('express')).toBe(false);
    expect(NODE_BUILTINS.has('./local-module')).toBe(false);
  });
});

describe('isFileInSymbol', () => {
  it('matches file via prefix boundary', () => {
    expect(isFileInSymbol('src/domain/entity.ts', 'src/domain')).toBe(true);
  });

  it('rejects file not in symbol location', () => {
    expect(isFileInSymbol('src/infra/repo.ts', 'src/domain')).toBe(false);
  });

  it('rejects false prefix match without boundary', () => {
    expect(isFileInSymbol('src/domain-extensions/foo.ts', 'src/domain')).toBe(false);
  });

  it('matches exact path', () => {
    expect(isFileInSymbol('src/domain', 'src/domain')).toBe(true);
  });

  it('matches when location appears as absolute path segment', () => {
    expect(isFileInSymbol('/project/src/domain/entity.ts', 'src/domain')).toBe(true);
  });

  it('uses resolvedFiles set when provided', () => {
    const resolved = new Set(['specific-file.ts']);
    expect(isFileInSymbol('specific-file.ts', 'other/location', resolved)).toBe(true);
  });
});

describe('ImportEdge', () => {
  it('equals returns true for identical edges', () => {
    const a = new ImportEdge('src/a.ts', 'src/b.ts', 1, 0, './b');
    const b = new ImportEdge('src/a.ts', 'src/b.ts', 1, 0, './b');
    expect(a.equals(b)).toBe(true);
  });

  it('equals returns false for different edges', () => {
    const a = new ImportEdge('src/a.ts', 'src/b.ts', 1, 0, './b');
    const b = new ImportEdge('src/a.ts', 'src/c.ts', 1, 0, './c');
    expect(a.equals(b)).toBe(false);
  });

  it('toString formats as source:line -> target', () => {
    const edge = new ImportEdge('src/a.ts', 'src/b.ts', 5, 0, './b');
    expect(edge.toString()).toBe('src/a.ts:5 → src/b.ts');
  });
});

describe('Program', () => {
  it('toString formats as Program(N files)', () => {
    const prog = new Program(['a.ts', 'b.ts'], {});
    expect(prog.toString()).toBe('Program(2 files)');
  });
});
