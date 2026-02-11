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
      expect(classifyResult.contracts).toHaveLength(2);
      expect(classifyResult.contracts[0].type).toBe(ContractType.NoCycles);

      expect(checkResult.violationsFound).toBe(1);
      expect(checkResult.diagnostics[0].code).toBe(70004);
      expect(checkResult.diagnostics[0].message).toContain('Circular dependency');
    });
  });

  describe('scope validation', () => {
    it('folder-scoped leaf Kind resolves to directory, not file', () => {
      const { classifyResult, checkResult } = runPipeline(
        FIXTURES.SCOPE_OVERRIDE_CLEAN
      );

      expect(classifyResult.errors).toHaveLength(0);
      // Purity propagation requires a parent Kind — standalone leaf Kind
      // with { pure: true } propagates through intrinsic mechanism
      expect(checkResult.violationsFound).toBe(0);
    });
  });

  describe('scope mismatch', () => {
    it('detects folder scope with file location', () => {
      const { classifyResult, checkResult } = runPipeline(
        FIXTURES.SCOPE_MISMATCH_VIOLATION
      );

      expect(classifyResult.errors).toHaveLength(0);

      // Should have a scope contract
      const scopeContracts = classifyResult.contracts.filter(c => c.type === ContractType.Scope);
      expect(scopeContracts).toHaveLength(1);

      expect(checkResult.violationsFound).toBe(1);
      expect(checkResult.diagnostics[0].code).toBe(70005);
      expect(checkResult.diagnostics[0].message).toContain('folder scope');
    });
  });

  describe('TypeKind composability', () => {
    it('passes when no Decider imports from Effector', () => {
      const { classifyResult, checkResult } = runPipeline(
        FIXTURES.TYPEKIND_COMPOSABILITY_CLEAN
      );

      expect(classifyResult.errors).toHaveLength(0);
      expect(classifyResult.contracts).toHaveLength(2);
      expect(classifyResult.contracts[0].type).toBe(ContractType.NoDependency);
      expect(checkResult.violationsFound).toBe(0);
    });

    it('detects Decider importing from Effector file', () => {
      const { classifyResult, checkResult } = runPipeline(
        FIXTURES.TYPEKIND_COMPOSABILITY_VIOLATION
      );

      expect(classifyResult.errors).toHaveLength(0);
      expect(classifyResult.contracts).toHaveLength(2);
      expect(classifyResult.contracts[0].type).toBe(ContractType.NoDependency);

      expect(checkResult.violationsFound).toBe(1);
      expect(checkResult.diagnostics[0].code).toBe(70001);
      expect(checkResult.diagnostics[0].message).toContain('apply-discount');
      expect(checkResult.diagnostics[0].message).toContain('notify-order');
    });
  });

  describe('TypeKind standalone purity', () => {
    it('passes when TypeKind with pure constraint has no impure imports', () => {
      const { classifyResult, checkResult } = runPipeline(
        FIXTURES.TYPEKIND_PURITY_CLEAN
      );

      expect(classifyResult.errors).toHaveLength(0);
      // Should have purity contracts from TypeKind constraints
      const purityContracts = classifyResult.contracts.filter(c => c.type === ContractType.Purity);
      expect(purityContracts.length).toBeGreaterThan(0);
      expect(checkResult.violationsFound).toBe(0);
    });

    it('detects impure import in TypeKind with pure constraint', () => {
      const { classifyResult, checkResult } = runPipeline(
        FIXTURES.TYPEKIND_PURITY_VIOLATION
      );

      expect(classifyResult.errors).toHaveLength(0);
      const purityContracts = classifyResult.contracts.filter(c => c.type === ContractType.Purity);
      expect(purityContracts.length).toBeGreaterThan(0);

      expect(checkResult.violationsFound).toBe(1);
      expect(checkResult.diagnostics[0].code).toBe(70003);
      expect(checkResult.diagnostics[0].message).toContain('fs');
    });
  });

  describe('overlap contract', () => {
    it('detects member overlap in overlap-violation fixture', () => {
      const { classifyResult, checkResult } = runPipeline(
        FIXTURES.OVERLAP_VIOLATION
      );

      expect(classifyResult.errors).toHaveLength(0);

      const overlapContracts = classifyResult.contracts.filter(c => c.type === ContractType.Overlap);
      expect(overlapContracts.length).toBeGreaterThan(0);

      const overlapDiags = checkResult.diagnostics.filter(d => d.code === 70006);
      expect(overlapDiags.length).toBeGreaterThan(0);
      expect(overlapDiags[0].message).toContain('overlap');
    });
  });

  describe('exhaustiveness contract', () => {
    it('detects unassigned files in exhaustiveness-violation fixture', () => {
      const { classifyResult, checkResult } = runPipeline(
        FIXTURES.EXHAUSTIVENESS_VIOLATION
      );

      expect(classifyResult.errors).toHaveLength(0);

      const exhaustivenessContracts = classifyResult.contracts.filter(c => c.type === ContractType.Exhaustiveness);
      expect(exhaustivenessContracts).toHaveLength(1);

      const unassignedDiags = checkResult.diagnostics.filter(d => d.code === 70007);
      expect(unassignedDiags.length).toBeGreaterThan(0);
      expect(unassignedDiags[0].message).toContain('orphan.ts');
    });
  });

  describe('design system (atomic design + .tsx)', () => {
    it('detects atom→organism violation in design-system-violation fixture', () => {
      const { classifyResult, checkResult } = runPipeline(
        FIXTURES.DESIGN_SYSTEM_VIOLATION
      );

      expect(classifyResult.errors).toHaveLength(0);
      // 6 noDependency pairs + 6 overlap pairs in the atomic design hierarchy (4 members)
      expect(classifyResult.contracts.filter(c => c.type === ContractType.NoDependency)).toHaveLength(6);
      expect(classifyResult.contracts.filter(c => c.type === ContractType.Overlap)).toHaveLength(6);

      // Should detect atoms importing from organisms
      expect(checkResult.violationsFound).toBe(1);
      expect(checkResult.diagnostics[0].code).toBe(70001);

      const violationFiles = checkResult.diagnostics.map(d => d.source.file);
      expect(violationFiles.some(f => f.includes('Button.tsx'))).toBe(true);
    });

    it('passes for design-system-clean fixture with .tsx files', () => {
      const { classifyResult, checkResult } = runPipeline(
        FIXTURES.DESIGN_SYSTEM_CLEAN
      );

      expect(classifyResult.errors).toHaveLength(0);
      expect(classifyResult.contracts.filter(c => c.type === ContractType.NoDependency)).toHaveLength(6);
      expect(checkResult.violationsFound).toBe(0);
    });
  });
});
