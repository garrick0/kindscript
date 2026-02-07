import * as path from 'path';
import { ClassifyASTService } from '../../src/application/use-cases/classify-ast/classify-ast.service';
import { CheckContractsService } from '../../src/application/use-cases/check-contracts/check-contracts.service';
import { TypeScriptAdapter } from '../../src/infrastructure/adapters/typescript/typescript.adapter';
import { FileSystemAdapter } from '../../src/infrastructure/adapters/filesystem/filesystem.adapter';
import { ASTAdapter } from '../../src/infrastructure/adapters/ast/ast.adapter';
import { ContractType } from '../../src/domain/types/contract-type';

const FIXTURES = path.resolve(__dirname, 'fixtures');

/**
 * Helper: run the full classify + check pipeline on a fixture.
 */
function runPipeline(fixturePath: string) {
  const tsAdapter = new TypeScriptAdapter();
  const fsAdapter = new FileSystemAdapter();
  const astAdapter = new ASTAdapter();
  const classifyService = new ClassifyASTService(astAdapter);
  const checkService = new CheckContractsService(tsAdapter, fsAdapter);

  const archFile = path.join(fixturePath, 'architecture.ts');
  const srcFiles = fsAdapter.readDirectory(path.join(fixturePath, 'src'), true);
  const allRootFiles = [...new Set([...srcFiles, archFile])];

  const program = tsAdapter.createProgram(allRootFiles, {});
  const checker = tsAdapter.getTypeChecker(program);
  const sourceFile = tsAdapter.getSourceFile(program, archFile)!;

  const classifyResult = classifyService.execute({
    definitionFiles: [sourceFile],
    checker,
    projectRoot: fixturePath,
  });

  const checkResult = checkService.execute({
    symbols: classifyResult.symbols,
    contracts: classifyResult.contracts,
    config: {},
    programRootFiles: allRootFiles,
  });

  return { classifyResult, checkResult };
}

describe('Tier 2 Contract Integration Tests', () => {
  describe('purity contract', () => {
    it('detects impure import in purity-violation fixture', () => {
      const { classifyResult, checkResult } = runPipeline(
        path.join(FIXTURES, 'purity-violation')
      );

      expect(classifyResult.errors).toHaveLength(0);
      expect(classifyResult.contracts).toHaveLength(1);
      expect(classifyResult.contracts[0].type).toBe(ContractType.Purity);

      expect(checkResult.violationsFound).toBeGreaterThanOrEqual(1);
      expect(checkResult.diagnostics[0].code).toBe(70003);
      expect(checkResult.diagnostics[0].message).toContain('fs');
    });

    it('passes for purity-clean fixture', () => {
      const { classifyResult, checkResult } = runPipeline(
        path.join(FIXTURES, 'purity-clean')
      );

      expect(classifyResult.errors).toHaveLength(0);
      expect(classifyResult.contracts).toHaveLength(1);
      expect(checkResult.violationsFound).toBe(0);
    });
  });

  describe('noCycles contract', () => {
    it('detects circular dependency in no-cycles-violation fixture', () => {
      const { classifyResult, checkResult } = runPipeline(
        path.join(FIXTURES, 'no-cycles-violation')
      );

      expect(classifyResult.errors).toHaveLength(0);
      expect(classifyResult.contracts).toHaveLength(1);
      expect(classifyResult.contracts[0].type).toBe(ContractType.NoCycles);

      expect(checkResult.violationsFound).toBe(1);
      expect(checkResult.diagnostics[0].code).toBe(70004);
      expect(checkResult.diagnostics[0].message).toContain('Circular dependency');
    });
  });

  describe('mustImplement contract', () => {
    it('detects missing implementation in must-implement-violation fixture', () => {
      const { classifyResult, checkResult } = runPipeline(
        path.join(FIXTURES, 'must-implement-violation')
      );

      expect(classifyResult.errors).toHaveLength(0);
      expect(classifyResult.contracts).toHaveLength(1);
      expect(classifyResult.contracts[0].type).toBe(ContractType.MustImplement);

      expect(checkResult.violationsFound).toBeGreaterThanOrEqual(1);
      expect(checkResult.diagnostics[0].code).toBe(70002);
      expect(checkResult.diagnostics[0].message).toContain('RepositoryPort');
    });

    it('passes when implementation exists in must-implement-clean fixture', () => {
      const { classifyResult, checkResult } = runPipeline(
        path.join(FIXTURES, 'must-implement-clean')
      );

      expect(classifyResult.errors).toHaveLength(0);
      expect(classifyResult.contracts).toHaveLength(1);
      expect(checkResult.violationsFound).toBe(0);
    });
  });

  describe('colocated contract', () => {
    it('detects missing counterpart in colocated-violation fixture', () => {
      const { classifyResult, checkResult } = runPipeline(
        path.join(FIXTURES, 'colocated-violation')
      );

      expect(classifyResult.errors).toHaveLength(0);
      expect(classifyResult.contracts).toHaveLength(1);
      expect(classifyResult.contracts[0].type).toBe(ContractType.Colocated);

      expect(checkResult.violationsFound).toBe(1);
      expect(checkResult.diagnostics[0].code).toBe(70005);
      expect(checkResult.diagnostics[0].message).toContain('form.ts');
    });

    it('passes when all files have counterparts in colocated-clean fixture', () => {
      const { classifyResult, checkResult } = runPipeline(
        path.join(FIXTURES, 'colocated-clean')
      );

      expect(classifyResult.errors).toHaveLength(0);
      expect(classifyResult.contracts).toHaveLength(1);
      expect(checkResult.violationsFound).toBe(0);
    });
  });
});
