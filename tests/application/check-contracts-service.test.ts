import { CheckerService } from '../../src/application/pipeline/check/checker.service';
import { createAllPlugins } from '../../src/application/pipeline/plugins/plugin-registry';
import { MockTypeScriptAdapter } from '../helpers/mocks/mock-typescript.adapter';
import { ContractType } from '../../src/domain/types/contract-type';
import { Contract } from '../../src/domain/entities/contract';
import {
  makeSymbol,
  makeCheckRequest,
  noDependency,
} from '../helpers/factories';

describe('Plugin Registry - Uniqueness', () => {
  it('all plugins have unique constraintNames', () => {
    const plugins = createAllPlugins();
    const names = plugins.map(p => p.constraintName);
    expect(new Set(names).size).toBe(names.length);
  });

  it('all plugins have unique ContractTypes', () => {
    const plugins = createAllPlugins();
    const types = plugins.map(p => p.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it('all plugins have unique diagnostic codes', () => {
    const plugins = createAllPlugins();
    const codes = plugins.map(p => p.diagnosticCode);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe('CheckerService - Dispatcher', () => {
  let service: CheckerService;
  let mockTS: MockTypeScriptAdapter;

  beforeEach(() => {
    mockTS = new MockTypeScriptAdapter();
    service = new CheckerService(createAllPlugins(), mockTS);
  });

  afterEach(() => {
    mockTS.reset();
  });

  it('reports error for invalid contract', () => {
    const domain = makeSymbol('domain');

    // noDependency requires 2 args, give it 1
    const contract = new Contract(
      ContractType.NoDependency,
      'invalid',
      [domain]
    );

    const result = service.execute(makeCheckRequest([contract]));
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe(70099);
    expect(result.diagnostics[0].message).toContain('Invalid contract');
  });

  it('checks all contracts and aggregates results', () => {
    const domain = makeSymbol('domain');
    const infra = makeSymbol('infrastructure');
    const app = makeSymbol('application');

    mockTS
      .withSourceFile('src/domain/service.ts', '')
      .withSourceFile('src/infrastructure/db.ts', '')
      .withSourceFile('src/application/handler.ts', '')
      .withImport('src/domain/service.ts', 'src/infrastructure/db.ts', '../infrastructure/db', 1)
      .withImport('src/domain/service.ts', 'src/application/handler.ts', '../application/handler', 2);

    const resolvedFiles = new Map([
      ['src/domain', ['src/domain/service.ts']],
      ['src/infrastructure', ['src/infrastructure/db.ts']],
      ['src/application', ['src/application/handler.ts']],
    ]);

    const result = service.execute(makeCheckRequest([
      noDependency(domain, infra),
      noDependency(domain, app),
    ], undefined, resolvedFiles));
    expect(result.contractsChecked).toBe(2);
    expect(result.violationsFound).toBe(2);
  });

  it('returns correct filesAnalyzed count', () => {
    const domain = makeSymbol('domain');
    const infra = makeSymbol('infrastructure');

    mockTS
      .withSourceFile('src/domain/a.ts', '')
      .withSourceFile('src/domain/b.ts', '')
      .withSourceFile('src/domain/c.ts', '');

    const resolvedFiles = new Map([
      ['src/domain', ['src/domain/a.ts', 'src/domain/b.ts', 'src/domain/c.ts']],
      ['src/infrastructure', []],
    ]);

    const result = service.execute(makeCheckRequest([noDependency(domain, infra)], undefined, resolvedFiles));
    expect(result.filesAnalyzed).toBe(3);
  });
});
