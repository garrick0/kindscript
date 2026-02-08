# Kind Definition Syntax — Design Exploration

> Should users write `interface DomainLayer extends Kind<"DomainLayer"> {}` or something simpler?

**Status:** Decided — Option C (implemented)
**Date:** 2026-02-07
**Implemented:** 2026-02-07 — All 10 phases complete. Option A removed, Option C is the only syntax.

---

## Problem

The current Kind definition syntax has three issues:

1. **Redundant name** — the kind name appears twice:
   ```typescript
   export interface DomainLayer extends Kind<"DomainLayer"> {}
   //              ^^^^^^^^^^^                ^^^^^^^^^^^
   ```

2. **Verbose leaf kinds** — kinds with no members still need `extends` and empty braces:
   ```typescript
   export interface DomainLayer extends Kind<"DomainLayer"> {}
   ```

3. **Blurs library vs user code** — `extends Kind` is an OOP inheritance pattern, but kinds are pure type-level concepts with no runtime behavior. The `interface extends` pattern suggests there's a base class being inherited when there isn't one.

This document explores alternative syntax options and their implications for the classifier, type safety, and user experience.

---

## What the Classifier Needs

The classifier (`classify-ast.service.ts`) must extract three things from the AST:

1. **Signal** — "this declaration is a Kind definition" (currently: `extends Kind` in the heritage clause)
2. **Kind name** — the string literal discriminant (currently: `Kind<"DomainLayer">` type argument)
3. **Members** — child kinds that compose this kind (currently: interface property signatures)

Any alternative syntax must provide all three. The question is how.

### Current Classifier Flow

```
Phase 1: For each interface declaration
  → getHeritageTypeNames(node)       // ["Kind"] — the signal
  → getDeclarationName(node)         // "DomainLayer"
  → getHeritageTypeArgLiterals(node) // ["DomainLayer"] — the kind name
  → getPropertySignatures(node)      // [{ name: "domain", typeName: "DomainLayer" }, ...]

Phase 2: For each variable with locate<T>() call
  → getCallTypeArgumentNames(init)   // ["ShopContext"] — links to Kind def
  → getCallArguments(init)           // [root, members] — locations

Phase 3: For each variable with defineContracts<T>() call
  → getCallTypeArgumentNames(init)   // ["ShopContext"] — links to Kind def
```

Phases 2 and 3 are unaffected by syntax changes — they operate on `locate()` and `defineContracts()` call expressions, which stay the same regardless of how Kinds are defined. Only Phase 1 changes.

---

## Options

### Option A: Interface extends (current)

```typescript
import { Kind, locate, defineContracts } from 'kindscript';

export interface DomainLayer extends Kind<"DomainLayer"> {}
export interface ApplicationLayer extends Kind<"ApplicationLayer"> {}
export interface InfrastructureLayer extends Kind<"InfrastructureLayer"> {}

export interface ShopContext extends Kind<"ShopContext"> {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}
```

**Classifier signal:** Heritage clause — `getHeritageTypeNames(node).includes('Kind')`.

**Pros:**
- Proven — all tests, fixtures, and docs use this today
- Heritage clause is unambiguous in the AST
- Composite kinds read naturally — members are interface properties
- TypeScript's `extends` is the standard structural subtyping mechanism

**Cons:**
- Redundant name in every definition
- Leaf kinds have empty `{}`
- `extends` implies inheritance, but there's no runtime base
- Forces `interface` (not `type`) — this matters because `type` vs `interface` is already used as a semantic signal elsewhere (e.g. `PlaceOrderRequest` uses `type` to avoid `mustImplement` treating it as a port)

**Classifier changes:** None.

---

### Option B: Type alias with intersection

```typescript
import { Kind, locate, defineContracts } from 'kindscript';

export type DomainLayer = Kind<"DomainLayer">;
export type ApplicationLayer = Kind<"ApplicationLayer">;
export type InfrastructureLayer = Kind<"InfrastructureLayer">;

export type ShopContext = Kind<"ShopContext"> & {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
};
```

**Classifier signal:** Type alias where the resolved type (or an intersection member) references `Kind<...>`.

**Pros:**
- Leaves are clean — `type DomainLayer = Kind<"DomainLayer">` with no `{}`
- `type` feels more natural for a pure type-level concept
- Intersection `&` is standard TypeScript for combining types

**Cons:**
- Still has the redundant name
- `Kind<"ShopContext"> & { ... }` is less readable than interface properties
- Classifier must walk intersection types to find the `Kind<...>` reference and extract member properties from a type literal node — more complex AST traversal
- Member properties live in a type literal inside an intersection, not on an interface — different AST shape for `getPropertySignatures()`

