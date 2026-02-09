import { Engine } from '../application/engine';
import { CheckContractsService } from '../application/enforcement/check-contracts/check-contracts.service';
import { createAllPlugins } from '../application/enforcement/check-contracts/plugin-registry';
import { RunPipelineService } from '../application/enforcement/run-pipeline/run-pipeline.service';
import { ClassifyASTService } from '../application/classification/classify-ast/classify-ast.service';
import { ClassifyProjectService } from '../application/classification/classify-project/classify-project.service';
import { TypeScriptAdapter } from './typescript/typescript.adapter';
import { FileSystemAdapter } from './filesystem/filesystem.adapter';
import { ConfigAdapter } from './config/config.adapter';
import { ASTAdapter } from './ast/ast.adapter';

/**
 * Creates a fully-wired Engine with all shared adapters and services.
 *
 * Both CLI and plugin composition roots call this, then layer on
 * their own app-specific wiring (DiagnosticPort, LanguageServicePort, etc.).
 */
export function createEngine(): Engine {
  const ts = new TypeScriptAdapter();
  const fs = new FileSystemAdapter();
  const config = new ConfigAdapter(fs);
  const ast = new ASTAdapter();

  const plugins = createAllPlugins();
  const classifyAST = new ClassifyASTService(ast, plugins);
  const classifyProject = new ClassifyProjectService(config, fs, ts, classifyAST);
  const checkContracts = new CheckContractsService(plugins, ts);
  const runPipeline = new RunPipelineService(classifyProject, checkContracts, fs);

  return { classifyProject, checkContracts, runPipeline, plugins, fs, ts };
}
