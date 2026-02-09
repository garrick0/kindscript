import { ContractType } from '../../src/domain/types/contract-type';
import { runPipeline } from '../helpers/test-pipeline';
import { FIXTURES } from '../helpers/fixtures';

describe('Tier 2 Contract Integration Tests', () => {
  describe('purity contract', () => {
    it('detects impure import in purity-violation fixture', () => {
      const { classifyResult, checkResult } = runPipeline(
        FIXTURES.PURITY_VIOLATION
      );

      expect(classifyResult.errors).toHaveLength(0);
      expect(classifyResult.contracts).toHaveLength(1);
      expect(classifyResult.contracts[0].type).toBe(ContractType.Purity);

      expect(checkResult.violationsFound).toBe(1);
      expect(checkResult.diagnostics[0].code).toBe(70003);
      expect(checkResult.diagnostics[0].message).toContain('fs');
    });

    it('passes for purity-clean fixture', () => {
      const { classifyResult, checkResult } = runPipeline(
        FIXTURES.PURITY_CLEAN
      );

      expect(classifyResult.errors).toHaveLength(0);
      expect(classifyResult.contracts).toHaveLength(1);
      expect(checkResult.violationsFound).toBe(0);
    });
  });

  describe('noCycles contract', () => {
    it('detects circular dependency in no-cycles-violation fixture', () => {
      const { classifyResult, checkResult } = runPipeline(
        FIXTURES.NO_CYCLES_VIOLATION
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
        FIXTURES.MUST_IMPLEMENT_VIOLATION
      );

      expect(classifyResult.errors).toHaveLength(0);
      expect(classifyResult.contracts).toHaveLength(1);
      expect(classifyResult.contracts[0].type).toBe(ContractType.MustImplement);

      expect(checkResult.violationsFound).toBe(1);
      expect(checkResult.diagnostics[0].code).toBe(70002);
      expect(checkResult.diagnostics[0].message).toContain('RepositoryPort');
    });

    it('passes when implementation exists in must-implement-clean fixture', () => {
      const { classifyResult, checkResult } = runPipeline(
        FIXTURES.MUST_IMPLEMENT_CLEAN
      );

      expect(classifyResult.errors).toHaveLength(0);
      expect(classifyResult.contracts).toHaveLength(1);
      expect(checkResult.violationsFound).toBe(0);
    });
  });

  describe('mirrors contract', () => {
    it('detects missing counterpart in mirrors-violation fixture', () => {
      const { classifyResult, checkResult } = runPipeline(
        FIXTURES.MIRRORS_VIOLATION
      );

      expect(classifyResult.errors).toHaveLength(0);
      expect(classifyResult.contracts).toHaveLength(1);
      expect(classifyResult.contracts[0].type).toBe(ContractType.Mirrors);

      expect(checkResult.violationsFound).toBe(1);
      expect(checkResult.diagnostics[0].code).toBe(70005);
      expect(checkResult.diagnostics[0].message).toContain('form.ts');
    });

    it('passes when all files have counterparts in mirrors-clean fixture', () => {
      const { classifyResult, checkResult } = runPipeline(
        FIXTURES.MIRRORS_CLEAN
      );

      expect(classifyResult.errors).toHaveLength(0);
      expect(classifyResult.contracts).toHaveLength(1);
      expect(checkResult.violationsFound).toBe(0);
    });
  });

  describe('design system (atomic design + .tsx)', () => {
    it('detects atom→organism violation in design-system-violation fixture', () => {
      const { classifyResult, checkResult } = runPipeline(
        FIXTURES.DESIGN_SYSTEM_VIOLATION
      );

      expect(classifyResult.errors).toHaveLength(0);
      // 6 noDependency pairs in the atomic design hierarchy
      expect(classifyResult.contracts).toHaveLength(6);
      expect(classifyResult.contracts.every(c => c.type === ContractType.NoDependency)).toBe(true);

      // Should detect atoms importing from organisms
      expect(checkResult.violationsFound).toBe(1);
      expect(checkResult.diagnostics[0].code).toBe(70001);

      const violationFiles = checkResult.diagnostics.map(d => d.file);
      expect(violationFiles.some(f => f.includes('Button.tsx'))).toBe(true);
    });

    it('passes for design-system-clean fixture with .tsx files', () => {
      const { classifyResult, checkResult } = runPipeline(
        FIXTURES.DESIGN_SYSTEM_CLEAN
      );

      expect(classifyResult.errors).toHaveLength(0);
      expect(classifyResult.contracts).toHaveLength(6);
      expect(checkResult.violationsFound).toBe(0);
    });
  });
});
