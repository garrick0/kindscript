# 26. ISP Split — Ports into Sub-Interfaces

Date: 2026-02-07
Status: Done

**Date:** 2026-02-07
**Status:** Done

### Context

KindScript's port interfaces (`ASTPort`, `TypeScriptPort`) grew as features were added. By the time of the comprehensive architecture review (commit `635dde0`), they had become large interfaces with 8-10 methods each, and different services only used subsets:

- `ProgramFactory` only needed program creation (`createProgram`, `getSourceFiles`)
- `ScanService` only needed AST extraction methods
- `CheckerService` only needed import analysis (`getImports`, `getImportModuleSpecifiers`)

Services depending on the full interfaces violated the Interface Segregation Principle (ISP) — they depended on methods they never called. This made testing harder (mocks had to implement unused methods) and obscured actual dependencies.

### Decision

Split both large ports into focused sub-interfaces:

**ASTPort split (4 sub-interfaces):**

```typescript
interface KindDefinitionExtractor {
  extractKindDefinitions(sourceFile: SourceFile): ASTExtractionResult<KindDefinitionView[]>;
}

interface InstanceDeclarationExtractor {
  extractInstanceDeclarations(sourceFile: SourceFile): ASTExtractionResult<InstanceDeclarationView[]>;
}

interface TypedExportExtractor {
  extractTypedExports(sourceFile: SourceFile, typeNames: string[]): ASTExtractionResult<TypedExportView[]>;
}

interface DeclarationExtractor {
  extractDeclarations(sourceFile: SourceFile): ASTExtractionResult<DeclarationView[]>;
}

interface ASTViewPort extends
  KindDefinitionExtractor,
  InstanceDeclarationExtractor,
  TypedExportExtractor,
  DeclarationExtractor {}
```

**TypeScriptPort split (2 sub-interfaces):**

```typescript
interface CompilerPort {
  createProgram(options: CompilerOptions): Program;
  getSourceFile(program: Program, fileName: string): SourceFile | undefined;
  getSourceFiles(program: Program): readonly SourceFile[];
  getTypeChecker(program: Program): TypeChecker;
}

interface CodeAnalysisPort {
  getImports(sourceFile: SourceFile): ImportEdge[];
  getIntraFileReferences(sourceFile: SourceFile): IntraFileEdge[];
  getImportModuleSpecifiers(program: Program, file: string): string[];
}

interface TypeScriptPort extends CompilerPort, CodeAnalysisPort {}
```

Services depend on narrow interfaces:
- `ProgramFactory` → `CompilerPort`
- `ScanService` → `ASTViewPort` (specific extractors)
- `CheckerService` → `CodeAnalysisPort`

Full composite interfaces (`ASTViewPort`, `TypeScriptPort`) remain for backward compatibility and adapter implementation.

### Rationale

**Why split:**

- **ISP compliance** — clients depend only on methods they actually call
- **Clear contracts** — `ProgramFactory` signature signals "I only do program creation"
- **Simpler mocks** — test mocks implement 2-3 methods instead of 8-10
- **Extension points** — new services can depend on just the sub-interface they need

**Why preserve composites:**

- **Adapter simplicity** — `TypeScriptAdapter` implements one interface, not multiple fragments
- **Backward compatibility** — existing code using full interfaces doesn't break
- **Convenient imports** — `import { TypeScriptPort }` still works for code that needs everything

**Alternative considered:**

Create role-based ports like `ProgramProvider`, `ImportAnalyzer`. Rejected: would introduce new names and fragment the adapter implementations unnecessarily.

### Impact

- `ASTViewPort` split into 4 sub-interfaces, remains as composite
- `TypeScriptPort` split into `CompilerPort` + `CodeAnalysisPort`, remains as composite
- `ProgramFactory` constructor takes `CompilerPort` (was `TypeScriptPort`)
- `CheckerService` constructor takes `CodeAnalysisPort` (was `TypeScriptPort`)
- Test mocks implement narrow interfaces (smaller, more focused)
- All 263 tests passing after refactor

---
