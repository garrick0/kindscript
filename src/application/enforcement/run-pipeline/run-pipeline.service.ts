import { RunPipelineUseCase, PipelineRequest, PipelineResponse } from './run-pipeline.use-case';
import { ClassifyProjectUseCase } from '../../classification/classify-project/classify-project.use-case';
import { CheckContractsUseCase } from '../check-contracts/check-contracts.use-case';
import { FileSystemPort } from '../../ports/filesystem.port';
import { resolveSymbolFiles } from '../../services/resolve-symbol-files';

/**
 * Runs the full classify → resolve → check pipeline.
 *
 * This encapsulates the 3-step orchestration that both CLI and plugin need:
 * 1. Classify the project (find Kinds, instances, contracts)
 * 2. Resolve symbol locations to file listings
 * 3. Check contracts against the resolved project
 *
 * Apps layer only handles presentation: formatting diagnostics for
 * terminal output (CLI) or filtering for a specific file (plugin).
 */
export class RunPipelineService implements RunPipelineUseCase {
  constructor(
    private readonly classifyProject: ClassifyProjectUseCase,
    private readonly checkContracts: CheckContractsUseCase,
    private readonly fsPort: FileSystemPort,
  ) {}

  execute(request: PipelineRequest): PipelineResponse {
    const result = this.classifyProject.execute({ projectRoot: request.projectRoot });
    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    if (result.contracts.length === 0) {
      return {
        ok: true,
        diagnostics: [],
        contractsChecked: 0,
        filesAnalyzed: 0,
        classificationErrors: result.classificationErrors,
      };
    }

    const resolvedFiles = resolveSymbolFiles(result.symbols, this.fsPort);
    const checkResult = this.checkContracts.execute({
      symbols: result.symbols,
      contracts: result.contracts,
      config: result.config,
      program: result.program,
      resolvedFiles,
    });

    return {
      ok: true,
      diagnostics: checkResult.diagnostics,
      contractsChecked: checkResult.contractsChecked,
      filesAnalyzed: checkResult.filesAnalyzed,
      classificationErrors: result.classificationErrors,
    };
  }
}
