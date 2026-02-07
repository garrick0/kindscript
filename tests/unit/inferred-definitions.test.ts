import { InferredDefinitions } from '../../src/domain/value-objects/inferred-definitions';

describe('InferredDefinitions', () => {
  const boilerplate = '// boilerplate\n';
  const kindDef = '// kind definition\n';
  const instance = '// instance declaration\n';
  const contracts = '// contracts\n';

  function makeDefs(
    b = boilerplate,
    k = kindDef,
    i = instance,
    c = contracts
  ): InferredDefinitions {
    return new InferredDefinitions(b, k, i, c);
  }

  it('toFileContent() combines all 4 sections with newlines', () => {
    const defs = makeDefs();
    const content = defs.toFileContent();

    expect(content).toBe(
      boilerplate + '\n' + kindDef + '\n' + instance + '\n' + contracts
    );
  });

  it('equals() returns true for identical definitions', () => {
    const a = makeDefs();
    const b = makeDefs();

    expect(a.equals(b)).toBe(true);
  });

  it('equals() returns false when boilerplate differs', () => {
    const a = makeDefs();
    const b = makeDefs('// different boilerplate\n');

    expect(a.equals(b)).toBe(false);
  });

  it('equals() returns false when kindDefinition differs', () => {
    const a = makeDefs();
    const b = makeDefs(boilerplate, '// different kind\n');

    expect(a.equals(b)).toBe(false);
  });

  it('equals() returns false when instanceDeclaration differs', () => {
    const a = makeDefs();
    const b = makeDefs(boilerplate, kindDef, '// different instance\n');

    expect(a.equals(b)).toBe(false);
  });

  it('equals() returns false when contracts differ', () => {
    const a = makeDefs();
    const b = makeDefs(boilerplate, kindDef, instance, '// different contracts\n');

    expect(a.equals(b)).toBe(false);
  });

  it('toString() returns readable summary with line count', () => {
    const defs = makeDefs();
    const result = defs.toString();

    expect(result).toMatch(/^InferredDefinitions\(\d+ lines\)$/);
  });
});
