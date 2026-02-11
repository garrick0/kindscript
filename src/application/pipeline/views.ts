/**
 * Data transfer objects that flow through the pipeline.
 *
 * These are pure data types extracted from TypeScript's AST by the scanner
 * and consumed by downstream stages (parser, binder). They live here
 * rather than in the port file because they're pipeline-internal DTOs,
 * not part of the port interface contract.
 */

/**
 * Structural view of a type literal tree, preserving shape without semantic knowledge.
 *
 * The adapter infers the shape from AST node structure (not property names),
 * so it remains constraint-agnostic. The binder maps property names to
 * contract types via the plugin registry.
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
  members: Array<{ name: string; typeName?: string; location?: string }>;
  constraints?: TypeNodeView;
  scope?: 'folder' | 'file';
  /** If the 4th type arg has `wraps`, this is a wrapped Kind */
  wrapsTypeName?: string;
}

/**
 * High-level view of a member value from an Instance object literal.
 * Represents a recursively-resolved member assignment.
 */
export interface MemberValueView {
  name: string;
  children?: MemberValueView[];
}

/**
 * High-level view of an instance declaration extracted from
 * `const x = { ... } satisfies Instance<T, Path>`.
 */
export interface InstanceDeclarationView {
  variableName: string;
  kindTypeName: string;
  /** Relative path from the declaration file to the instance location */
  declaredPath: string;
  members: MemberValueView[];
}

/**
 * View of an exported declaration tagged with `InstanceOf<K>`.
 */
export interface TaggedExportView {
  exportName: string;
  kindTypeName: string;
}

/**
 * View of a top-level declaration within a file.
 * Used for file-scoped instance containment.
 */
export interface DeclarationView {
  name: string;
  kind: 'function' | 'const' | 'let' | 'class' | 'interface' | 'type' | 'enum';
  exported: boolean;
  line: number;
  column: number;
}

/**
 * Wrapper for AST extraction results that may include errors
 * for malformed input (e.g., missing type arguments, unresolved references).
 */
export interface ASTExtractionResult<T> {
  data: T;
  errors: string[];
}
