import { ASTViewPort } from '../../../src/application/ports/ast.port';
import {
  ASTExtractionResult, TypeNodeView,
  KindDefinitionView, InstanceDeclarationView,
  AnnotatedExportView, DeclarationView,
} from '../../../src/application/pipeline/views';
import { SourceFile, TypeChecker } from '../../../src/application/ports/typescript.port';

/**
 * Mock implementation of ASTViewPort for testing the Scanner stage.
 *
 * Provides a fluent API for building mock domain views:
 * ```typescript
 * mockAST
 *   .withKindDefinition('/project/src/arch.ts', {
 *     typeName: 'OrderingContext',
 *     kindNameLiteral: 'OrderingContext',
 *     members: [{ name: 'domain', typeName: 'DomainLayer' }],
 *   })
 *   .withInstanceDeclaration('/project/src/arch.ts', {
 *     variableName: 'app',
 *     kindTypeName: 'OrderingContext',
 *     members: [{ name: 'domain' }],
 *   });
 * ```
 */
export class MockASTAdapter implements ASTViewPort {
  private kindDefinitions = new Map<string, KindDefinitionView[]>();
  private instanceDeclarations = new Map<string, InstanceDeclarationView[]>();
  private annotatedExports = new Map<string, AnnotatedExportView[]>();
  private declarations = new Map<string, DeclarationView[]>();

  // --- Fluent configuration API ---

  withKindDefinition(fileName: string, view: KindDefinitionView): this {
    const existing = this.kindDefinitions.get(fileName) ?? [];
    existing.push(view);
    this.kindDefinitions.set(fileName, existing);
    return this;
  }

  withInstanceDeclaration(
    fileName: string,
    view: Omit<InstanceDeclarationView, 'declaredPath'> & { declaredPath?: string },
  ): this {
    const fullView: InstanceDeclarationView = { declaredPath: '.', ...view };
    const existing = this.instanceDeclarations.get(fileName) ?? [];
    existing.push(fullView);
    this.instanceDeclarations.set(fileName, existing);
    return this;
  }

  /**
   * Register a wrapped Kind definition. Convenience method that adds a
   * KindDefinition with wrapsTypeName set.
   */
  withWrappedKindDefinition(fileName: string, view: {
    typeName: string;
    kindNameLiteral: string;
    wrappedTypeName?: string;
    constraints?: TypeNodeView;
  }): this {
    return this.withKindDefinition(fileName, {
      typeName: view.typeName,
      kindNameLiteral: view.kindNameLiteral,
      members: [],
      constraints: view.constraints,
      wrapsTypeName: view.wrappedTypeName,
    });
  }

  withAnnotatedExport(fileName: string, view: AnnotatedExportView): this {
    const existing = this.annotatedExports.get(fileName) ?? [];
    existing.push(view);
    this.annotatedExports.set(fileName, existing);
    return this;
  }

  withDeclarations(fileName: string, views: DeclarationView[]): this {
    this.declarations.set(fileName, views);
    return this;
  }

  /**
   * Build a TypeNodeView from a plain constraint config object.
   * Converts the familiar { noDependency: [...], pure: true } format into TypeNodeView trees.
   */
  static constraintView(config: {
    pure?: boolean;
    noDependency?: [string, string][];
    noCycles?: string[];
  }): TypeNodeView {
    const properties: Array<{ name: string; value: TypeNodeView }> = [];

    if (config.pure) {
      properties.push({ name: 'pure', value: { kind: 'boolean' } });
    }
    if (config.noDependency) {
      properties.push({ name: 'noDependency', value: { kind: 'tuplePairs', values: config.noDependency } });
    }
    if (config.noCycles) {
      properties.push({ name: 'noCycles', value: { kind: 'stringList', values: config.noCycles } });
    }

    return { kind: 'object', properties };
  }

  reset(): void {
    this.kindDefinitions.clear();
    this.instanceDeclarations.clear();
    this.annotatedExports.clear();
    this.declarations.clear();
  }

  // --- ASTViewPort implementation ---

  getKindDefinitions(sourceFile: SourceFile, _checker: TypeChecker): ASTExtractionResult<KindDefinitionView[]> {
    return { data: this.kindDefinitions.get(sourceFile.fileName) ?? [], errors: [] };
  }

  getInstanceDeclarations(sourceFile: SourceFile, _checker: TypeChecker): ASTExtractionResult<InstanceDeclarationView[]> {
    return { data: this.instanceDeclarations.get(sourceFile.fileName) ?? [], errors: [] };
  }

  getAnnotatedExports(sourceFile: SourceFile, _checker: TypeChecker, _wrappedKindNames?: Set<string>): ASTExtractionResult<AnnotatedExportView[]> {
    return { data: this.annotatedExports.get(sourceFile.fileName) ?? [], errors: [] };
  }

  getTopLevelDeclarations(sourceFile: SourceFile, _checker: TypeChecker): ASTExtractionResult<DeclarationView[]> {
    return { data: this.declarations.get(sourceFile.fileName) ?? [], errors: [] };
  }
}
