import * as path from 'path';
import { ClassifyASTService } from '../../src/application/use-cases/classify-ast/classify-ast.service';
import { ResolveFilesService } from '../../src/application/use-cases/resolve-files/resolve-files.service';
import { CheckContractsService } from '../../src/application/use-cases/check-contracts/check-contracts.service';
import { TypeScriptAdapter } from '../../src/infrastructure/adapters/typescript/typescript.adapter';
import { FileSystemAdapter } from '../../src/infrastructure/adapters/filesystem/filesystem.adapter';
import { ASTAdapter } from '../../src/infrastructure/adapters/ast/ast.adapter';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { ContractType } from '../../src/domain/types/contract-type';

const FIXTURES = path.resolve(__dirname, 'fixtures');

describe('Tier 2 Classification Integration', () => {
  const tsAdapter = new TypeScriptAdapter();
  const fsAdapter = new FileSystemAdapter();
  const astAdapter = new ASTAdapter();
  const classifyService = new ClassifyASTService(astAdapter);
  const resolveFilesService = new ResolveFilesService(fsAdapter);
  const checkService = new CheckContractsService(tsAdapter, fsAdapter);

  describe('clean architecture fixture (no violations)', () => {
    const fixturePath = path.join(FIXTURES, 'tier2-clean-arch');
    const archFile = path.join(fixturePath, 'architecture.ts');

    it('classifies Kind definitions from real TypeScript files', () => {
      const rootFiles = fsAdapter.readDirectory(fixturePath, true);
      const program = tsAdapter.createProgram(rootFiles, {});
      const checker = tsAdapter.getTypeChecker(program);

      const sourceFile = tsAdapter.getSourceFile(program, archFile);
      expect(sourceFile).toBeDefined();

      const result = classifyService.execute({
        definitionFiles: [sourceFile!],
        checker,
        projectRoot: fixturePath,
      });

      expect(result.errors).toHaveLength(0);

      // Should find Kind definitions
      const kinds = result.symbols.filter(s => s.kind === ArchSymbolKind.Kind);
      expect(kinds.length).toBeGreaterThanOrEqual(1);
      expect(kinds.some(k => k.name === 'CleanContext')).toBe(true);
    });

    it('classifies instance declarations with locations', () => {
      const rootFiles = fsAdapter.readDirectory(fixturePath, true);
      const program = tsAdapter.createProgram(rootFiles, {});
      const checker = tsAdapter.getTypeChecker(program);
      const sourceFile = tsAdapter.getSourceFile(program, archFile)!;

      const result = classifyService.execute({
        definitionFiles: [sourceFile],
        checker,
        projectRoot: fixturePath,
      });

      const instances = result.symbols.filter(s => s.kind === ArchSymbolKind.Instance);
      expect(instances).toHaveLength(1);
      expect(instances[0].name).toBe('app');
      expect(instances[0].declaredLocation).toBe(path.join(fixturePath, 'src'));

      // Check member locations
      const domain = instances[0].findMember('domain');
      expect(domain).toBeDefined();
      expect(domain!.declaredLocation).toBe(path.join(fixturePath, 'src/domain'));

      const infra = instances[0].findMember('infrastructure');
      expect(infra).toBeDefined();
      expect(infra!.declaredLocation).toBe(path.join(fixturePath, 'src/infrastructure'));
    });

    it('classifies contracts from defineContracts calls', () => {
      const rootFiles = fsAdapter.readDirectory(fixturePath, true);
      const program = tsAdapter.createProgram(rootFiles, {});
      const checker = tsAdapter.getTypeChecker(program);
      const sourceFile = tsAdapter.getSourceFile(program, archFile)!;

      const result = classifyService.execute({
        definitionFiles: [sourceFile],
        checker,
        projectRoot: fixturePath,
      });

      expect(result.contracts).toHaveLength(1);
      expect(result.contracts[0].type).toBe(ContractType.NoDependency);
      expect(result.contracts[0].args[0].name).toBe('domain');
      expect(result.contracts[0].args[1].name).toBe('infrastructure');
    });

    it('resolves files for classified symbols', () => {
      const rootFiles = fsAdapter.readDirectory(fixturePath, true);
      const program = tsAdapter.createProgram(rootFiles, {});
      const checker = tsAdapter.getTypeChecker(program);
      const sourceFile = tsAdapter.getSourceFile(program, archFile)!;

      const classifyResult = classifyService.execute({
        definitionFiles: [sourceFile],
        checker,
        projectRoot: fixturePath,
      });

      const instance = classifyResult.symbols.find(s => s.kind === ArchSymbolKind.Instance)!;
      const domain = instance.findMember('domain')!;

      const resolveResult = resolveFilesService.execute({
        symbol: domain,
        projectRoot: fixturePath,
      });

      expect(resolveResult.resolved.count).toBeGreaterThanOrEqual(1);
      expect(resolveResult.resolved.files.some(f => f.includes('entity.ts'))).toBe(true);
    });

    it('runs full pipeline with no violations detected', () => {
      const rootFiles = fsAdapter.readDirectory(path.join(fixturePath, 'src'), true);
      const program = tsAdapter.createProgram(
        [...rootFiles, archFile],
        {}
      );
      const checker = tsAdapter.getTypeChecker(program);
      const sourceFile = tsAdapter.getSourceFile(program, archFile)!;

      const classifyResult = classifyService.execute({
        definitionFiles: [sourceFile],
        checker,
        projectRoot: fixturePath,
      });

      expect(classifyResult.contracts.length).toBeGreaterThanOrEqual(1);

      const checkResult = checkService.execute({
        symbols: classifyResult.symbols,
        contracts: classifyResult.contracts,
        config: {},
        program,
      });

      expect(checkResult.violationsFound).toBe(0);
    });
  });

  describe('violation fixture', () => {
    const fixturePath = path.join(FIXTURES, 'tier2-violation');
    const archFile = path.join(fixturePath, 'architecture.ts');

    it('detects forbidden dependency in full pipeline', () => {
      const rootFiles = fsAdapter.readDirectory(path.join(fixturePath, 'src'), true);
      const program = tsAdapter.createProgram(
        [...rootFiles, archFile],
        {}
      );
      const checker = tsAdapter.getTypeChecker(program);
      const sourceFile = tsAdapter.getSourceFile(program, archFile)!;

      const classifyResult = classifyService.execute({
        definitionFiles: [sourceFile],
        checker,
        projectRoot: fixturePath,
      });

      expect(classifyResult.contracts).toHaveLength(1);
      expect(classifyResult.errors).toHaveLength(0);

      const checkResult = checkService.execute({
        symbols: classifyResult.symbols,
        contracts: classifyResult.contracts,
        config: {},
        program,
      });

      expect(checkResult.violationsFound).toBe(1);
      expect(checkResult.diagnostics[0].code).toBe(70001);
      expect(checkResult.diagnostics[0].message).toContain('domain');
      expect(checkResult.diagnostics[0].message).toContain('infrastructure');
    });
  });
});
