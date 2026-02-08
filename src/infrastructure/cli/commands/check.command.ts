import { CheckContractsUseCase } from '../../../application/use-cases/check-contracts/check-contracts.use-case';
import { ClassifyProjectUseCase } from '../../../application/use-cases/classify-project/classify-project.use-case';
import { DiagnosticPort } from '../../../application/ports/diagnostic.port';
import { FileSystemPort } from '../../../application/ports/filesystem.port';
import { resolveSymbolFiles } from '../../../application/services/resolve-symbol-files';

/**
 * CLI command: ksc check
 *
 * Thin adapter: parses arguments, delegates to ClassifyProjectService
 * and CheckContractsService, formats output.
 */
export class CheckCommand {
  constructor(
    private readonly checkContracts: CheckContractsUseCase,
    private readonly classifyProject: ClassifyProjectUseCase,
    private readonly diagnosticPort: DiagnosticPort,
    private readonly fsPort: FileSystemPort,
  ) {}

  execute(projectPath: string): number {
    const result = this.classifyProject.execute({ projectRoot: projectPath });

    if (!result.ok) {
      this.diagnosticPort.reportDiagnostics([]);
      process.stderr.write(`Error: ${result.error}\n`);
      return 1;
    }

    for (const error of result.classificationErrors) {
      process.stderr.write(`Classification error: ${error}\n`);
    }

    if (result.contracts.length === 0) {
      process.stderr.write('No contracts found in definition files.\n');
      return 0;
    }

    const checkResult = this.checkContracts.execute({
      symbols: result.symbols,
      contracts: result.contracts,
      config: result.config,
      program: result.program,
      resolvedFiles: resolveSymbolFiles(result.symbols, this.fsPort),
    });

    if (checkResult.diagnostics.length > 0) {
      this.diagnosticPort.reportDiagnostics(checkResult.diagnostics);
      return 1;
    }

    process.stderr.write(
      `All architectural contracts satisfied. (${checkResult.contractsChecked} contracts, ${checkResult.filesAnalyzed} files)\n`
    );
    return 0;
  }
}
