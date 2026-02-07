import { ClassifyASTRequest, ClassifyASTResponse } from './classify-ast.types';

/**
 * Use case interface for classifying TypeScript AST into architectural symbols.
 *
 * This use case reads kind definition files and extracts:
 * - Kind definitions (e.g., `kind Layer = { ... }`)
 * - Instances (e.g., `const domain: Layer = { ... }`)
 * - Contracts (e.g., `noDependency(domain, infrastructure)`)
 *
 * This is the "Binder" phase from ANALYSIS_COMPILER_ARCHITECTURE_V4.md Part 4.1.
 *
 * In M0, this is just an interface.
 * In M2, we implement it with real AST walking logic.
 */
export interface ClassifyASTUseCase {
  execute(request: ClassifyASTRequest): ClassifyASTResponse;
}
