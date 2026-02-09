import * as path from 'path';
import { CheckCommand } from '../../../src/apps/cli/commands/check.command';
import { createEngine } from '../../../src/infrastructure/engine-factory';
import { CLIDiagnosticAdapter } from '../../../src/apps/cli/adapters/cli-diagnostic.adapter';
import { ConsolePort } from '../../../src/apps/cli/ports/console.port';

const FIXTURES_DIR = path.resolve(__dirname, '..', '..', 'integration', 'fixtures');

function createMockConsole(): ConsolePort & { messages: string[] } {
  const messages: string[] = [];
  return {
    messages,
    info(msg: string) { messages.push(msg); },
    error(msg: string) { messages.push(msg); },
  };
}

describe('CLI E2E Tests', () => {
  let captured: string[];

  beforeEach(() => {
    captured = [];
  });

  function createCheckCommand(mockConsole?: ConsolePort): CheckCommand {
    const engine = createEngine();
    const diagnosticAdapter = new CLIDiagnosticAdapter((msg) => captured.push(msg));
    const console = mockConsole ?? createMockConsole();
    return new CheckCommand(engine.pipeline, diagnosticAdapter, console);
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

  it('returns exit code 1 when no TypeScript files found', () => {
    const mockConsole = createMockConsole();
    const cmd = createCheckCommand(mockConsole);

    const exitCode = cmd.execute('/nonexistent/path');

    expect(exitCode).toBe(1);
    const allConsole = mockConsole.messages.join('');
    expect(allConsole).toContain('No TypeScript files found');
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
