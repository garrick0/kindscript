import * as path from 'path';
import { ContractType } from '../../src/domain/types/contract-type';
import { runPipeline } from '../helpers/test-pipeline';

const FIXTURES = path.resolve(__dirname, 'fixtures');

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
