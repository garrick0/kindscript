import { SourceFile } from './typescript.port';

/**
 * Structural view of a type literal tree, preserving shape without semantic knowledge.
 *
 * The adapter infers the shape from AST node structure (not property names),
 * so it remains constraint-agnostic. The classifier maps property names to
 * contract types via the GENERATORS registry.
 */
export type TypeNodeView =
  | { kind: 'boolean' }
  | { kind: 'stringList'; values: string[] }
  | { kind: 'tuplePairs'; values: [string, string][] }
  | { kind: 'object'; properties: Array<{ name: string; value: TypeNodeView }> };

/**
 * High-level view of a Kind definition extracted from a `type X = Kind<N, Members, Constraints>`.
 */
export interface KindDefinitionView {
  typeName: string;
  kindNameLiteral: string;
  members: Array<{ name: string; typeName?: string }>;
  constraints?: TypeNodeView;
}

/**
 * High-level view of a member value from an InstanceConfig object literal.
 * Represents a recursively-resolved member assignment with optional path override.
 */
export interface MemberValueView {
  name: string;
  pathOverride?: string;
  children?: MemberValueView[];
}

/**
 * High-level view of an instance declaration extracted from
 * `const x = { ... } satisfies InstanceConfig<T>`.
 */
export interface InstanceDeclarationView {
  variableName: string;
  kindTypeName: string;
  members: MemberValueView[];
}

/**
 * Port for extracting architectural information from TypeScript source files.
 *
 * Returns pre-extracted domain views — all AST mechanics are encapsulated
 * in the adapter implementation.
 */
export interface ASTViewPort {
  getKindDefinitions(sourceFile: SourceFile): KindDefinitionView[];
  getInstanceDeclarations(sourceFile: SourceFile): InstanceDeclarationView[];
}
