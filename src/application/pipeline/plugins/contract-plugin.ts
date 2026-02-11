import { TypeScriptPort, TypeChecker, SourceFile } from '../../ports/typescript.port';
import { ArchSymbol } from '../../../domain/entities/arch-symbol';
import { Contract } from '../../../domain/entities/contract';
import { Diagnostic } from '../../../domain/entities/diagnostic';
import { Program } from '../../../domain/entities/program';
import { ContractType } from '../../../domain/types/contract-type';
import { ConstraintProvider } from './constraint-provider';
import type { OwnershipTree } from '../ownership-tree';

export interface CheckContext {
  tsPort: TypeScriptPort;
  program: Program;
  checker: TypeChecker;
  resolvedFiles: Map<string, string[]>;
  containerFiles?: Map<string, string[]>;
  ownershipTree?: OwnershipTree;
  declarationOwnership?: Map<string, Map<string, string>>;
}

export interface CheckResult {
  diagnostics: Diagnostic[];
  filesAnalyzed: number;
}

/**
 * Resolve file paths to SourceFile objects, filtering out any that can't be loaded.
 */
export function getSourceFilesForPaths(
  ctx: CheckContext,
  files: string[],
): Array<{ file: string; sourceFile: SourceFile }> {
  const results: Array<{ file: string; sourceFile: SourceFile }> = [];
  for (const file of files) {
    const sf = ctx.tsPort.getSourceFile(ctx.program, file);
    if (sf) results.push({ file, sourceFile: sf });
  }
  return results;
}

/**
 * Full contract plugin interface.
 *
 * Extends ConstraintProvider (used by classification) with enforcement
 * capabilities: type, diagnosticCode, validate, and check.
 */
export interface ContractPlugin extends ConstraintProvider {
  readonly type: ContractType;
  readonly diagnosticCode: number;

  /** Validate contract args */
  validate(args: ArchSymbol[]): string | null;

  /** Check a contract against the project */
  check(contract: Contract, ctx: CheckContext): CheckResult;

  /** Optional code fix metadata for IDE quick-fix integration */
  codeFix?: {
    fixName: string;
    description: string;
  };
}
