import * as path from 'path';
import { CheckCommand } from '../../src/infrastructure/cli/commands/check.command';
import { CheckContractsService } from '../../src/application/use-cases/check-contracts/check-contracts.service';
import { ClassifyASTService } from '../../src/application/use-cases/classify-ast/classify-ast.service';
import { ClassifyProjectService } from '../../src/application/use-cases/classify-project/classify-project.service';
import { TypeScriptAdapter } from '../../src/infrastructure/adapters/typescript/typescript.adapter';
import { FileSystemAdapter } from '../../src/infrastructure/adapters/filesystem/filesystem.adapter';
import { ConfigAdapter } from '../../src/infrastructure/adapters/config/config.adapter';
import { CLIDiagnosticAdapter } from '../../src/infrastructure/adapters/cli/cli-diagnostic.adapter';
import { ASTAdapter } from '../../src/infrastructure/adapters/ast/ast.adapter';

const FIXTURES_DIR = path.resolve(__dirname, '..', 'integration', 'fixtures');

describe('CLI E2E Tests', () => {
  let captured: string[];
  let stderrCaptured: string[];

  beforeEach(() => {
    captured = [];
    stderrCaptured = [];

    // Capture process.stderr.write
    jest.spyOn(process.stderr, 'write').mockImplementation((chunk: string | Uint8Array) => {
      stderrCaptured.push(String(chunk));
      return true;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function createCheckCommand(): CheckCommand {
    const tsAdapter = new TypeScriptAdapter();
    const fsAdapter = new FileSystemAdapter();
    const configAdapter = new ConfigAdapter();
    const diagnosticAdapter = new CLIDiagnosticAdapter((msg) => captured.push(msg));
    const astAdapter = new ASTAdapter();

    const classifyAST = new ClassifyASTService(astAdapter);
    const classifyProject = new ClassifyProjectService(configAdapter, fsAdapter, tsAdapter, classifyAST);
    const checkContracts = new CheckContractsService(tsAdapter, fsAdapter);

    return new CheckCommand(checkContracts, classifyProject, diagnosticAdapter);
  }

  it('returns exit code 1 for project with violations', () => {
    const cmd = createCheckCommand();
    const fixturePath = path.join(FIXTURES_DIR, 'clean-arch-violation');

    const exitCode = cmd.execute(fixturePath);

    expect(exitCode).toBe(1);
    // Should have reported violations
    const allOutput = captured.join('\n');
    expect(allOutput).toContain('KS70001');
    expect(allOutput).toContain('violation');
  });

  it('returns exit code 0 for clean project', () => {
    const cmd = createCheckCommand();
    const fixturePath = path.join(FIXTURES_DIR, 'clean-arch-valid');

    const exitCode = cmd.execute(fixturePath);

    expect(exitCode).toBe(0);
  });

  it('returns exit code 1 when no kindscript.json exists', () => {
    const cmd = createCheckCommand();

    const exitCode = cmd.execute('/nonexistent/path');

    expect(exitCode).toBe(1);
    const allStderr = stderrCaptured.join('');
    expect(allStderr).toContain('No kindscript.json');
  });

  it('reports violation details including file path', () => {
    const cmd = createCheckCommand();
    const fixturePath = path.join(FIXTURES_DIR, 'clean-arch-violation');

    cmd.execute(fixturePath);

    const allOutput = captured.join('\n');
    expect(allOutput).toContain('service.ts');
    expect(allOutput).toContain('Forbidden dependency');
  });
});
