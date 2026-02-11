import { Engine } from '../application/engine';
import { ScanService } from '../application/pipeline/scan/scan.service';
import { ParseService } from '../application/pipeline/parse/parse.service';
import { BindService } from '../application/pipeline/bind/bind.service';
import { CheckerService } from '../application/pipeline/check/checker.service';
import { PipelineService } from '../application/pipeline/pipeline.service';
import { ProgramFactory } from '../application/pipeline/program';
import { createAllPlugins } from '../application/pipeline/plugins/plugin-registry';
import { CarrierResolver } from '../application/pipeline/carrier/carrier-resolver';
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

  const programFactory = new ProgramFactory(config, fs, ts);
  const carrierResolver = new CarrierResolver(fs);
  const scanner = new ScanService(ast);
  const parser = new ParseService();
  const binder = new BindService(plugins, carrierResolver);
  const checker = new CheckerService(plugins, ts);
  const pipeline = new PipelineService(programFactory, fs, scanner, parser, binder, checker);

  return { pipeline, plugins };
}