**Classifier changes:**
- Add `isTypeAliasDeclaration()` to ASTPort
- Modify `getHeritageTypeNames()` to walk `IntersectionTypeNode` → `TypeReferenceNode` chains
- Modify `getHeritageTypeArgLiterals()` similarly
- Modify `getPropertySignatures()` to extract properties from the type literal member of the intersection
- ~1 line change in `classify-ast.service.ts` Phase 1 loop

---

### Option C: Two-parameter generic

```typescript
import { Kind, locate, defineContracts } from 'kindscript';

export type DomainLayer = Kind<"DomainLayer">;
export type ApplicationLayer = Kind<"ApplicationLayer">;
export type InfrastructureLayer = Kind<"InfrastructureLayer">;

export type ShopContext = Kind<"ShopContext", {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}>;
```

The library's `Kind` type gains a second parameter:

```typescript
// Library provides:
type Kind<
  N extends string = string,
  Members extends Record<string, Kind> = {}
> = {
  readonly kind: N;
  readonly location: string;
} & Members;
```

**Classifier signal:** Type alias referencing `Kind<...>`.

**Pros:**
- Leaves are identical to Option B — clean one-liners
- Composites are cleaner than B — members are inside the type parameter, not a separate intersection
- One unified `Kind<...>` pattern for both leaves and composites
- Members are in a known AST position (second type argument) rather than an arbitrary intersection member
- `locate<T>()` and `MemberMap<T>` continue to work unchanged — the intersection flattens all properties

**Cons:**
- Still has the redundant name
- Deeply nested composites could get verbose (but in practice, kinds are defined flat and composed)
- Classifier must extract properties from the second type argument's type literal
- The second type parameter conflates "these are my architectural members" with "these are additional type properties" — though in practice only Kind-typed properties are meaningful

**Classifier changes:**
- Same as Option B for signal detection (type alias referencing `Kind<...>`)
- For member extraction: read `typeArguments[1]` of the `Kind<...>` type reference, parse it as a type literal with property signatures
- Slightly simpler than B because members are in a fixed position (second type arg) rather than scattered across intersection members

---

### Option D: Inferred name

```typescript
import { Kind, locate, defineContracts } from 'kindscript';

export type DomainLayer = Kind;
export type ApplicationLayer = Kind;
export type InfrastructureLayer = Kind;

export type ShopContext = Kind<{
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}>;
```

The kind name is inferred from the type alias name — no string literal parameter.

The library's `Kind` type uses a single optional parameter for members:

```typescript
// Library provides:
type Kind<Members extends Record<string, Kind> = {}> = {
  readonly kind: string;
  readonly location: string;
} & Members;
```

**Classifier signal:** Type alias referencing `Kind` (with or without type arguments).

**Pros:**
- No redundant name — `type DomainLayer = Kind` is as minimal as it gets
- Composites are also clean — `Kind<{ domain: DomainLayer; ... }>`
- The classifier already falls back to the declaration name when no string literal is found (`kindNameLiterals[0] ?? name` at line 155)

**Cons:**
- **Loses nominal typing.** All leaf kinds resolve to the same structural type: `{ kind: string; location: string }`. TypeScript considers `DomainLayer` and `ApplicationLayer` identical types. This means:
  - You can assign a `DomainLayer` where an `ApplicationLayer` is expected
  - Type errors from mixing up members in `locate()` or `defineContracts()` are weaker
  - Future features that depend on distinguishing kinds at the type level won't work
- Renaming the type alias silently changes the kind name. If someone renames `DomainLayer` to `CoreDomain`, all diagnostics, contracts, and configs that referenced "DomainLayer" break without warning.
- Less explicit — a reader of `type DomainLayer = Kind` can't immediately tell what the kind's string name is without knowing the convention

**Classifier changes:**
- Same as Options B/C for signal detection
- For name extraction: use `getDeclarationName(node)` (the type alias name) since there's no string literal

---

### Option E: All-in-one declaration

```typescript
import { defineArchitecture } from 'kindscript';

export const shop = defineArchitecture("ShopContext", {
  members: {
    domain: "DomainLayer",
    application: "ApplicationLayer",
    infrastructure: "InfrastructureLayer",
  },
  root: "src",
  contracts: {
    noDependency: [
      ["domain", "application"],
      ["domain", "infrastructure"],
      ["application", "infrastructure"],
    ],
    purity: ["domain"],
    mustImplement: [["application", "infrastructure"]],
  },
});
```

No separate Kind definitions, instances, or contracts. One call declares everything.

**Classifier signal:** `defineArchitecture()` call expression (same pattern as `locate()` and `defineContracts()`).

**Pros:**
- Minimal boilerplate — one declaration for everything
- No type-level ceremony at all
- Easy to read as a configuration file
- Classifier parses a single call expression — simpler than any type-based approach

