import { ClassifyASTRequest, ClassifyASTResponse } from './classify-ast.types';

/**
 * Use case interface for classifying TypeScript AST into architectural symbols.
 *
 * This use case reads kind definition files and extracts:
 * - Kind definitions (e.g., `kind Layer = { ... }`)
 * - Instances (e.g., `const domain: Layer = { ... }`)
 * - Contracts (e.g., `noDependency(domain, infrastructure)`)
 *
 * This is the "Binder" phase — implemented in ClassifyASTService.
 */
export interface ClassifyASTUseCase {
  execute(request: ClassifyASTRequest): ClassifyASTResponse;
}
