import { CLIDiagnosticAdapter } from '../../src/infrastructure/adapters/cli/cli-diagnostic.adapter';
import { Diagnostic } from '../../src/domain/entities/diagnostic';
import { ContractType } from '../../src/domain/types/contract-type';

describe('CLIDiagnosticAdapter', () => {
  let captured: string[];
  let adapter: CLIDiagnosticAdapter;

  beforeEach(() => {
    captured = [];
    adapter = new CLIDiagnosticAdapter((msg) => captured.push(msg));
  });

  describe('formatDiagnostic', () => {
    it('formats diagnostic in TypeScript style', () => {
      const diag = new Diagnostic(
        'Forbidden dependency: src/domain/service.ts -> src/infrastructure/db.ts',
        70001,
        'src/domain/service.ts',
        5,
        0
      );

      const formatted = adapter.formatDiagnostic(diag);
      expect(formatted).toBe(
        'src/domain/service.ts:5:0 - error KS70001: Forbidden dependency: src/domain/service.ts -> src/infrastructure/db.ts'
      );
    });

    it('includes contract reference when present', () => {
      const diag = new Diagnostic(
        'Forbidden dependency',
        70001,
        'src/domain/service.ts',
        5,
        0,
        {
          contractName: 'no-domain-to-infra',
          contractType: ContractType.NoDependency,
          location: 'kindscript.json',
        }
      );

      const formatted = adapter.formatDiagnostic(diag);
      expect(formatted).toContain("Contract 'no-domain-to-infra'");
      expect(formatted).toContain('kindscript.json');
    });
  });

  describe('formatWithContext', () => {
    it('shows the offending source line with a caret pointer', () => {
      const diag = new Diagnostic(
        'Forbidden dependency',
        70001,
        'src/domain/service.ts',
        2,
        7
      );

      const sourceText = 'export class Service {\n  import { Db } from "../infrastructure/db";\n}';
      const formatted = adapter.formatWithContext(diag, sourceText);

      expect(formatted).toContain('2 |   import { Db } from "../infrastructure/db";');
      expect(formatted).toContain('^');
    });
  });

  describe('reportDiagnostics', () => {
    it('writes each diagnostic to output', () => {
      const diags = [
        new Diagnostic('Error 1', 70001, 'file1.ts', 1, 0),
        new Diagnostic('Error 2', 70001, 'file2.ts', 3, 0),
      ];

      adapter.reportDiagnostics(diags);

      expect(captured).toHaveLength(4); // 2 diagnostics + empty line + summary
      expect(captured[0]).toContain('Error 1');
      expect(captured[1]).toContain('Error 2');
      expect(captured[3]).toContain('2 architectural violation(s)');
    });

    it('does not write summary when no diagnostics', () => {
      adapter.reportDiagnostics([]);
      expect(captured).toHaveLength(0);
    });
  });
});