**Cons:**
- **Loses all TypeScript type safety.** No `MemberMap<T>` validation, no type checking that member names in contracts match actual members, no IDE autocompletion for member names.
- Can't reuse Kind definitions across instances. The whole point of `Kind<"BoundedContext">` is that multiple `locate()` calls can share the same kind definition. With all-in-one, each instance is its own definition.
- Can't share contracts across instances — each `defineArchitecture` is self-contained.
- Fundamentally different conceptual model — kinds are no longer types, they're configuration values.

**Classifier changes:** New parsing path for `defineArchitecture()` calls, but simpler than type-based approaches.

---

## Comparison

| | Leaf syntax | Composite syntax | Redundant name | Type safety | Classifier complexity |
|---|---|---|---|---|---|
| **A (current)** | `interface X extends Kind<"X"> {}` | `interface X extends Kind<"X"> { ... }` | yes | full | none (existing) |
| **B (intersection)** | `type X = Kind<"X">` | `type X = Kind<"X"> & { ... }` | yes | full | medium |
| **C (two-param)** | `type X = Kind<"X">` | `type X = Kind<"X", { ... }>` | yes | full | medium |
| **D (infer name)** | `type X = Kind` | `type X = Kind<{ ... }>` | **no** | weaker | medium |
| **E (all-in-one)** | n/a | n/a | **no** | **none** | low (different) |

### What changes in the classifier for B/C/D

All three require the same foundational change: supporting type alias declarations alongside interface declarations. The concrete changes:

| Component | Change |
|---|---|
| `ast.port.ts` | Add `isTypeAliasDeclaration()` method |
| `ast.adapter.ts` | Add `isTypeAliasDeclaration()` — wraps `ts.isTypeAliasDeclaration()` |
| `ast.adapter.ts` | Modify `getHeritageTypeNames()` — walk intersection/type-reference nodes for type aliases |
| `ast.adapter.ts` | Modify `getHeritageTypeArgLiterals()` — extract string literals from type arguments |
| `ast.adapter.ts` | Modify `getPropertySignatures()` — extract properties from type literal in second type arg (C) or intersection member (B) |
| `classify-ast.service.ts` | Line 54: add `\|\| this.astPort.isTypeAliasDeclaration(stmt)` |
| `mock-ast.adapter.ts` | Add mock type alias node support |
| Tests | ~8-12 new test cases |

The difference between B and C is where member properties live in the AST:
- **B:** Properties in a type literal that's one member of an intersection
- **C:** Properties in a type literal that's the second type argument of `Kind<N, Members>`

Option C is slightly simpler because the position is fixed (second type arg), whereas B requires scanning intersection members to find the type literal.

---

## Recommendation

**Short term: Support both A and C.** Add type alias support to the classifier so users can choose. The `interface extends` pattern continues to work; `type X = Kind<"X">` and `type X = Kind<"X", { ... }>` become available as alternatives.

**Reasons:**

1. **C is the cleanest syntax that preserves full type safety.** Leaves go from `interface DomainLayer extends Kind<"DomainLayer"> {}` to `type DomainLayer = Kind<"DomainLayer">` — less noise, same semantics. Composites go from heritage clause + interface body to a single generic with members in the second parameter.

2. **Backwards compatible.** Existing architecture.ts files with `interface extends Kind` continue to work. Users migrate at their own pace. The classifier supports both patterns by checking `isInterfaceDeclaration || isTypeAliasDeclaration`.

3. **C over B** because members in a fixed type argument position (`Kind<N, Members>`) is easier to parse and more explicit than members scattered in an intersection. `Kind<"ShopContext", { domain: ... }>` reads as "a ShopContext Kind with these members" — the structure is self-documenting.

4. **Not D** because losing nominal typing is a real regression, even if it's not exploited today. The explicit string literal is cheap (a few extra characters) and keeps the door open for future features that depend on distinguishing kinds at the type level. It also makes the kind name explicit in the source code — no hidden conventions.

5. **Not E** because losing type safety for `locate<T>()` and `MemberMap<T>` is too high a cost. The type-level validation is one of KindScript's core differentiators — "your architecture is checked by the type system." Collapsing everything into runtime values undermines that.

**Longer term: Consider D as opt-in sugar.** If the redundant name proves to be a real friction point, allow `type DomainLayer = Kind` (no parameter) as shorthand where the classifier infers the name. This would require the `Kind` type to accept zero parameters, and the `kind` property type would be `string` instead of a literal. It's a weaker but more concise option that could coexist with C.

### Concrete syntax after implementing C

