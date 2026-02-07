import { ArchSymbol } from '../../../domain/entities/arch-symbol';
import { Contract } from '../../../domain/entities/contract';
import { Program } from '../../../domain/entities/program';
import { KindScriptConfig } from '../../ports/config.port';

/**
 * Request DTO for the ClassifyProject use case.
 */
export interface ClassifyProjectRequest {
  /** Absolute path to the project root */
  projectRoot: string;
}

/**
 * Successful result of project classification.
 */
export interface ClassifyProjectSuccess {
  ok: true;

  /** Architectural symbols extracted from definition files */
  symbols: ArchSymbol[];

  /** Contracts extracted from definition files */
  contracts: Contract[];

  /** Classification errors (non-fatal) */
  classificationErrors: string[];

  /** Maps instance variable names to their Kind type names */
  instanceTypeNames: Map<string, string>;

  /** The TypeScript program created during classification */
  program: Program;

  /** Root TypeScript files in the project */
  rootFiles: string[];

  /** The parsed kindscript.json config */
  config: KindScriptConfig;

  /** Warnings from package resolution */
  packageWarnings: string[];
}

/**
 * Error result when project classification fails.
 */
export interface ClassifyProjectError {
  ok: false;

  /** Human-readable error description */
  error: string;
}

/**
 * Discriminated union result type.
 */
export type ClassifyProjectResult = ClassifyProjectSuccess | ClassifyProjectError;
