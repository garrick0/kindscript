import { CheckContractsService } from '../../src/application/use-cases/check-contracts/check-contracts.service';
import { createAllCheckers } from '../../src/application/use-cases/check-contracts/create-checkers';
import { MockTypeScriptAdapter } from '../../src/infrastructure/adapters/testing/mock-typescript.adapter';
import { ContractType } from '../../src/domain/types/contract-type';
import { Contract } from '../../src/domain/entities/contract';
import {
  makeSymbol,
  makeCheckRequest,
  noDependency,
} from '../helpers/factories';

describe('CheckContractsService - Dispatcher', () => {
  let service: CheckContractsService;
  let mockTS: MockTypeScriptAdapter;

  beforeEach(() => {
    mockTS = new MockTypeScriptAdapter();
    service = new CheckContractsService(createAllCheckers(), mockTS);
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