```typescript
import { Kind, locate, defineContracts } from 'kindscript';

// Leaf kinds — one line each
type DomainLayer = Kind<"DomainLayer">;
type ApplicationLayer = Kind<"ApplicationLayer">;
type InfrastructureLayer = Kind<"InfrastructureLayer">;

// Composite kind — members in second type parameter
type ShopContext = Kind<"ShopContext", {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}>;

// Instance and contracts — unchanged
export const shop = locate<ShopContext>("src", {
  domain: {},
  application: {},
  infrastructure: {},
});

export const contracts = defineContracts<ShopContext>({
  noDependency: [
    ["domain", "application"],
    ["domain", "infrastructure"],
    ["application", "infrastructure"],
  ],
  purity: ["domain"],
  mustImplement: [["application", "infrastructure"]],
});
```

### Compared to current (Option A)

```diff
- export interface DomainLayer extends Kind<"DomainLayer"> {}
- export interface ApplicationLayer extends Kind<"ApplicationLayer"> {}
- export interface InfrastructureLayer extends Kind<"InfrastructureLayer"> {}
-
- export interface ShopContext extends Kind<"ShopContext"> {
-   domain: DomainLayer;
-   application: ApplicationLayer;
-   infrastructure: InfrastructureLayer;
- }
+ type DomainLayer = Kind<"DomainLayer">;
+ type ApplicationLayer = Kind<"ApplicationLayer">;
+ type InfrastructureLayer = Kind<"InfrastructureLayer">;
+
+ type ShopContext = Kind<"ShopContext", {
+   domain: DomainLayer;
+   application: ApplicationLayer;
+   infrastructure: InfrastructureLayer;
+ }>;
```

Leaves drop from 1 line of noise to 1 clean line. Composites are comparable in length but use a single generic instead of inheritance + body. Both patterns work simultaneously — the classifier supports either.

---

## Implementation Scope

If we proceed with supporting C alongside A:

1. **`src/runtime/kind.ts`** — Add second type parameter to `Kind<N, Members>`. (Backwards compatible: defaults to `{}`.)
2. **`src/application/ports/ast.port.ts`** — Add `isTypeAliasDeclaration()` method.
3. **`src/infrastructure/adapters/ast/ast.adapter.ts`** — Implement `isTypeAliasDeclaration()`, modify `getHeritageTypeNames()`, `getHeritageTypeArgLiterals()`, and `getPropertySignatures()` to handle type alias nodes.
4. **`src/application/use-cases/classify-ast/classify-ast.service.ts`** — Add type alias check to Phase 1 loop (one line).
5. **`src/infrastructure/adapters/testing/mock-ast.adapter.ts`** — Add mock type alias support.
6. **Tests** — Add unit tests for type alias Kind parsing, update integration fixtures.
7. **Docs and examples** — Update notebooks and README to show the new syntax.

Estimated scope: medium. The AST adapter changes are the bulk of the work — everything else is small.

---

## Open Questions

1. **Should `export` be required?** Currently, non-exported interface Kind definitions are still found by the classifier. Same question applies to type aliases.

2. **Should we deprecate the interface syntax?** Probably not — it works and some users may prefer it. But docs and examples should prefer the type alias syntax once supported.

3. **What about the `mustImplement` contract's use of `interface` as a signal?** `mustImplement` looks for `interface` declarations in application code to identify ports. This is a separate concern from Kind definitions — port interfaces would still use `interface`. But it's worth noting that the `type` vs `interface` distinction carries semantic weight in KindScript: `interface` = "this is a port that needs an implementation", `type` = "this is just a data shape." Switching Kind definitions to `type` actually reinforces this distinction — Kinds are type-level architecture definitions, not ports.

4. **Naming: should the second parameter be called `Members`?** The library type would be `Kind<N, Members>`. Alternative names: `Shape`, `Structure`, `Components`. `Members` aligns with the existing terminology in `MemberMap<T>`.

---

## Implementation Plan — Option C (replacing A)

**Decision:** Implement Option C as the only supported syntax. Remove Option A (`interface extends Kind`) entirely. Uplift all existing code, fixtures, docs, and notebooks.

### Phase 1: Runtime type

**File:** `src/runtime/kind.ts`

Change `Kind` from an interface to a type alias with a second parameter:

```typescript
// Before:
export interface Kind<N extends string = string> {
  readonly kind: N;
  readonly location: string;
}

// After:
export type Kind<
  N extends string = string,
  Members extends Record<string, Kind> = Record<string, never>,
> = {
  readonly kind: N;
  readonly location: string;
} & Members;
```

Update the JSDoc to show the new syntax. `MemberMap<T>` in `src/runtime/locate.ts` needs no changes — it already strips `kind` and `location` from `keyof T`, and the `&` intersection flattens all member properties into `T`.

`defineContracts` in `src/runtime/define-contracts.ts` needs no changes — it doesn't reference Kind's shape.

**Verify:** `npm run build` should pass. The new `Kind` type is structurally compatible everywhere the old interface was used.

### Phase 2: AST port — new methods

**File:** `src/application/ports/ast.port.ts`

