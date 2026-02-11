import { SourceFile, TypeChecker } from '../../ports/typescript.port';
import { KindDefinitionView, InstanceDeclarationView, TaggedExportView } from '../views';

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
 * A tagged export (InstanceOf<K>) paired with its source file name.
 */
export interface ScannedTaggedExport {
  view: TaggedExportView;
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
  taggedExports: ScannedTaggedExport[];
  errors: string[];
}

export interface ScanUseCase {
  execute(request: ScanRequest): ScanResult;
}
