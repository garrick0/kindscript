import { ASTViewPort, ASTExtractionResult, TypeNodeView, KindDefinitionView, InstanceDeclarationView } from '../../../src/application/ports/ast.port';
import { SourceFile, TypeChecker } from '../../../src/application/ports/typescript.port';

/**
 * Mock implementation of ASTViewPort for testing ClassifyASTService.
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

  // --- Fluent configuration API ---

  withKindDefinition(fileName: string, view: KindDefinitionView): this {
    const existing = this.kindDefinitions.get(fileName) ?? [];
    existing.push(view);
    this.kindDefinitions.set(fileName, existing);
    return this;
  }

  withInstanceDeclaration(fileName: string, view: InstanceDeclarationView): this {
    const existing = this.instanceDeclarations.get(fileName) ?? [];
    existing.push(view);
    this.instanceDeclarations.set(fileName, existing);
    return this;
  }

  /**
   * Build a TypeNodeView from a plain constraint config object.
   * Converts the familiar { noDependency: [...], pure: true } format into TypeNodeView trees.
   */
  static constraintView(config: {
    pure?: boolean;
    noDependency?: [string, string][];
    mustImplement?: [string, string][];
    noCycles?: string[];
    filesystem?: {
      exists?: string[];
      mirrors?: [string, string][];
    };
  }): TypeNodeView {
    const properties: Array<{ name: string; value: TypeNodeView }> = [];

    if (config.pure) {
      properties.push({ name: 'pure', value: { kind: 'boolean' } });
    }
    if (config.noDependency) {
      properties.push({ name: 'noDependency', value: { kind: 'tuplePairs', values: config.noDependency } });
    }
    if (config.mustImplement) {
      properties.push({ name: 'mustImplement', value: { kind: 'tuplePairs', values: config.mustImplement } });
    }
    if (config.noCycles) {
      properties.push({ name: 'noCycles', value: { kind: 'stringList', values: config.noCycles } });
    }
    if (config.filesystem) {
      const fsProps: Array<{ name: string; value: TypeNodeView }> = [];
      if (config.filesystem.exists) {
        fsProps.push({ name: 'exists', value: { kind: 'stringList', values: config.filesystem.exists } });
      }
      if (config.filesystem.mirrors) {
        fsProps.push({ name: 'mirrors', value: { kind: 'tuplePairs', values: config.filesystem.mirrors } });
      }
      if (fsProps.length > 0) {
        properties.push({ name: 'filesystem', value: { kind: 'object', properties: fsProps } });
      }
    }

    return { kind: 'object', properties };
  }

  reset(): void {
    this.kindDefinitions.clear();
    this.instanceDeclarations.clear();
  }

  // --- ASTViewPort implementation ---

  getKindDefinitions(sourceFile: SourceFile, _checker: TypeChecker): ASTExtractionResult<KindDefinitionView[]> {
    return { data: this.kindDefinitions.get(sourceFile.fileName) ?? [], errors: [] };
  }

  getInstanceDeclarations(sourceFile: SourceFile, _checker: TypeChecker): ASTExtractionResult<InstanceDeclarationView[]> {
    return { data: this.instanceDeclarations.get(sourceFile.fileName) ?? [], errors: [] };
  }
}
