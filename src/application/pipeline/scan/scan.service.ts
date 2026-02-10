import { ScanRequest, ScanResult, ScannedInstance, ScannedTypeKindInstance, ScanUseCase } from './scan.types';
import { ASTViewPort } from '../../ports/ast.port';
import { KindDefinitionView, TypeKindDefinitionView } from '../views';

/**
 * KindScript Scanner — reads the TypeScript AST to extract raw views.
 *
 * This is the first pipeline stage. It reads external data sources
 * (TypeScript's AST via the ASTViewPort) and extracts raw structured
 * views (KindDefinitionView, InstanceDeclarationView). It does NOT
 * create domain entities or validate anything.
 *
 * Uses two-pass scanning:
 * - Pass 1: Kind defs, TypeKind defs, Instance declarations
 * - Pass 2: TypeKind instances (needs known TypeKind names from Pass 1)
 *
 * Analogous to TypeScript's Scanner which reads source characters
 * and produces tokens.
 */
export class ScanService implements ScanUseCase {
  constructor(private readonly astPort: ASTViewPort) {}

  execute(request: ScanRequest): ScanResult {
    const kindDefs = new Map<string, KindDefinitionView>();
    const typeKindDefs = new Map<string, TypeKindDefinitionView>();
    const instances: ScannedInstance[] = [];
    const errors: string[] = [];

    // Pass 1: Kind defs, TypeKind defs, Instance declarations
    for (const sourceFile of request.sourceFiles) {
      const kindResult = this.astPort.getKindDefinitions(sourceFile, request.checker);
      errors.push(...kindResult.errors);
      for (const view of kindResult.data) {
        kindDefs.set(view.typeName, view);

        // If this Kind has `wraps` in its config, also register it as a TypeKind def
        if (view.wrapsTypeName) {
          typeKindDefs.set(view.typeName, {
            typeName: view.typeName,
            kindNameLiteral: view.kindNameLiteral,
            wrappedTypeName: view.wrapsTypeName,
            constraints: view.constraints,
          });
        }
      }

      const instanceResult = this.astPort.getInstanceDeclarations(sourceFile, request.checker);
      errors.push(...instanceResult.errors);
      for (const view of instanceResult.data) {
        instances.push({ view, sourceFileName: sourceFile.fileName });
      }

      const tkResult = this.astPort.getTypeKindDefinitions(sourceFile, request.checker);
      errors.push(...tkResult.errors);
      for (const view of tkResult.data) {
        typeKindDefs.set(view.typeName, view);
      }
    }

    // Pass 2: TypeKind instances (needs known TypeKind names from Pass 1)
    const typeKindInstances: ScannedTypeKindInstance[] = [];
    const typeKindNames = new Set(typeKindDefs.keys());
    if (typeKindNames.size > 0) {
      for (const sourceFile of request.sourceFiles) {
        const tkiResult = this.astPort.getTypeKindInstances(
          sourceFile, request.checker, typeKindNames
        );
        errors.push(...tkiResult.errors);
        for (const inst of tkiResult.data) {
          typeKindInstances.push({ view: inst, sourceFileName: sourceFile.fileName });
        }
      }
    }

    return { kindDefs, instances, typeKindDefs, typeKindInstances, errors };
  }
}
