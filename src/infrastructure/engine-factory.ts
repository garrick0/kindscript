import { Engine } from '../application/engine.js';
import { ScanService } from '../application/pipeline/scan/scan.service.js';
import { ParseService } from '../application/pipeline/parse/parse.service.js';
import { BindService } from '../application/pipeline/bind/bind.service.js';
import { CheckerService } from '../application/pipeline/check/checker.service.js';
import { PipelineService } from '../application/pipeline/pipeline.service.js';
import { ProgramFactory } from '../application/pipeline/program.js';
import { createAllPlugins } from '../application/pipeline/plugins/plugin-registry.js';
import { CarrierResolver } from '../application/pipeline/carrier/carrier-resolver.js';
import { TypeScriptAdapter } from './typescript/typescript.adapter.js';
import { FileSystemAdapter } from './filesystem/filesystem.adapter.js';
import { ConfigAdapter } from './config/config.adapter.js';
import { ASTAdapter } from './ast/ast.adapter.js';

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
