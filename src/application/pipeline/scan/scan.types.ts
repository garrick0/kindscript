import { SourceFile, TypeChecker } from '../../ports/typescript.port';
import { KindDefinitionView, InstanceDeclarationView } from '../views';

/**
 * Request DTO for the Scanner stage.
 */
export interface ScanRequest {
  sourceFiles: SourceFile[];
  checker: TypeChecker;
}

/**
 * An instance declaration paired with its source file name,
 * so the parser can derive the root location.
 */
export interface ScannedInstance {
  view: InstanceDeclarationView;
  sourceFileName: string;
}

/**
 * Output of the Scanner stage.
 *
 * Raw views extracted from external sources (TypeScript AST).
 * No domain entities are created at this stage.
 */
export interface ScanResult {
  kindDefs: Map<string, KindDefinitionView>;
  instances: ScannedInstance[];
  errors: string[];
}

export interface ScanUseCase {
  execute(request: ScanRequest): ScanResult;
}
