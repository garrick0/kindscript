import type * as ts from 'typescript';
import { Diagnostic } from '../../domain/entities/diagnostic';
import { Program } from '../../domain/entities/program';
import { PluginCodeFix } from './use-cases/get-plugin-code-fixes/get-plugin-code-fixes.types';

/**
 * Convert a KindScript domain Diagnostic to a TypeScript ts.Diagnostic.
 *
 * Maps line/column to character offset using the source file's line starts,
 * and sets the source to 'kindscript' for identification in the editor.
 */
export function convertToTSDiagnostic(
  diagnostic: Diagnostic,
  program: Program,
  typescript: typeof ts
): ts.Diagnostic {
  // Invariant: program.handle is always a ts.Program in the plugin context.
  // Safe even if undefined — optional chaining on getSourceFile() handles that.
  const tsProgram = program.handle as ts.Program;
  const sourceFile = diagnostic.source.file ? tsProgram?.getSourceFile(diagnostic.source.file) : undefined;

  let start: number | undefined;
  let length: number | undefined;

  if (sourceFile && diagnostic.source.line > 0) {
    const lineStarts = sourceFile.getLineStarts();
    const lineIndex = diagnostic.source.line - 1;
    if (lineIndex < lineStarts.length) {
      start = lineStarts[lineIndex] + diagnostic.source.column;
      // Length: span the entire line content for visibility
      const lineEnd = lineIndex + 1 < lineStarts.length
        ? lineStarts[lineIndex + 1]
        : sourceFile.getEnd();
      const lineText = sourceFile.text.substring(lineStarts[lineIndex], lineEnd);
      length = lineText.trimEnd().length;
    }
  }

  return {
    file: sourceFile,
    start,
    length,
    messageText: diagnostic.message,
    category: typescript.DiagnosticCategory.Error,
    code: diagnostic.code,
    source: 'kindscript',
  };
}

/**
 * Convert a KindScript PluginCodeFix to a TypeScript ts.CodeFixAction.
 *
 * M5 provides description-only fixes (no auto-applied text changes).
 * M5.1 can add actual ts.TextChanges for auto-fix support.
 */
export function convertToCodeFixAction(
  fix: PluginCodeFix,
): ts.CodeFixAction {
  return {
    fixName: fix.fixName,
    description: fix.description,
    changes: [],
    fixId: fix.fixName,
    fixAllDescription: undefined,
  };
}