Add to `ASTNodePort`:

```typescript
isTypeAliasDeclaration(node: ASTNode): boolean;
```

Replace the heritage-based methods in `ASTDeclarationPort` with type-alias-based methods:

```typescript
// Before:
export interface ASTDeclarationPort {
  getHeritageTypeNames(node: ASTNode): string[];
  getHeritageTypeArgLiterals(node: ASTNode): string[];
  getPropertySignatures(node: ASTNode): Array<{ name: string; typeName?: string }>;
  getVariableDeclarations(node: ASTNode): ASTNode[];
  getVariableTypeName(node: ASTNode): string | undefined;
}

// After:
export interface ASTDeclarationPort {
  getTypeAliasReferenceName(node: ASTNode): string | undefined;
  getTypeAliasTypeArgLiterals(node: ASTNode): string[];
  getTypeAliasMemberProperties(node: ASTNode): Array<{ name: string; typeName?: string }>;
  getVariableDeclarations(node: ASTNode): ASTNode[];
  getVariableTypeName(node: ASTNode): string | undefined;
}
```

The three new methods replace the three old ones:

| Old (interface-based) | New (type-alias-based) | Purpose |
|---|---|---|
| `getHeritageTypeNames(node)` | `getTypeAliasReferenceName(node)` | Signal: returns `"Kind"` for `type X = Kind<...>` |
| `getHeritageTypeArgLiterals(node)` | `getTypeAliasTypeArgLiterals(node)` | Kind name: returns `["DomainLayer"]` from `Kind<"DomainLayer">` |
| `getPropertySignatures(node)` | `getTypeAliasMemberProperties(node)` | Members: returns `[{name: "domain", typeName: "DomainLayer"}, ...]` from the second type arg |

Note: `isInterfaceDeclaration` stays in ASTNodePort — it's still used by other parts of the system (e.g. `mustImplement` scans for port interfaces in source files).

### Phase 3: AST adapter — implement new methods

**File:** `src/infrastructure/adapters/ast/ast.adapter.ts`

Add `isTypeAliasDeclaration`:

```typescript
isTypeAliasDeclaration(node: ASTNode): boolean {
  return ts.isTypeAliasDeclaration(this.toTsNode(node));
}
```

Add `getDeclarationName` support for type alias declarations (currently only handles interfaces and variables):

```typescript
// Add this branch to getDeclarationName():
if (ts.isTypeAliasDeclaration(tsNode)) {
  return tsNode.name.text;
}
```

Replace `getHeritageTypeNames` with `getTypeAliasReferenceName`:

```typescript
// For `type X = Kind<...>` → returns "Kind"
// For `type X = Foo` → returns "Foo"
getTypeAliasReferenceName(node: ASTNode): string | undefined {
  const tsNode = this.toTsNode(node);
  if (!ts.isTypeAliasDeclaration(tsNode)) return undefined;

  const type = tsNode.type;
  if (ts.isTypeReferenceNode(type) && ts.isIdentifier(type.typeName)) {
    return type.typeName.text;
  }
  return undefined;
}
```

Replace `getHeritageTypeArgLiterals` with `getTypeAliasTypeArgLiterals`:

```typescript
// For `type X = Kind<"DomainLayer">` → returns ["DomainLayer"]
// For `type X = Kind<"Ctx", { ... }>` → returns ["Ctx"]
getTypeAliasTypeArgLiterals(node: ASTNode): string[] {
  const tsNode = this.toTsNode(node);
  if (!ts.isTypeAliasDeclaration(tsNode)) return [];

  const type = tsNode.type;
  if (!ts.isTypeReferenceNode(type) || !type.typeArguments) return [];

  const literals: string[] = [];
  for (const arg of type.typeArguments) {
    if (ts.isLiteralTypeNode(arg) && ts.isStringLiteral(arg.literal)) {
      literals.push(arg.literal.text);
    }
  }
  return literals;
}
```

Replace `getPropertySignatures` with `getTypeAliasMemberProperties`:

```typescript
// For `type X = Kind<"Ctx", { domain: DomainLayer; infra: InfraLayer }>`:
// → extracts property signatures from the second type argument (the type literal)
// → returns [{ name: "domain", typeName: "DomainLayer" }, { name: "infra", typeName: "InfraLayer" }]
getTypeAliasMemberProperties(node: ASTNode): Array<{ name: string; typeName?: string }> {
  const tsNode = this.toTsNode(node);
  if (!ts.isTypeAliasDeclaration(tsNode)) return [];

  const type = tsNode.type;
  if (!ts.isTypeReferenceNode(type)) return [];
  if (!type.typeArguments || type.typeArguments.length < 2) return [];

  const membersArg = type.typeArguments[1];
  if (!ts.isTypeLiteralNode(membersArg)) return [];

  const props: Array<{ name: string; typeName?: string }> = [];
  for (const member of membersArg.members) {
    if (ts.isPropertySignature(member) && member.name) {
      const name = ts.isIdentifier(member.name) ? member.name.text : member.name.getText();
      let typeName: string | undefined;
      if (member.type && ts.isTypeReferenceNode(member.type) && ts.isIdentifier(member.type.typeName)) {
        typeName = member.type.typeName.text;
      }
      props.push({ name, typeName });
    }
  }
  return props;
}
```

