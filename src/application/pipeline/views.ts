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
  members: Array<{ name: string; typeName?: string }>;
  constraints?: TypeNodeView;
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
 * `const x = { ... } satisfies Instance<T>`.
 */
export interface InstanceDeclarationView {
  variableName: string;
  kindTypeName: string;
  members: MemberValueView[];
}

/**
 * Wrapper for AST extraction results that may include errors
 * for malformed input (e.g., missing type arguments, unresolved references).
 */
export interface ASTExtractionResult<T> {
  data: T;
  errors: string[];
}
