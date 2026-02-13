import type * as ts from 'typescript';
import { LanguageServiceAdapter } from './adapters/language-service.adapter.js';
import { GetPluginDiagnosticsUseCase } from './use-cases/get-plugin-diagnostics/get-plugin-diagnostics.use-case.js';
import { GetPluginCodeFixesUseCase } from './use-cases/get-plugin-code-fixes/get-plugin-code-fixes.use-case.js';
import { convertToTSDiagnostic, convertToCodeFixAction } from './diagnostic-converter.js';

/**
 * Creates a proxied ts.LanguageService that intercepts diagnostic
 * and code fix methods to append KindScript results.
 *
 * All interceptions are wrapped in try/catch. A plugin must NEVER
 * crash tsserver. On any error, we silently return only the original
 * TypeScript results.
 *
 * This is the standard pattern used by Angular Language Service
 * and all major TypeScript plugins.
 */
export function createLanguageServiceProxy(
  info: ts.server.PluginCreateInfo,
  typescript: typeof ts,
  lsAdapter: LanguageServiceAdapter,
  diagnosticsService: GetPluginDiagnosticsUseCase,
  codeFixesService: GetPluginCodeFixesUseCase
): ts.LanguageService {
  const proxy = Object.create(null) as ts.LanguageService;
  const oldService = info.languageService;
  const logger = info.project.projectService.logger;

  // Proxy all methods from the original service (including prototype chain)
  const keys = new Set<string>();
  for (let obj: object | null = oldService; obj; obj = Object.getPrototypeOf(obj)) {
    for (const k of Object.getOwnPropertyNames(obj)) {
      keys.add(k);
    }
  }

  for (const k of keys) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const method = (oldService as any)[k];
    if (typeof method === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (proxy as any)[k] = (...args: unknown[]) =>
        method.apply(oldService, args);
    }
  }

  // Intercept getSemanticDiagnostics
  proxy.getSemanticDiagnostics = (fileName: string): ts.Diagnostic[] => {
    const tsDiags = oldService.getSemanticDiagnostics(fileName);

    try {
      const projectRoot = lsAdapter.getProjectRoot();
      const result = diagnosticsService.execute({ fileName, projectRoot });

      const program = lsAdapter.getProgram();
      if (!program) return tsDiags;

      const ksDiags = result.diagnostics.map(d =>
        convertToTSDiagnostic(d, program, typescript)
      );

      return [...tsDiags, ...ksDiags];
    } catch (e: unknown) {
      logger.info(`[kindscript] Error in getSemanticDiagnostics: ${e}`);
      return tsDiags;
    }
  };

  // Intercept getCodeFixesAtPosition
  proxy.getCodeFixesAtPosition = (
    fileName: string,
    start: number,
    end: number,
    errorCodes: readonly number[],
    formatOptions: ts.FormatCodeSettings,
    preferences: ts.UserPreferences
  ): readonly ts.CodeFixAction[] => {
    const tsFixes = oldService.getCodeFixesAtPosition(
      fileName, start, end, errorCodes, formatOptions, preferences
    );

    try {
      const projectRoot = lsAdapter.getProjectRoot();
      const result = codeFixesService.execute({
        fileName, start, end, errorCodes, projectRoot,
      });

      const ksFixes = result.fixes.map(f =>
        convertToCodeFixAction(f)
      );

      return [...tsFixes, ...ksFixes];
    } catch (e: unknown) {
      logger.info(`[kindscript] Error in getCodeFixesAtPosition: ${e}`);
      return tsFixes;
    }
  };

  return proxy;
}