Remove the old `getHeritageTypeNames`, `getHeritageTypeArgLiterals`, and `getPropertySignatures` methods.

### Phase 4: Classifier — use type aliases

**File:** `src/application/use-cases/classify-ast/classify-ast.service.ts`

**Phase 1 loop (line 53-59):** Change from interface to type alias:

```typescript
// Before:
if (this.astPort.isInterfaceDeclaration(stmt)) {
  const result = this.classifyKindDefinition(stmt);

// After:
if (this.astPort.isTypeAliasDeclaration(stmt)) {
  const result = this.classifyKindDefinition(stmt);
```

**`classifyKindDefinition` method (line 147-160):** Update to use new port methods:

```typescript
// Before:
private classifyKindDefinition(node: ASTNode): KindDefinition | undefined {
  const heritageNames = this.astPort.getHeritageTypeNames(node);
  if (!heritageNames.includes('Kind')) return undefined;

  const name = this.astPort.getDeclarationName(node);
  if (!name) return undefined;

  const kindNameLiterals = this.astPort.getHeritageTypeArgLiterals(node);
  const kindNameLiteral = kindNameLiterals[0] ?? name;

  const properties = this.astPort.getPropertySignatures(node);

  return { name, kindNameLiteral, properties };
}

// After:
private classifyKindDefinition(node: ASTNode): KindDefinition | undefined {
  const referenceName = this.astPort.getTypeAliasReferenceName(node);
  if (referenceName !== 'Kind') return undefined;

  const name = this.astPort.getDeclarationName(node);
  if (!name) return undefined;

  const kindNameLiterals = this.astPort.getTypeAliasTypeArgLiterals(node);
  const kindNameLiteral = kindNameLiterals[0] ?? name;

  const properties = this.astPort.getTypeAliasMemberProperties(node);

  return { name, kindNameLiteral, properties };
}
```

Update the JSDoc on line 144 from "Check if an interface declaration extends Kind<N>" to "Check if a type alias references Kind<N>".

### Phase 5: Mock adapter

**File:** `src/infrastructure/adapters/testing/mock-ast.adapter.ts`

Replace `MockInterfaceNode` with `MockTypeAliasNode`:

```typescript
// Before:
interface MockInterfaceNode extends ASTNode {
  __type: 'interface';
  name: string;
  heritageTypeNames: string[];
  heritageTypeArgLiterals: string[];
  properties: Array<{ name: string; typeName?: string }>;
}

// After:
interface MockTypeAliasNode extends ASTNode {
  __type: 'typeAlias';
  name: string;
  referenceName: string;        // e.g. "Kind"
  typeArgLiterals: string[];    // e.g. ["DomainLayer"]
  memberProperties: Array<{ name: string; typeName?: string }>;
}
```

Update `MockNode` union to use `MockTypeAliasNode` instead of `MockInterfaceNode`.

Replace `withInterface` with `withTypeAlias`:

```typescript
// Before:
withInterface(fileName, name, extendsType, kindNameLiteral, properties)

// After:
withTypeAlias(
  fileName: string,
  name: string,
  referenceName: string,    // "Kind"
  kindNameLiteral: string,  // "DomainLayer"
  memberProperties: Array<{ name: string; typeName?: string }> = []
): this
```

Update all ASTPort method implementations:

```typescript
// Replace:
isInterfaceDeclaration(node) → check __type === 'interface'
getHeritageTypeNames(node) → read heritageTypeNames
getHeritageTypeArgLiterals(node) → read heritageTypeArgLiterals
getPropertySignatures(node) → read properties

// With:
isTypeAliasDeclaration(node) → check __type === 'typeAlias'
getTypeAliasReferenceName(node) → read referenceName
getTypeAliasTypeArgLiterals(node) → read typeArgLiterals
getTypeAliasMemberProperties(node) → read memberProperties
```

Keep `isInterfaceDeclaration` returning false for all mock nodes (no interface Kind definitions exist anymore, but the method stays in the port).

Update `getDeclarationName` to handle `typeAlias` nodes:

```typescript
if (mock.__type === 'typeAlias') return mock.name;
```

### Phase 6: Unit tests

