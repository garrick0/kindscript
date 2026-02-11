import { ScanRequest, ScanResult, ScannedInstance, ScannedTaggedExport, ScanUseCase } from './scan.types';
import { ASTViewPort } from '../../ports/ast.port';
import { KindDefinitionView } from '../views';

/**
 * KindScript Scanner — reads the TypeScript AST to extract raw views.
 *
 * This is the first pipeline stage. It reads external data sources
 * (TypeScript's AST via the ASTViewPort) and extracts raw structured
 * views (KindDefinitionView, InstanceDeclarationView). It does NOT
 * create domain entities or validate anything.
 *
 * Uses two-pass scanning:
 * - Pass 1: Kind defs, Instance declarations
 * - Pass 2: InstanceOf<K> tagged exports (needs known wrapped Kind names from Pass 1)
 *
 * Analogous to TypeScript's Scanner which reads source characters
 * and produces tokens.
 */
export class ScanService implements ScanUseCase {
  constructor(private readonly astPort: ASTViewPort) {}

  execute(request: ScanRequest): ScanResult {
    const kindDefs = new Map<string, KindDefinitionView>();
    const instances: ScannedInstance[] = [];
    const errors: string[] = [];

    // Pass 1: Kind defs, Instance declarations
    for (const sourceFile of request.sourceFiles) {
      const kindResult = this.astPort.getKindDefinitions(sourceFile, request.checker);
      errors.push(...kindResult.errors);
      for (const view of kindResult.data) {
        kindDefs.set(view.typeName, view);
      }

      const instanceResult = this.astPort.getInstanceDeclarations(sourceFile, request.checker);
      errors.push(...instanceResult.errors);
      for (const view of instanceResult.data) {
        instances.push({ view, sourceFileName: sourceFile.fileName });
      }
    }

    // Pass 2: InstanceOf<K> tagged exports
    const taggedExports: ScannedTaggedExport[] = [];

    for (const sourceFile of request.sourceFiles) {
      const taggedResult = this.astPort.getTaggedExports(sourceFile, request.checker);
      errors.push(...taggedResult.errors);
      for (const tagged of taggedResult.data) {
        taggedExports.push({ view: tagged, sourceFileName: sourceFile.fileName });
      }
    }

    return { kindDefs, instances, taggedExports, errors };
  }
}
