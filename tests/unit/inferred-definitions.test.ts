import { InferredDefinitions, InferredContracts } from '../../src/domain/value-objects/inferred-definitions';

describe('InferredDefinitions', () => {
  const boilerplate = '// boilerplate\n';
  const kindDef = '// kind definition\n';
  const instance = '// instance declaration\n';
  const contextName = 'TestContext';

  const emptyContracts: InferredContracts = {
    noDependency: [],
    mustImplement: [],
    purity: [],
  };

  const sampleContracts: InferredContracts = {
    noDependency: [['domain', 'infrastructure']],
    mustImplement: [],
    purity: ['domain'],
  };

  function makeDefs(
    b = boilerplate,
    k = kindDef,
    i = instance,
    c: InferredContracts = sampleContracts,
    cn = contextName,
  ): InferredDefinitions {
    return new InferredDefinitions(b, k, i, c, cn);
  }

  it('toFileContent() combines all sections with newlines', () => {
    const defs = makeDefs();
    const content = defs.toFileContent();

    expect(content).toContain(boilerplate);
    expect(content).toContain(kindDef);
    expect(content).toContain(instance);
    expect(content).toContain('noDependency');
    expect(content).toContain('purity');
  });

  it('contracts getter generates correct source text from structured data', () => {
    const defs = makeDefs();
    const contracts = defs.contracts;

    expect(contracts).toContain(`defineContracts<${contextName}>`);
    expect(contracts).toContain('["domain", "infrastructure"]');
    expect(contracts).toContain('"domain"');
  });

  it('contracts getter returns empty string when no contracts', () => {
    const defs = makeDefs(boilerplate, kindDef, instance, emptyContracts);
    expect(defs.contracts).toBe('');
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
    const differentContracts: InferredContracts = {
      noDependency: [['a', 'b']],
      mustImplement: [],
      purity: [],
    };
    const b = makeDefs(boilerplate, kindDef, instance, differentContracts);

    expect(a.equals(b)).toBe(false);
  });

  it('toString() returns readable summary with line count', () => {
    const defs = makeDefs();
    const result = defs.toString();

    expect(result).toMatch(/^InferredDefinitions\(\d+ lines\)$/);
  });

  it('contractData is accessible for programmatic use', () => {
    const defs = makeDefs();

    expect(defs.contractData.noDependency).toEqual([['domain', 'infrastructure']]);
    expect(defs.contractData.purity).toEqual(['domain']);
    expect(defs.contractData.mustImplement).toEqual([]);
  });
});
