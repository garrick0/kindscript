import { SourceFile, TypeChecker } from '../../ports/typescript.port.js';
import { KindDefinitionView, InstanceDeclarationView, AnnotatedExportView } from '../views.js';

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
 * An annotated export paired with its source file name.
 */
export interface ScannedAnnotatedExport {
  view: AnnotatedExportView;
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
  annotatedExports: ScannedAnnotatedExport[];
  errors: string[];
}

export interface ScanUseCase {
  execute(request: ScanRequest): ScanResult;
}
