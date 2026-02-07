import { MockTypeScriptAdapter } from '../../../src/infrastructure/adapters/testing/mock-typescript.adapter';
import { MockFileSystemAdapter } from '../../../src/infrastructure/adapters/testing/mock-filesystem.adapter';
import { CheckContractsService } from '../../../src/application/use-cases/check-contracts/check-contracts.service';
import { DiagnosticCode } from '../../../src/domain/constants/diagnostic-codes';
import { makeSymbol, makeCheckRequest, noDependency } from '../../helpers/factories';

describe('Architecture Validation: noDependency Contract', () => {
  let mockTS: MockTypeScriptAdapter;
  let mockFS: MockFileSystemAdapter;
  let service: CheckContractsService;

  beforeEach(() => {
    mockTS = new MockTypeScriptAdapter();
    mockFS = new MockFileSystemAdapter();
    service = new CheckContractsService(mockTS, mockFS);
  });

  afterEach(() => {
    mockTS.reset();
    mockFS.reset();
  });

  it('detects forbidden domain → infrastructure dependency', () => {
    mockFS
      .withDirectory('src/domain', ['entity.ts', 'service.ts'])
      .withDirectory('src/infrastructure', ['database.ts']);

    mockTS
      .withSourceFile('src/domain/service.ts', 'export class Service {}')
      .withSourceFile('src/infrastructure/database.ts', 'export class Database {}')
      .withImport('src/domain/service.ts', 'src/infrastructure/database.ts', '../infrastructure/database', 5);

    const domain = makeSymbol('domain');
    const infra = makeSymbol('infrastructure');
    const contract = noDependency(domain, infra, 'domain-must-not-depend-on-infrastructure');

    const result = service.execute(makeCheckRequest([contract]));

    expect(result.violationsFound).toBe(1);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe(DiagnosticCode.ForbiddenDependency);
    expect(result.diagnostics[0].file).toBe('src/domain/service.ts');
    expect(result.diagnostics[0].line).toBe(5);
  });

  it('permits infrastructure → domain dependency', () => {
    mockFS
      .withDirectory('src/domain', ['entity.ts'])
      .withDirectory('src/infrastructure', ['repository.ts']);

    mockTS
      .withSourceFile('src/domain/entity.ts', 'export class Entity {}')
      .withSourceFile('src/infrastructure/repository.ts', 'export class Repository {}')
      .withImport('src/infrastructure/repository.ts', 'src/domain/entity.ts', '../domain/entity', 3);

    const domain = makeSymbol('domain');
    const infra = makeSymbol('infrastructure');

    const result = service.execute(makeCheckRequest([noDependency(domain, infra)]));

    expect(result.violationsFound).toBe(0);
    expect(result.diagnostics).toHaveLength(0);
  });

  it('handles multiple contracts on same symbol', () => {
    mockFS
      .withDirectory('src/domain', ['service.ts'])
      .withDirectory('src/infrastructure', ['db.ts'])
      .withDirectory('src/application', ['handler.ts']);

    mockTS
      .withSourceFile('src/domain/service.ts', '')
      .withSourceFile('src/infrastructure/db.ts', '')
      .withSourceFile('src/application/handler.ts', '')
      .withImport('src/domain/service.ts', 'src/infrastructure/db.ts', '../infrastructure/db', 1);

    const domain = makeSymbol('domain');
    const infra = makeSymbol('infrastructure');
    const app = makeSymbol('application');

    const result = service.execute(makeCheckRequest([
      noDependency(domain, infra),
      noDependency(domain, app),
    ]));

    expect(result.contractsChecked).toBe(2);
    expect(result.violationsFound).toBe(1);
    expect(result.diagnostics[0].code).toBe(DiagnosticCode.ForbiddenDependency);
  });

  it('resolves symbol locations to files', () => {
    const domain = makeSymbol('domain');

    mockFS
      .withFile('src/domain/entity.ts', 'export class Entity {}')
      .withFile('src/domain/value-object.ts', 'export class ValueObject {}')
      .withFile('src/domain/service.ts', 'export class Service {}');

    const files = mockFS.readDirectory('src/domain', true);

    expect(files).toHaveLength(3);
    expect(files).toContain('src/domain/entity.ts');
    expect(files).toContain('src/domain/value-object.ts');
    expect(files).toContain('src/domain/service.ts');
    expect(domain.declaredLocation).toBe('src/domain');
  });

  it('detects transitive dependency chain violations', () => {
    mockFS
      .withFile('src/domain/a.ts', '')
      .withFile('src/application/b.ts', '')
      .withFile('src/infrastructure/c.ts', '');

    mockTS
      .withSourceFile('src/domain/a.ts', '')
      .withSourceFile('src/application/b.ts', '')
      .withSourceFile('src/infrastructure/c.ts', '')
      .withImport('src/domain/a.ts', 'src/application/b.ts', '../application/b', 1)
      .withImport('src/application/b.ts', 'src/infrastructure/c.ts', '../infrastructure/c', 1);

    const domain = makeSymbol('domain');
    const app = makeSymbol('application');
    const infra = makeSymbol('infrastructure');

    const result = service.execute(makeCheckRequest([
      noDependency(domain, app),
      noDependency(app, infra),
    ]));

    expect(result.contractsChecked).toBe(2);
    expect(result.violationsFound).toBe(2);
    expect(result.diagnostics[0].file).toBe('src/domain/a.ts');
    expect(result.diagnostics[1].file).toBe('src/application/b.ts');
  });
});
