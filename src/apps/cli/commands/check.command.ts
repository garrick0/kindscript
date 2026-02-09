import { RunPipelineUseCase } from '../../../application/enforcement/run-pipeline/run-pipeline.use-case';
import { DiagnosticPort } from '../ports/diagnostic.port';
import { ConsolePort } from '../ports/console.port';

/**
 * CLI command: ksc check
 *
 * Thin presentation layer: delegates to RunPipelineService,
 * formats output via DiagnosticPort and ConsolePort, returns exit code.
 */
export class CheckCommand {
  constructor(
    private readonly runPipeline: RunPipelineUseCase,
    private readonly diagnosticPort: DiagnosticPort,
    private readonly console: ConsolePort,
  ) {}

  execute(projectPath: string): number {
    const result = this.runPipeline.execute({ projectRoot: projectPath });

    if (!result.ok) {
      this.diagnosticPort.reportDiagnostics([]);
      this.console.error(`Error: ${result.error}`);
      return 1;
    }

    for (const error of result.classificationErrors) {
      this.console.error(`Classification error: ${error}`);
    }

    if (result.contractsChecked === 0) {
      this.console.info('No contracts found in definition files.');
      return 0;
    }

    if (result.diagnostics.length > 0) {
      this.diagnosticPort.reportDiagnostics(result.diagnostics);
      return 1;
    }

    this.console.info(
      `All architectural contracts satisfied. (${result.contractsChecked} contracts, ${result.filesAnalyzed} files)`
    );
    return 0;
  }
}
