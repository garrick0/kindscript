import type * as ts from 'typescript';
import { LanguageServicePort } from '../ports/language-service.port';
import { Program } from '../../../domain/entities/program';

/**
 * Real implementation of LanguageServicePort for the plugin context.
 *
 * Wraps ts.server.PluginCreateInfo to provide the language service
 * operations needed by the plugin use cases.
 */
export class LanguageServiceAdapter implements LanguageServicePort {
  constructor(
    private readonly info: ts.server.PluginCreateInfo,
  ) {}

  getProjectRoot(): string {
    return this.info.project.getCurrentDirectory();
  }

  getProgram(): Program | undefined {
    const tsProgram = this.info.languageService.getProgram();
    if (!tsProgram) return undefined;
    const rootFiles = [...tsProgram.getRootFileNames()];
    return new Program(rootFiles, {}, tsProgram);
  }
}