**Files:**
- `tests/unit/classify-ast-kind-parsing.test.ts`
- `tests/unit/classify-ast-contracts.test.ts`
- `tests/unit/classify-ast-locate.test.ts`
- `tests/unit/ast.adapter.test.ts`

All calls to `mockAST.withInterface(fileName, name, 'Kind', kindName, properties)` become `mockAST.withTypeAlias(fileName, name, 'Kind', kindName, properties)`. The test assertions stay the same — the classifier output hasn't changed, only the input AST shape.

In `ast.adapter.test.ts`, update or replace any tests that parse `interface X extends Kind<...>` fixture strings. Replace with `type X = Kind<...>` fixture strings and test the new adapter methods (`getTypeAliasReferenceName`, `getTypeAliasTypeArgLiterals`, `getTypeAliasMemberProperties`). Remove tests for `getHeritageTypeNames`, `getHeritageTypeArgLiterals`, `getPropertySignatures`.

### Phase 7: Integration fixtures (18 files)

Convert every `architecture.ts` in `tests/integration/fixtures/*/`:

```
tests/integration/fixtures/clean-arch-valid/architecture.ts
tests/integration/fixtures/clean-arch-violation/architecture.ts
tests/integration/fixtures/colocated-clean/architecture.ts
tests/integration/fixtures/colocated-violation/architecture.ts
tests/integration/fixtures/locate-clean-arch/architecture.ts
tests/integration/fixtures/locate-existence/architecture.ts
tests/integration/fixtures/locate-multi-instance/architecture.ts
tests/integration/fixtures/locate-nested/architecture.ts
tests/integration/fixtures/locate-path-override/architecture.ts
tests/integration/fixtures/locate-standalone-member/architecture.ts
tests/integration/fixtures/locate-violation/architecture.ts
tests/integration/fixtures/must-implement-clean/architecture.ts
tests/integration/fixtures/must-implement-violation/architecture.ts
tests/integration/fixtures/no-cycles-violation/architecture.ts
tests/integration/fixtures/purity-clean/architecture.ts
tests/integration/fixtures/purity-violation/architecture.ts
tests/integration/fixtures/tier2-clean-arch/architecture.ts
tests/integration/fixtures/tier2-violation/architecture.ts
```

Each fixture inlines the runtime types (no import). The conversion pattern for each:

```typescript
// Before (inlined runtime + interface syntax):
interface Kind<N extends string = string> {
  readonly kind: N;
  readonly location: string;
}
// ... MemberMap, locate, defineContracts inlined ...

export interface CleanContext extends Kind<"CleanContext"> {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}
export interface DomainLayer extends Kind<"DomainLayer"> {}
export interface InfrastructureLayer extends Kind<"InfrastructureLayer"> {}

// After (inlined runtime + type alias syntax):
type Kind<
  N extends string = string,
  Members extends Record<string, Kind> = Record<string, never>,
> = {
  readonly kind: N;
  readonly location: string;
} & Members;
// ... MemberMap, locate, defineContracts inlined (unchanged) ...

export type DomainLayer = Kind<"DomainLayer">;
export type InfrastructureLayer = Kind<"InfrastructureLayer">;
export type CleanContext = Kind<"CleanContext", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}>;
```

