import { SourceFile, TypeChecker } from './typescript.port.js';
import {
  KindDefinitionView, InstanceDeclarationView,
  AnnotatedExportView, DeclarationView, ASTExtractionResult,
} from '../pipeline/views.js';

/**
 * Port for extracting architectural information from TypeScript source files.
 *
 * Returns pre-extracted domain views — all AST mechanics are encapsulated
 * in the adapter implementation.
 */
export interface ASTViewPort {
  getKindDefinitions(sourceFile: SourceFile, checker: TypeChecker): ASTExtractionResult<KindDefinitionView[]>;
  getInstanceDeclarations(sourceFile: SourceFile, checker: TypeChecker): ASTExtractionResult<InstanceDeclarationView[]>;
  getAnnotatedExports(sourceFile: SourceFile, checker: TypeChecker, wrappedKindNames?: Set<string>): ASTExtractionResult<AnnotatedExportView[]>;
  getTopLevelDeclarations(sourceFile: SourceFile, checker: TypeChecker): ASTExtractionResult<DeclarationView[]>;
}
