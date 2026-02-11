import { SourceFile, TypeChecker } from './typescript.port';
import {
  KindDefinitionView, InstanceDeclarationView,
  TypeKindDefinitionView, TypeKindInstanceView,
  DeclarationView, ASTExtractionResult,
} from '../pipeline/views';

/**
 * Port for extracting architectural information from TypeScript source files.
 *
 * Returns pre-extracted domain views — all AST mechanics are encapsulated
 * in the adapter implementation.
 */
export interface ASTViewPort {
  getKindDefinitions(sourceFile: SourceFile, checker: TypeChecker): ASTExtractionResult<KindDefinitionView[]>;
  getInstanceDeclarations(sourceFile: SourceFile, checker: TypeChecker): ASTExtractionResult<InstanceDeclarationView[]>;
  getTypeKindDefinitions(sourceFile: SourceFile, checker: TypeChecker): ASTExtractionResult<TypeKindDefinitionView[]>;
  getTypeKindInstances(sourceFile: SourceFile, checker: TypeChecker, typeKindNames: Set<string>): ASTExtractionResult<TypeKindInstanceView[]>;
  getTopLevelDeclarations(sourceFile: SourceFile, checker: TypeChecker): ASTExtractionResult<DeclarationView[]>;
}
