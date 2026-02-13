import { ScanRequest, ScanResult, ScannedInstance, ScannedAnnotatedExport, ScanUseCase } from './scan.types.js';
import { ASTViewPort } from '../../ports/ast.port.js';
import { KindDefinitionView } from '../views.js';

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
 * - Pass 2: Annotated exports (needs known wrapped Kind names from Pass 1)
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

    // Extract wrapped Kind names from Pass 1 for direct type annotation detection
    const wrappedKindNames = new Set<string>();
    for (const [name, kindDef] of kindDefs) {
      if (kindDef.wrapsTypeName) {
        wrappedKindNames.add(name);
      }
    }

    // Pass 2: Annotated exports (direct Kind type annotations)
    const annotatedExports: ScannedAnnotatedExport[] = [];

    for (const sourceFile of request.sourceFiles) {
      const annotatedResult = this.astPort.getAnnotatedExports(sourceFile, request.checker, wrappedKindNames);
      errors.push(...annotatedResult.errors);
      for (const annotated of annotatedResult.data) {
        annotatedExports.push({ view: annotated, sourceFileName: sourceFile.fileName });
      }
    }

    return { kindDefs, instances, annotatedExports, errors };
  }
}
