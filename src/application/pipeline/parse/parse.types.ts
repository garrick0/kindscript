import { ArchSymbol } from '../../../domain/entities/arch-symbol';
import { KindDefinitionView } from '../views';
import { ScanResult } from '../scan/scan.types';

/**
 * Output of the Parser stage.
 *
 * A structured domain model (ArchSymbol tree + resolved files)
 * built from the scanner's raw views. This is KindScript's
 * equivalent of an AST.
 */
export interface ParseResult {
  /** All architectural symbols (Kind + Instance + Member) */
  symbols: ArchSymbol[];

  /** Kind definitions, passed through for the Binder stage */
  kindDefs: Map<string, KindDefinitionView>;

  /** Maps kindName → instance ArchSymbols (for Binder) */
  instanceSymbols: Map<string, ArchSymbol[]>;

  /** Pre-resolved mapping from symbol location → files on disk */
  resolvedFiles: Map<string, string[]>;

  /** Maps instance variable name → Kind type name */
  instanceTypeNames: Map<string, string>;

  /** Errors encountered during parsing */
  errors: string[];
}

export interface ParseUseCase {
  execute(scanResult: ScanResult): ParseResult;
}
