/**
 * Targeted tests for domain entities and utilities that lack direct unit tests.
 * Covers: NODE_BUILTINS, ImportEdge, Program
 */
import { NODE_BUILTINS } from '../../src/domain/constants/node-builtins';
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

describe('ImportEdge', () => {
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
