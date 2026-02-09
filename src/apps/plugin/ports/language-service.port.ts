import { Program } from '../../../domain/entities/program';

/**
 * Opaque wrapper around ts.Diagnostic for the domain boundary.
 *
 * Mirrors the shape of TypeScript diagnostics without importing
 * the TypeScript API into the application layer.
 */
export interface TSDiagnostic {
  file?: string;
  start?: number;
  length?: number;
  messageText: string;
  code: number;
  category: number;
}

/**
 * Opaque wrapper around ts.CodeFixAction for the domain boundary.
 */
export interface TSCodeFixAction {
  fixName: string;
  description: string;
  changes: unknown[];
}

/**
 * Port defining how KindScript interacts with the TypeScript
 * language service in the plugin context.
 *
 * This is separate from TypeScriptPort because it encapsulates
 * plugin-specific operations (project root discovery, original
 * diagnostic forwarding, etc.) that don't apply to the CLI context.
 *
 * The real adapter wraps ts.server.PluginCreateInfo;
 * a mock enables unit testing without tsserver.
 */
export interface LanguageServicePort {
  /** Get the project root directory */
  getProjectRoot(): string;

  /** Get the current ts.Program from the language service */
  getProgram(): Program | undefined;

  /** Get the original semantic diagnostics for a file */
  getOriginalSemanticDiagnostics(fileName: string): TSDiagnostic[];

  /** Get the original code fixes for a position */
  getOriginalCodeFixes(
    fileName: string,
    start: number,
    end: number,
    errorCodes: readonly number[]
  ): TSCodeFixAction[];

  /** Get all root file paths in the current project */
  getRootFileNames(): string[];
}