Note: leaf kinds must be declared before composite kinds that reference them (type aliases can't forward-reference like interfaces can). Reorder declarations if needed.

**Verify:** `npm test -- tests/integration` should pass after this phase.

### Phase 8: Notebooks and example codebase

**File:** `notebooks/example-codebase/architecture.ts`

Convert from inlined interface syntax to inlined type alias syntax (same pattern as fixtures).

**File:** `notebooks/04-bounded-contexts.ipynb`

Three code cells write `architecture.ts` content as template strings. All three already use `import { Kind, locate, defineContracts } from 'kindscript'`. Convert the Kind definitions within each:

- Cell `cell-detect` (single ShopContext) — change `export interface` to `export type` syntax
- Cell `cell-write-arch` (multi-instance BoundedContext) — same
- Cell `cell-workaround` (separate PaymentsContext/OrdersContext) — same

**File:** `notebooks/01-quickstart.ipynb`

Contains `extends Kind<...>` in architecture.ts templates. Convert all occurrences.

**File:** `notebooks/02-contracts.ipynb`

Contains 10+ occurrences of `interface ... extends Kind<...>` across multiple cells demonstrating different contract types. Convert all.

**Verify:** Run each notebook with `papermill notebooks/XX.ipynb /dev/null --kernel deno` to confirm they still pass.

### Phase 9: Documentation

Update all non-archive docs that reference the old syntax:

**`README.md`** — Update any `interface extends Kind` examples to `type = Kind<...>`.

**`CLAUDE.md`** — Update code examples in the development guide. The "Adding New Contract Types" checklist and "Common Patterns" section likely reference the old syntax.

**`docs/architecture/COMPILER_ARCHITECTURE.md`** — Update the classifier description (Phase 1 now looks for type aliases, not interfaces). Update any user-facing syntax examples.

**`docs/architecture/BUILD_PLAN.md`** — Update any syntax examples in milestone descriptions.

**`docs/architecture/DESIGN_DECISIONS.md`** — Update any syntax examples.

**`docs/design/KIND_DEFINITION_SYNTAX.md`** (this document) — Update the status from "Exploration" to "Decided — Option C" at the top.

**`docs/design/KIND_DERIVED_LOCATIONS.md`**, **`docs/design/KIND_INSTANCE_DESIGN.md`**, **`docs/design/FILESYSTEM_CONSTRAINTS.md`**, **`docs/design/RUNTIME_MARKERS_OPTIONS.md`**, **`docs/design/MEMBER_KIND_TYPES.md`** — Search for `extends Kind` and convert any examples.

**`docs/status/CODEBASE_REVIEW.md`** — Update if it references interface-based Kind definitions.

**Do not update** `docs/archive/*` — those are historical records.

**`tests/integration/fixtures/README.md`**, **`tests/README.md`** — Update any syntax examples.

### Phase 10: Final verification

```bash
npm run build          # TypeScript compiles cleanly
npm test               # All 388 tests pass
npm test -- --coverage # Coverage thresholds met
```

Run all notebooks:

```bash
papermill notebooks/01-quickstart.ipynb /dev/null --kernel deno
papermill notebooks/02-contracts.ipynb /dev/null --kernel deno
papermill notebooks/04-bounded-contexts.ipynb /dev/null --kernel deno
```

### Summary of all files changed

| Phase | Files | Count |
|---|---|---|
| 1. Runtime type | `src/runtime/kind.ts` | 1 |
| 2. AST port | `src/application/ports/ast.port.ts` | 1 |
| 3. AST adapter | `src/infrastructure/adapters/ast/ast.adapter.ts` | 1 |
| 4. Classifier | `src/application/use-cases/classify-ast/classify-ast.service.ts` | 1 |
| 5. Mock adapter | `src/infrastructure/adapters/testing/mock-ast.adapter.ts` | 1 |
| 6. Unit tests | `tests/unit/classify-ast-*.test.ts`, `tests/unit/ast.adapter.test.ts` | 4 |
| 7. Fixtures | `tests/integration/fixtures/*/architecture.ts` | 18 |
| 8. Notebooks | `notebooks/*.ipynb`, `notebooks/example-codebase/architecture.ts` | 4 |
| 9. Docs | `README.md`, `CLAUDE.md`, `docs/**/*.md` | ~12 |
| 10. Verify | (no file changes) | 0 |
| **Total** | | **~43 files** |

---

## Implementation Log

**All 10 phases completed on 2026-02-07.**

### Phase completion

| Phase | Status | Notes |
|---|---|---|
| 1. Runtime type | Done | `Kind<N, Members>` with `= {}` default (not `Record<string, never>` — caused TS errors) |
| 2. AST port | Done | Replaced heritage methods with `getTypeAliasReferenceName`, `getTypeAliasTypeArgLiterals`, `getTypeAliasMemberProperties` |
| 3. AST adapter | Done | Full implementation using `ts.isTypeAliasDeclaration` and `ts.TypeReferenceNode` |
| 4. Classifier | Done | Phase 1 loop now uses `isTypeAliasDeclaration` instead of `isInterfaceDeclaration` |
| 5. Mock adapter | Done | `MockTypeAliasNode` replaces `MockInterfaceNode`; `withTypeAlias()` replaces `withInterface()` |
| 6. Unit tests | Done | 4 test files updated |
| 7. Fixtures | Done | All 18 fixture `architecture.ts` files converted |
| 8. Notebooks | Done | `example-codebase/architecture.ts` + 3 notebooks (01, 02, 04) |
| 9. Documentation | Done | README.md, CLAUDE.md, 3 architecture docs, 4 design docs |
| 10. Verification | Done | `npm run build` clean, 23 suites / 247 tests all passing |

### Issues encountered

1. **`Record<string, never>` default** — Initial attempt used `Record<string, never>` as the Members default, which caused `MemberMap<T>` to fail structural compatibility with `Kind`. Fixed by using `= {}` with eslint-disable comment.

2. **E2E tests needed rebuild** — After converting fixtures (Phase 7), E2E tests failed because they run from `dist/` which was stale. Fixed by running `npm run build`.

3. **Coverage thresholds** — Pre-existing coverage shortfall in domain layer (due to earlier removal of detect/infer architecture functionality). Not caused by this migration.

4. **`isInterfaceDeclaration` preserved** — Kept in the port and adapter because `mustImplement` contract checking still scans for port interfaces in source files. Only removed from the Kind definition detection path.
