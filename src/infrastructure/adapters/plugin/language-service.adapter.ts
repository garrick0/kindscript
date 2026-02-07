import type * as ts from 'typescript';
import {
  LanguageServicePort,
  TSDiagnostic,
  TSCodeFixAction,
} from '../../../application/ports/language-service.port';
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
    _typescript: typeof ts
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

  getOriginalSemanticDiagnostics(fileName: string): TSDiagnostic[] {
    return this.info.languageService.getSemanticDiagnostics(fileName)
      .map(d => this.wrapDiagnostic(d));
  }

  getOriginalCodeFixes(
    fileName: string,
    start: number,
    end: number,
    errorCodes: readonly number[]
  ): TSCodeFixAction[] {
    return this.info.languageService.getCodeFixesAtPosition(
      fileName, start, end, errorCodes as number[],
      {} as ts.FormatCodeSettings,
      {} as ts.UserPreferences,
    ).map(f => ({
      fixName: f.fixName,
      description: f.description,
      changes: f.changes,
    }));
  }

  getRootFileNames(): string[] {
    return this.info.project.getFileNames();
  }

  private wrapDiagnostic(d: ts.Diagnostic): TSDiagnostic {
    return {
      file: d.file?.fileName,
      start: d.start,
      length: d.length,
      messageText: typeof d.messageText === 'string' ? d.messageText : d.messageText.messageText,
      code: d.code,
      category: d.category,
    };
  }
}
