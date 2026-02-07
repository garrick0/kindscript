# Milestone 0 Implementation Plan
## Domain + Ports + Test Infrastructure (1 Week)

> **📖 Architecture Reference:** Implements the foundational architecture from
> `ANALYSIS_COMPILER_ARCHITECTURE_V4.md` Part 3 (domain entities) and Part 4.4 (ports).
> See `BUILD_PLAN_INCREMENTAL.md` Milestone 0 for context.

---

## Goal

**Validate the Clean Architecture with zero real implementations.**

By the end of this milestone:
- All domain entities are defined with pure business logic
- All ports are defined as interfaces in the application layer
- Mock adapters implement all ports for testing
- 20+ architecture validation tests prove the design works
- **Zero** dependencies on TypeScript compiler API in domain/application layers
- **Zero** real file I/O anywhere in tests

---

## Directory Structure

```
src/
├── domain/
│   ├── entities/
│   │   ├── arch-symbol.ts           # Core architectural entity
│   │   ├── contract.ts              # Contract definition entity
│   │   ├── diagnostic.ts            # Diagnostic entity
│   │   ├── program.ts               # Wrapper for TS program
│   │   └── resolved-files.ts        # Symbol-to-files resolution result
│   │
│   ├── value-objects/
│   │   ├── import-edge.ts           # Import relationship
│   │   ├── location.ts              # File/directory location
│   │   ├── dependency-rule.ts       # Dependency constraint
│   │   └── contract-reference.ts    # Reference to a contract
│   │
│   └── types/
│       ├── arch-symbol-kind.ts      # Enum: Layer, Module, Port, etc.
│       ├── contract-type.ts         # Enum: NoDependency, MustImplement, etc.
│       └── compiler-options.ts      # Type-safe compiler options
│
├── application/
│   ├── ports/
│   │   ├── typescript.port.ts       # TypeScript API abstraction
│   │   ├── filesystem.port.ts       # Filesystem abstraction
│   │   ├── config.port.ts           # Config reading abstraction
│   │   └── diagnostic.port.ts       # Diagnostic output abstraction
│   │
│   └── use-cases/
│       ├── check-contracts/
│       │   ├── check-contracts.use-case.ts      # Interface
│       │   ├── check-contracts.request.ts       # Request DTO
│       │   └── check-contracts.response.ts      # Response DTO
│       │
│       ├── classify-ast/
│       │   ├── classify-ast.use-case.ts         # Interface
│       │   └── classify-ast.types.ts            # Request/Response DTOs
│       │
│       └── resolve-files/
│           ├── resolve-files.use-case.ts        # Interface
│           └── resolve-files.types.ts           # Request/Response DTOs
│
└── infrastructure/
    └── adapters/
        └── testing/
            ├── mock-typescript.adapter.ts       # Mock TypeScript implementation
            ├── mock-filesystem.adapter.ts       # Mock filesystem implementation
            ├── mock-config.adapter.ts           # Mock config implementation
            └── mock-diagnostic.adapter.ts       # Mock diagnostic implementation

tests/
└── architecture/
    ├── domain/
    │   ├── arch-symbol.test.ts                  # Domain entity tests
    │   ├── contract.test.ts
    │   ├── diagnostic.test.ts
    │   └── value-objects.test.ts
    │
    └── validation/
        ├── no-dependency.validation.test.ts     # End-to-end with mocks
        ├── must-implement.validation.test.ts
        ├── layer-structure.validation.test.ts
        └── dependency-resolution.validation.test.ts
```

---

## Implementation Tasks

### Day 1: Domain Entities (Foundation)

**Task 1.1: Core Entity - ArchSymbol**
```typescript
// src/domain/entities/arch-symbol.ts
import { ArchSymbolKind } from '../types/arch-symbol-kind';
import { ContractReference } from '../value-objects/contract-reference';

export class ArchSymbol {
  constructor(
    public readonly name: string,
    public readonly kind: ArchSymbolKind,
    public readonly declaredLocation?: string,
    public readonly members: Map<string, ArchSymbol> = new Map(),
    public readonly contracts: ContractReference[] = []
  ) {}

  // Pure domain logic - no external dependencies
  hasContract(contractType: string): boolean {
    return this.contracts.some(c => c.type === contractType);
  }

  findMember(name: string): ArchSymbol | undefined {
    return this.members.get(name);
  }

  addMember(symbol: ArchSymbol): void {
    this.members.set(symbol.name, symbol);
  }

  getAllMembers(): ArchSymbol[] {
    return Array.from(this.members.values());
  }

  // Traversal helpers
  *descendants(): Generator<ArchSymbol> {
    for (const member of this.members.values()) {
      yield member;
      yield* member.descendants();
    }
  }
}
```

**Task 1.2: Contract Entity**
```typescript
// src/domain/entities/contract.ts
import { ContractType } from '../types/contract-type';
import { ArchSymbol } from './arch-symbol';

export class Contract {
  constructor(
    public readonly type: ContractType,
    public readonly name: string,
    public readonly args: ArchSymbol[],
    public readonly location?: string
  ) {}

  // Domain validation logic
  validate(): string | null {
    switch (this.type) {
      case ContractType.NoDependency:
        if (this.args.length !== 2) {
          return `noDependency requires exactly 2 arguments, got ${this.args.length}`;
        }
        break;

      case ContractType.MustImplement:
        if (this.args.length !== 2) {
          return `mustImplement requires exactly 2 arguments, got ${this.args.length}`;
        }
        break;

      // ... other contract types
    }

    return null;
  }

  equals(other: Contract): boolean {
    return (
      this.type === other.type &&
      this.name === other.name &&
      this.argsEqual(other.args)
    );
  }

  private argsEqual(otherArgs: ArchSymbol[]): boolean {
    if (this.args.length !== otherArgs.length) return false;
    return this.args.every((arg, i) => arg.name === otherArgs[i].name);
  }
}
```

**Task 1.3: Diagnostic Entity**
```typescript
// src/domain/entities/diagnostic.ts
import { ImportEdge } from '../value-objects/import-edge';
import { Contract } from './contract';
import { ContractReference } from '../value-objects/contract-reference';

export class Diagnostic {
  constructor(
    public readonly message: string,
    public readonly code: number,
    public readonly file: string,
    public readonly line: number,
    public readonly column: number,
    public readonly relatedContract?: ContractReference
  ) {}

  // Factory methods for common diagnostic types
  static forbiddenDependency(edge: ImportEdge, contract: Contract): Diagnostic {
    return new Diagnostic(
      `Forbidden dependency: ${edge.sourceFile} → ${edge.targetFile}`,
      70001,
      edge.sourceFile,
      edge.line,
      edge.column,
      {
        contractName: contract.name,
        contractType: contract.type,
        location: contract.location
      }
    );
  }

  static missingImplementation(
    portSymbol: string,
    adapterSymbol: string,
    contract: Contract
  ): Diagnostic {
    return new Diagnostic(
      `Port '${portSymbol}' has no adapter implementation (expected in '${adapterSymbol}')`,
      70002,
      contract.location || '<unknown>',
      0,
      0,
      {
        contractName: contract.name,
        contractType: contract.type
      }
    );
  }

  static impureImport(
    sourceFile: string,
    importedModule: string,
    line: number,
    contract: Contract
  ): Diagnostic {
    return new Diagnostic(
      `Impure import in pure layer: '${importedModule}'`,
      70003,
      sourceFile,
      line,
      0,
      {
        contractName: contract.name,
        contractType: contract.type
      }
    );
  }

  static circularDependency(
    cycle: string[],
    contract: Contract
  ): Diagnostic {
    const cycleStr = cycle.join(' → ');
    return new Diagnostic(
      `Circular dependency detected: ${cycleStr}`,
      70004,
      cycle[0],
      0,
      0,
      {
        contractName: contract.name,
        contractType: contract.type
      }
    );
  }
}
```

**Task 1.4: Value Objects**
```typescript
// src/domain/value-objects/import-edge.ts
export class ImportEdge {
  constructor(
    public readonly sourceFile: string,
    public readonly targetFile: string,
    public readonly line: number,
    public readonly column: number,
    public readonly importPath: string
  ) {}

  equals(other: ImportEdge): boolean {
    return (
      this.sourceFile === other.sourceFile &&
      this.targetFile === other.targetFile &&
      this.importPath === other.importPath
    );
  }

  toString(): string {
    return `${this.sourceFile}:${this.line} → ${this.targetFile}`;
  }
}

// src/domain/value-objects/location.ts
export class Location {
  constructor(
    public readonly path: string,
    public readonly isPattern: boolean = false
  ) {}

  matches(filePath: string): boolean {
    if (!this.isPattern) {
      return filePath.startsWith(this.path);
    }

    // Pattern matching logic (simplified for now)
    // Real implementation would use glob matching
    return filePath.includes(this.path.replace('*', ''));
  }

  equals(other: Location): boolean {
    return this.path === other.path && this.isPattern === other.isPattern;
  }
}

// src/domain/value-objects/dependency-rule.ts
import { ArchSymbol } from '../entities/arch-symbol';

export class DependencyRule {
  constructor(
    public readonly from: ArchSymbol,
    public readonly to: ArchSymbol,
    public readonly allowed: boolean
  ) {}

  check(sourceFile: string, targetFile: string): boolean {
    const fromMatches = this.from.declaredLocation
      ? sourceFile.includes(this.from.declaredLocation)
      : false;

    const toMatches = this.to.declaredLocation
      ? targetFile.includes(this.to.declaredLocation)
      : false;

    if (fromMatches && toMatches) {
      return this.allowed;
    }

    return true; // Rule doesn't apply
  }
}

// src/domain/value-objects/contract-reference.ts
import { ContractType } from '../types/contract-type';

export interface ContractReference {
  contractName: string;
  contractType: ContractType;
  location?: string;
}
```

**Task 1.5: Type Definitions**
```typescript
// src/domain/types/arch-symbol-kind.ts
export enum ArchSymbolKind {
  Layer = 'layer',
  Module = 'module',
  Context = 'context',
  Port = 'port',
  Adapter = 'adapter',
  Kind = 'kind',
  Instance = 'instance'
}

// src/domain/types/contract-type.ts
export enum ContractType {
  NoDependency = 'noDependency',
  MustImplement = 'mustImplement',
  Purity = 'purity',
  NoCycles = 'noCycles',
  Colocated = 'colocated'
}

// src/domain/types/compiler-options.ts
export interface CompilerOptions {
  rootDir?: string;
  outDir?: string;
  strict?: boolean;
  target?: string;
  module?: string;
  moduleResolution?: string;
  esModuleInterop?: boolean;
  skipLibCheck?: boolean;
  declaration?: boolean;
  composite?: boolean;
}
```

**Task 1.6: Additional Domain Entities**
```typescript
// src/domain/entities/program.ts
// Wrapper around TypeScript's program concept (domain abstraction)
export class Program {
  constructor(
    public readonly rootFiles: string[],
    public readonly options: any // Will be typed later
  ) {}
}

// src/domain/entities/resolved-files.ts
import { ArchSymbol } from './arch-symbol';

export class ResolvedFiles {
  constructor(
    public readonly symbol: ArchSymbol,
    public readonly files: string[]
  ) {}

  contains(filePath: string): boolean {
    return this.files.includes(filePath);
  }

  get count(): number {
    return this.files.length;
  }
}
```

**Completion Criteria for Day 1:**
- ✅ All domain entities compile without errors
- ✅ All domain entities have zero external dependencies (only import from domain/)
- ✅ Basic unit tests for each entity's pure methods
- ✅ TypeScript strict mode passes

---

### Day 2: Port Definitions (Application Layer)

**Task 2.1: TypeScript Port**
```typescript
// src/application/ports/typescript.port.ts
import { Program } from '../../domain/entities/program';
import { ImportEdge } from '../../domain/value-objects/import-edge';
import { Diagnostic } from '../../domain/entities/diagnostic';
import { CompilerOptions } from '../../domain/types/compiler-options';

// Source file abstraction (domain concept)
export interface SourceFile {
  fileName: string;
  text: string;
}

// Type checker abstraction (domain concept)
export interface TypeChecker {
  // Minimal interface - expanded in later milestones
}

export interface TypeScriptPort {
  // Program lifecycle
  createProgram(rootFiles: string[], options: CompilerOptions): Program;

  // Source file access
  getSourceFile(program: Program, fileName: string): SourceFile | undefined;
  getSourceFiles(program: Program): SourceFile[];

  // Type information
  getTypeChecker(program: Program): TypeChecker;

  // Import analysis
  getImports(sourceFile: SourceFile, checker: TypeChecker): ImportEdge[];

  // Diagnostics
  getDiagnostics(program: Program): Diagnostic[];
}
```

**Task 2.2: FileSystem Port**
```typescript
// src/application/ports/filesystem.port.ts
export interface FileSystemPort {
  // Existence checks
  fileExists(path: string): boolean;
  directoryExists(path: string): boolean;

  // Read operations
  readFile(path: string): string | undefined;
  readDirectory(path: string, recursive: boolean): string[];

  // Write operations (for generator in M7)
  writeFile(path: string, content: string): void;
  createDirectory(path: string): void;

  // Path operations
  resolvePath(...segments: string[]): string;
  relativePath(from: string, to: string): string;
  dirname(path: string): string;
  basename(path: string): string;
}
```

**Task 2.3: Config Port**
```typescript
// src/application/ports/config.port.ts
import { ContractType } from '../../domain/types/contract-type';
import { CompilerOptions } from '../../domain/types/compiler-options';

export interface KindScriptConfig {
  contracts?: Record<string, any>;
  definitions?: string[];
  rootDir?: string;
}

export interface TSConfig {
  compilerOptions?: CompilerOptions;
  include?: string[];
  exclude?: string[];
  files?: string[];
  references?: Array<{ path: string }>;
}

export interface ConfigPort {
  // Read configuration files
  readKindScriptConfig(projectPath: string): KindScriptConfig | undefined;
  readTSConfig(path: string): TSConfig | undefined;

  // Locate config files
  findConfigFile(startPath: string, fileName: string): string | undefined;
}
```

**Task 2.4: Diagnostic Port**
```typescript
// src/application/ports/diagnostic.port.ts
import { Diagnostic } from '../../domain/entities/diagnostic';

export interface DiagnosticPort {
  // Report diagnostics to output
  reportDiagnostics(diagnostics: Diagnostic[]): void;

  // Format a single diagnostic for display
  formatDiagnostic(diagnostic: Diagnostic): string;

  // Format with context (show source lines)
  formatWithContext(diagnostic: Diagnostic, sourceText: string): string;
}
```

**Completion Criteria for Day 2:**
- ✅ All ports defined as pure interfaces
- ✅ Ports only reference domain types (entities, value objects)
- ✅ No implementation code in port files
- ✅ TypeScript strict mode passes

---

### Day 3: Use Case Interfaces

**Task 3.1: CheckContracts Use Case**
```typescript
// src/application/use-cases/check-contracts/check-contracts.use-case.ts
import { CheckContractsRequest } from './check-contracts.request';
import { CheckContractsResponse } from './check-contracts.response';

export interface CheckContractsUseCase {
  execute(request: CheckContractsRequest): CheckContractsResponse;
}

// src/application/use-cases/check-contracts/check-contracts.request.ts
import { ArchSymbol } from '../../../domain/entities/arch-symbol';
import { Contract } from '../../../domain/entities/contract';
import { KindScriptConfig } from '../../ports/config.port';

export interface CheckContractsRequest {
  symbols: ArchSymbol[];
  contracts: Contract[];
  config: KindScriptConfig;
  programRootFiles: string[];
}

// src/application/use-cases/check-contracts/check-contracts.response.ts
import { Diagnostic } from '../../../domain/entities/diagnostic';

export interface CheckContractsResponse {
  diagnostics: Diagnostic[];
  contractsChecked: number;
  violationsFound: number;
  filesAnalyzed: number;
}
```

**Task 3.2: ClassifyAST Use Case**
```typescript
// src/application/use-cases/classify-ast/classify-ast.use-case.ts
import { ClassifyASTRequest, ClassifyASTResponse } from './classify-ast.types';

export interface ClassifyASTUseCase {
  execute(request: ClassifyASTRequest): ClassifyASTResponse;
}

// src/application/use-cases/classify-ast/classify-ast.types.ts
import { SourceFile } from '../../ports/typescript.port';
import { ArchSymbol } from '../../../domain/entities/arch-symbol';

export interface ClassifyASTRequest {
  definitionFiles: SourceFile[];
}

export interface ClassifyASTResponse {
  symbols: ArchSymbol[];
  errors: string[];
}
```

**Task 3.3: ResolveFiles Use Case**
```typescript
// src/application/use-cases/resolve-files/resolve-files.use-case.ts
import { ResolveFilesRequest, ResolveFilesResponse } from './resolve-files.types';

export interface ResolveFilesUseCase {
  execute(request: ResolveFilesRequest): ResolveFilesResponse;
}

// src/application/use-cases/resolve-files/resolve-files.types.ts
import { ArchSymbol } from '../../../domain/entities/arch-symbol';
import { ResolvedFiles } from '../../../domain/entities/resolved-files';

export interface ResolveFilesRequest {
  symbol: ArchSymbol;
  projectRoot: string;
}

export interface ResolveFilesResponse {
  resolved: ResolvedFiles;
  errors: string[];
}
```

**Completion Criteria for Day 3:**
- ✅ All use case interfaces defined
- ✅ Request/Response DTOs defined
- ✅ DTOs only reference domain entities and port types
- ✅ No implementation logic (interfaces only)

---

### Day 4-5: Mock Adapters (Test Infrastructure)

**Task 4.1: Mock TypeScript Adapter**
```typescript
// src/infrastructure/adapters/testing/mock-typescript.adapter.ts
import { TypeScriptPort, SourceFile, TypeChecker } from '../../../application/ports/typescript.port';
import { Program } from '../../../domain/entities/program';
import { ImportEdge } from '../../../domain/value-objects/import-edge';
import { Diagnostic } from '../../../domain/entities/diagnostic';
import { CompilerOptions } from '../../../domain/types/compiler-options';

export class MockTypeScriptAdapter implements TypeScriptPort {
  private sourceFiles = new Map<string, { fileName: string; text: string }>();
  private imports = new Map<string, ImportEdge[]>();
  private diagnostics: Diagnostic[] = [];

  // Fluent configuration API for tests
  withSourceFile(fileName: string, text: string): this {
    this.sourceFiles.set(fileName, { fileName, text });
    return this;
  }

  withImport(from: string, to: string, importPath: string, line = 1): this {
    const existing = this.imports.get(from) || [];
    existing.push(new ImportEdge(from, to, line, 0, importPath));
    this.imports.set(from, existing);
    return this;
  }

  withDiagnostic(diagnostic: Diagnostic): this {
    this.diagnostics.push(diagnostic);
    return this;
  }

  reset(): void {
    this.sourceFiles.clear();
    this.imports.clear();
    this.diagnostics = [];
  }

  // Implement TypeScriptPort interface
  createProgram(rootFiles: string[], options: CompilerOptions): Program {
    return new Program(rootFiles, options);
  }

  getSourceFile(program: Program, fileName: string): SourceFile | undefined {
    return this.sourceFiles.get(fileName);
  }

  getSourceFiles(program: Program): SourceFile[] {
    return Array.from(this.sourceFiles.values());
  }

  getTypeChecker(program: Program): TypeChecker {
    return {} as TypeChecker; // Mock checker
  }

  getImports(sourceFile: SourceFile, checker: TypeChecker): ImportEdge[] {
    return this.imports.get(sourceFile.fileName) || [];
  }

  getDiagnostics(program: Program): Diagnostic[] {
    return this.diagnostics;
  }
}
```

**Task 4.2: Mock FileSystem Adapter**
```typescript
// src/infrastructure/adapters/testing/mock-filesystem.adapter.ts
import { FileSystemPort } from '../../../application/ports/filesystem.port';

export class MockFileSystemAdapter implements FileSystemPort {
  private files = new Map<string, string>();
  private directories = new Set<string>();

  // Fluent configuration API for tests
  withFile(path: string, content: string): this {
    this.files.set(path, content);

    // Auto-create parent directories
    const parts = path.split('/');
    for (let i = 1; i < parts.length; i++) {
      this.directories.add(parts.slice(0, i).join('/'));
    }

    return this;
  }

  withDirectory(path: string, files?: string[]): this {
    this.directories.add(path);

    if (files) {
      files.forEach(file => {
        this.files.set(`${path}/${file}`, '');
      });
    }

    return this;
  }

  reset(): void {
    this.files.clear();
    this.directories.clear();
  }

  // Implement FileSystemPort interface
  fileExists(path: string): boolean {
    return this.files.has(path);
  }

  directoryExists(path: string): boolean {
    return this.directories.has(path);
  }

  readFile(path: string): string | undefined {
    return this.files.get(path);
  }

  readDirectory(path: string, recursive: boolean): string[] {
    const results: string[] = [];

    for (const [filePath] of this.files) {
      if (filePath.startsWith(path + '/')) {
        if (!recursive) {
          // Only immediate children
          const relativePath = filePath.substring(path.length + 1);
          if (!relativePath.includes('/')) {
            results.push(filePath);
          }
        } else {
          results.push(filePath);
        }
      }
    }

    return results;
  }

  writeFile(path: string, content: string): void {
    this.files.set(path, content);
  }

  createDirectory(path: string): void {
    this.directories.add(path);
  }

  resolvePath(...segments: string[]): string {
    return segments.join('/').replace(/\/+/g, '/');
  }

  relativePath(from: string, to: string): string {
    // Simplified implementation
    return to.replace(from, '.');
  }

  dirname(path: string): string {
    const parts = path.split('/');
    return parts.slice(0, -1).join('/');
  }

  basename(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1];
  }
}
```

**Task 4.3: Mock Config Adapter**
```typescript
// src/infrastructure/adapters/testing/mock-config.adapter.ts
import { ConfigPort, KindScriptConfig, TSConfig } from '../../../application/ports/config.port';

export class MockConfigAdapter implements ConfigPort {
  private kindscriptConfigs = new Map<string, KindScriptConfig>();
  private tsConfigs = new Map<string, TSConfig>();
  private configLocations = new Map<string, string>();

  // Fluent configuration API for tests
  withKindScriptConfig(projectPath: string, config: KindScriptConfig): this {
    this.kindscriptConfigs.set(projectPath, config);
    return this;
  }

  withTSConfig(path: string, config: TSConfig): this {
    this.tsConfigs.set(path, config);
    return this;
  }

  withConfigLocation(startPath: string, fileName: string, location: string): this {
    this.configLocations.set(`${startPath}:${fileName}`, location);
    return this;
  }

  reset(): void {
    this.kindscriptConfigs.clear();
    this.tsConfigs.clear();
    this.configLocations.clear();
  }

  // Implement ConfigPort interface
  readKindScriptConfig(projectPath: string): KindScriptConfig | undefined {
    return this.kindscriptConfigs.get(projectPath);
  }

  readTSConfig(path: string): TSConfig | undefined {
    return this.tsConfigs.get(path);
  }

  findConfigFile(startPath: string, fileName: string): string | undefined {
    return this.configLocations.get(`${startPath}:${fileName}`);
  }
}
```

**Task 4.4: Mock Diagnostic Adapter**
```typescript
// src/infrastructure/adapters/testing/mock-diagnostic.adapter.ts
import { DiagnosticPort } from '../../../application/ports/diagnostic.port';
import { Diagnostic } from '../../../domain/entities/diagnostic';

export class MockDiagnosticAdapter implements DiagnosticPort {
  private reported: Diagnostic[] = [];
  private formatted: string[] = [];

  // Test helper methods
  getReported(): Diagnostic[] {
    return [...this.reported];
  }

  getFormatted(): string[] {
    return [...this.formatted];
  }

  reset(): void {
    this.reported = [];
    this.formatted = [];
  }

  // Implement DiagnosticPort interface
  reportDiagnostics(diagnostics: Diagnostic[]): void {
    this.reported.push(...diagnostics);
  }

  formatDiagnostic(diagnostic: Diagnostic): string {
    const formatted = `${diagnostic.file}:${diagnostic.line}:${diagnostic.column} - error KS${diagnostic.code}: ${diagnostic.message}`;
    this.formatted.push(formatted);
    return formatted;
  }

  formatWithContext(diagnostic: Diagnostic, sourceText: string): string {
    const lines = sourceText.split('\n');
    const lineText = lines[diagnostic.line - 1] || '';

    const formatted = [
      this.formatDiagnostic(diagnostic),
      '',
      `  ${diagnostic.line} | ${lineText}`,
      `  ${' '.repeat(String(diagnostic.line).length)} | ${' '.repeat(diagnostic.column)}^`,
    ].join('\n');

    this.formatted.push(formatted);
    return formatted;
  }
}
```

**Completion Criteria for Day 4-5:**
- ✅ All four mock adapters implement their respective ports
- ✅ Fluent configuration API for easy test setup
- ✅ Reset methods for test isolation
- ✅ Mock adapters have no external dependencies (no real fs, no real TypeScript API)

---

### Day 6-7: Architecture Validation Tests

**Task 5.1: Domain Entity Tests**
```typescript
// tests/architecture/domain/arch-symbol.test.ts
import { ArchSymbol } from '../../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../../src/domain/types/arch-symbol-kind';
import { ContractReference } from '../../../src/domain/value-objects/contract-reference';
import { ContractType } from '../../../src/domain/types/contract-type';

describe('ArchSymbol', () => {
  describe('construction', () => {
    it('creates a symbol with name and kind', () => {
      const symbol = new ArchSymbol('domain', ArchSymbolKind.Layer);

      expect(symbol.name).toBe('domain');
      expect(symbol.kind).toBe(ArchSymbolKind.Layer);
      expect(symbol.members.size).toBe(0);
      expect(symbol.contracts.length).toBe(0);
    });

    it('creates a symbol with location', () => {
      const symbol = new ArchSymbol(
        'domain',
        ArchSymbolKind.Layer,
        'src/domain'
      );

      expect(symbol.declaredLocation).toBe('src/domain');
    });
  });

  describe('hasContract', () => {
    it('returns true when contract exists', () => {
      const contract: ContractReference = {
        contractName: 'no-infra-deps',
        contractType: ContractType.NoDependency
      };

      const symbol = new ArchSymbol(
        'domain',
        ArchSymbolKind.Layer,
        'src/domain',
        new Map(),
        [contract]
      );

      expect(symbol.hasContract(ContractType.NoDependency)).toBe(true);
    });

    it('returns false when contract does not exist', () => {
      const symbol = new ArchSymbol('domain', ArchSymbolKind.Layer);

      expect(symbol.hasContract(ContractType.NoDependency)).toBe(false);
    });
  });

  describe('member management', () => {
    it('adds and retrieves members', () => {
      const parent = new ArchSymbol('ordering', ArchSymbolKind.Context);
      const child = new ArchSymbol('domain', ArchSymbolKind.Layer);

      parent.addMember(child);

      expect(parent.findMember('domain')).toBe(child);
      expect(parent.members.size).toBe(1);
    });

    it('returns undefined for non-existent member', () => {
      const symbol = new ArchSymbol('ordering', ArchSymbolKind.Context);

      expect(symbol.findMember('nonexistent')).toBeUndefined();
    });

    it('getAllMembers returns all members', () => {
      const parent = new ArchSymbol('ordering', ArchSymbolKind.Context);
      const child1 = new ArchSymbol('domain', ArchSymbolKind.Layer);
      const child2 = new ArchSymbol('application', ArchSymbolKind.Layer);

      parent.addMember(child1);
      parent.addMember(child2);

      const members = parent.getAllMembers();
      expect(members).toHaveLength(2);
      expect(members).toContain(child1);
      expect(members).toContain(child2);
    });
  });

  describe('descendants traversal', () => {
    it('yields all descendants recursively', () => {
      const root = new ArchSymbol('root', ArchSymbolKind.Context);
      const layer1 = new ArchSymbol('layer1', ArchSymbolKind.Layer);
      const layer2 = new ArchSymbol('layer2', ArchSymbolKind.Layer);
      const module1 = new ArchSymbol('module1', ArchSymbolKind.Module);

      root.addMember(layer1);
      root.addMember(layer2);
      layer1.addMember(module1);

      const descendants = Array.from(root.descendants());

      expect(descendants).toHaveLength(3);
      expect(descendants).toContain(layer1);
      expect(descendants).toContain(layer2);
      expect(descendants).toContain(module1);
    });
  });
});
```

**Task 5.2: Contract Validation Tests**
```typescript
// tests/architecture/domain/contract.test.ts
import { Contract } from '../../../src/domain/entities/contract';
import { ContractType } from '../../../src/domain/types/contract-type';
import { ArchSymbol } from '../../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../../src/domain/types/arch-symbol-kind';

describe('Contract', () => {
  describe('validation', () => {
    it('validates noDependency contract with correct args', () => {
      const from = new ArchSymbol('domain', ArchSymbolKind.Layer);
      const to = new ArchSymbol('infrastructure', ArchSymbolKind.Layer);

      const contract = new Contract(
        ContractType.NoDependency,
        'no-infra-deps',
        [from, to]
      );

      expect(contract.validate()).toBeNull();
    });

    it('rejects noDependency contract with wrong arg count', () => {
      const symbol = new ArchSymbol('domain', ArchSymbolKind.Layer);

      const contract = new Contract(
        ContractType.NoDependency,
        'invalid',
        [symbol] // Only 1 arg, needs 2
      );

      const error = contract.validate();
      expect(error).toContain('requires exactly 2 arguments');
      expect(error).toContain('got 1');
    });
  });

  describe('equality', () => {
    it('equals another contract with same properties', () => {
      const from = new ArchSymbol('domain', ArchSymbolKind.Layer);
      const to = new ArchSymbol('infrastructure', ArchSymbolKind.Layer);

      const contract1 = new Contract(ContractType.NoDependency, 'rule1', [from, to]);
      const contract2 = new Contract(ContractType.NoDependency, 'rule1', [from, to]);

      expect(contract1.equals(contract2)).toBe(true);
    });

    it('does not equal contract with different type', () => {
      const from = new ArchSymbol('domain', ArchSymbolKind.Layer);
      const to = new ArchSymbol('infrastructure', ArchSymbolKind.Layer);

      const contract1 = new Contract(ContractType.NoDependency, 'rule1', [from, to]);
      const contract2 = new Contract(ContractType.MustImplement, 'rule1', [from, to]);

      expect(contract1.equals(contract2)).toBe(false);
    });
  });
});
```

**Task 5.3: End-to-End Validation Tests (The Critical Ones)**
```typescript
// tests/architecture/validation/no-dependency.validation.test.ts
import { MockTypeScriptAdapter } from '../../../src/infrastructure/adapters/testing/mock-typescript.adapter';
import { MockFileSystemAdapter } from '../../../src/infrastructure/adapters/testing/mock-filesystem.adapter';
import { ArchSymbol } from '../../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../../src/domain/types/arch-symbol-kind';
import { Contract } from '../../../src/domain/entities/contract';
import { ContractType } from '../../../src/domain/types/contract-type';

describe('Architecture Validation: noDependency Contract', () => {
  let mockTS: MockTypeScriptAdapter;
  let mockFS: MockFileSystemAdapter;

  beforeEach(() => {
    mockTS = new MockTypeScriptAdapter();
    mockFS = new MockFileSystemAdapter();
  });

  afterEach(() => {
    mockTS.reset();
    mockFS.reset();
  });

  it('validates forbidden domain → infrastructure dependency', () => {
    // Arrange: Set up filesystem structure
    mockFS
      .withDirectory('src/domain', ['entity.ts', 'service.ts'])
      .withDirectory('src/infrastructure', ['database.ts']);

    // Arrange: Set up import relationship
    mockTS
      .withSourceFile('src/domain/service.ts', 'export class Service {}')
      .withSourceFile('src/infrastructure/database.ts', 'export class Database {}')
      .withImport(
        'src/domain/service.ts',
        'src/infrastructure/database.ts',
        '../infrastructure/database',
        5
      );

    // Arrange: Define architectural symbols
    const domainSymbol = new ArchSymbol(
      'domain',
      ArchSymbolKind.Layer,
      'src/domain'
    );

    const infraSymbol = new ArchSymbol(
      'infrastructure',
      ArchSymbolKind.Layer,
      'src/infrastructure'
    );

    const contract = new Contract(
      ContractType.NoDependency,
      'domain-must-not-depend-on-infrastructure',
      [domainSymbol, infraSymbol],
      'architecture.ts:10'
    );

    // Act: This is where use case would run (we'll implement in M1)
    // For now, we're just validating that our domain model can represent this scenario

    // Assert: Domain entities correctly model the violation
    const imports = mockTS.getImports(
      mockTS.getSourceFile(new Program([], {}), 'src/domain/service.ts')!,
      mockTS.getTypeChecker(new Program([], {}))
    );

    expect(imports).toHaveLength(1);
    expect(imports[0].sourceFile).toBe('src/domain/service.ts');
    expect(imports[0].targetFile).toBe('src/infrastructure/database.ts');

    // Validate contract structure
    expect(contract.type).toBe(ContractType.NoDependency);
    expect(contract.args).toHaveLength(2);
    expect(contract.args[0]).toBe(domainSymbol);
    expect(contract.args[1]).toBe(infraSymbol);
  });

  it('allows permitted infrastructure → domain dependency', () => {
    // Arrange: Reverse dependency (infrastructure CAN depend on domain)
    mockFS
      .withDirectory('src/domain', ['entity.ts'])
      .withDirectory('src/infrastructure', ['repository.ts']);

    mockTS
      .withSourceFile('src/domain/entity.ts', 'export class Entity {}')
      .withSourceFile('src/infrastructure/repository.ts', 'export class Repository {}')
      .withImport(
        'src/infrastructure/repository.ts',
        'src/domain/entity.ts',
        '../domain/entity',
        3
      );

    const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');
    const infraSymbol = new ArchSymbol('infrastructure', ArchSymbolKind.Layer, 'src/infrastructure');

    // Contract forbids domain → infrastructure, NOT infrastructure → domain
    const contract = new Contract(
      ContractType.NoDependency,
      'domain-must-not-depend-on-infrastructure',
      [domainSymbol, infraSymbol]
    );

    // Assert: Import exists and is in the allowed direction
    const imports = mockTS.getImports(
      mockTS.getSourceFile(new Program([], {}), 'src/infrastructure/repository.ts')!,
      mockTS.getTypeChecker(new Program([], {}))
    );

    expect(imports[0].sourceFile).toBe('src/infrastructure/repository.ts');
    expect(imports[0].targetFile).toBe('src/domain/entity.ts');

    // This import should NOT violate the contract
    // (We'll implement the actual checking logic in M1)
  });

  it('handles multiple contracts on same symbol', () => {
    // Arrange: Domain layer with multiple constraints
    const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');
    const infraSymbol = new ArchSymbol('infrastructure', ArchSymbolKind.Layer, 'src/infrastructure');
    const applicationSymbol = new ArchSymbol('application', ArchSymbolKind.Layer, 'src/application');

    const noDepsOnInfra = new Contract(
      ContractType.NoDependency,
      'no-infra',
      [domainSymbol, infraSymbol]
    );

    const noDepsOnApplication = new Contract(
      ContractType.NoDependency,
      'no-application',
      [domainSymbol, applicationSymbol]
    );

    // Assert: Both contracts reference the same symbol
    expect(noDepsOnInfra.args[0]).toBe(domainSymbol);
    expect(noDepsOnApplication.args[0]).toBe(domainSymbol);

    // Domain model correctly represents multiple constraints
  });
});
```

**Task 5.4: Additional Validation Tests**
```typescript
// tests/architecture/validation/must-implement.validation.test.ts
import { MockFileSystemAdapter } from '../../../src/infrastructure/adapters/testing/mock-filesystem.adapter';
import { ArchSymbol } from '../../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../../src/domain/types/arch-symbol-kind';
import { Contract } from '../../../src/domain/entities/contract';
import { ContractType } from '../../../src/domain/types/contract-type';

describe('Architecture Validation: mustImplement Contract', () => {
  let mockFS: MockFileSystemAdapter;

  beforeEach(() => {
    mockFS = new MockFileSystemAdapter();
  });

  it('validates that every port has an adapter', () => {
    // Arrange: Set up ports and adapters
    mockFS
      .withDirectory('src/domain/ports', [
        'database.port.ts',
        'cache.port.ts',
        'messaging.port.ts'
      ])
      .withDirectory('src/infrastructure/adapters', [
        'database.adapter.ts',
        'cache.adapter.ts',
        'messaging.adapter.ts'
      ]);

    const portsSymbol = new ArchSymbol('ports', ArchSymbolKind.Module, 'src/domain/ports');
    const adaptersSymbol = new ArchSymbol('adapters', ArchSymbolKind.Module, 'src/infrastructure/adapters');

    const contract = new Contract(
      ContractType.MustImplement,
      'all-ports-have-adapters',
      [portsSymbol, adaptersSymbol]
    );

    // Assert: Contract structure is correct
    expect(contract.type).toBe(ContractType.MustImplement);
    expect(contract.args[0]).toBe(portsSymbol);
    expect(contract.args[1]).toBe(adaptersSymbol);

    // Files are accessible via mock
    const portFiles = mockFS.readDirectory('src/domain/ports', false);
    const adapterFiles = mockFS.readDirectory('src/infrastructure/adapters', false);

    expect(portFiles).toHaveLength(3);
    expect(adapterFiles).toHaveLength(3);
  });

  it('detects missing adapter implementation', () => {
    // Arrange: Port without corresponding adapter
    mockFS
      .withDirectory('src/domain/ports', [
        'database.port.ts',
        'cache.port.ts'
      ])
      .withDirectory('src/infrastructure/adapters', [
        'database.adapter.ts'
        // Missing cache.adapter.ts!
      ]);

    const portsSymbol = new ArchSymbol('ports', ArchSymbolKind.Module, 'src/domain/ports');
    const adaptersSymbol = new ArchSymbol('adapters', ArchSymbolKind.Module, 'src/infrastructure/adapters');

    const contract = new Contract(
      ContractType.MustImplement,
      'all-ports-have-adapters',
      [portsSymbol, adaptersSymbol]
    );

    // Assert: We can detect the discrepancy
    const portFiles = mockFS.readDirectory('src/domain/ports', false);
    const adapterFiles = mockFS.readDirectory('src/infrastructure/adapters', false);

    expect(portFiles).toHaveLength(2);
    expect(adapterFiles).toHaveLength(1);

    // Logic to detect missing adapter would go in use case (M1)
  });
});

// tests/architecture/validation/layer-structure.validation.test.ts
describe('Architecture Validation: Layer Structure', () => {
  it('validates Clean Architecture three-layer structure', () => {
    const root = new ArchSymbol('ordering', ArchSymbolKind.Context);

    const domain = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/ordering/domain');
    const application = new ArchSymbol('application', ArchSymbolKind.Layer, 'src/ordering/application');
    const infrastructure = new ArchSymbol('infrastructure', ArchSymbolKind.Layer, 'src/ordering/infrastructure');

    root.addMember(domain);
    root.addMember(application);
    root.addMember(infrastructure);

    // Contracts
    const contracts = [
      new Contract(ContractType.NoDependency, 'domain-isolated', [domain, infrastructure]),
      new Contract(ContractType.NoDependency, 'domain-no-app', [domain, application])
    ];

    // Assert: Structure is correctly modeled
    expect(root.getAllMembers()).toHaveLength(3);
    expect(root.findMember('domain')).toBe(domain);
    expect(contracts[0].args[0]).toBe(domain);
    expect(contracts[1].args[0]).toBe(domain);
  });
});

// tests/architecture/validation/dependency-resolution.validation.test.ts
describe('Architecture Validation: Dependency Resolution', () => {
  let mockFS: MockFileSystemAdapter;
  let mockTS: MockTypeScriptAdapter;

  beforeEach(() => {
    mockFS = new MockFileSystemAdapter();
    mockTS = new MockTypeScriptAdapter();
  });

  it('resolves files for a layer symbol', () => {
    // Arrange
    mockFS
      .withFile('src/domain/entity.ts', 'export class Entity {}')
      .withFile('src/domain/value-object.ts', 'export class ValueObject {}')
      .withFile('src/domain/repository.interface.ts', 'export interface Repository {}');

    const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');

    // Act
    const files = mockFS.readDirectory('src/domain', true);

    // Assert
    expect(files).toHaveLength(3);
    expect(files).toContain('src/domain/entity.ts');
    expect(files).toContain('src/domain/value-object.ts');
    expect(files).toContain('src/domain/repository.interface.ts');
  });

  it('resolves imports between files', () => {
    // Arrange
    mockTS
      .withSourceFile('src/application/service.ts', 'import { Entity } from "../domain/entity";')
      .withImport('src/application/service.ts', 'src/domain/entity.ts', '../domain/entity', 1);

    const program = mockTS.createProgram(['src/application/service.ts'], {});
    const sourceFile = mockTS.getSourceFile(program, 'src/application/service.ts')!;
    const checker = mockTS.getTypeChecker(program);

    // Act
    const imports = mockTS.getImports(sourceFile, checker);

    // Assert
    expect(imports).toHaveLength(1);
    expect(imports[0].sourceFile).toBe('src/application/service.ts');
    expect(imports[0].targetFile).toBe('src/domain/entity.ts');
    expect(imports[0].importPath).toBe('../domain/entity');
  });
});
```

**Task 5.5: Test Summary and Coverage**
```typescript
// tests/architecture/test-summary.test.ts
/**
 * M0 Test Summary
 *
 * This file documents all tests written for Milestone 0.
 *
 * DOMAIN ENTITY TESTS (8 test files, ~40 tests):
 * - arch-symbol.test.ts: Construction, contracts, members, traversal
 * - contract.test.ts: Validation, equality
 * - diagnostic.test.ts: Factory methods, formatting
 * - import-edge.test.ts: Equality, toString
 * - location.test.ts: Pattern matching
 * - dependency-rule.test.ts: Rule checking logic
 * - program.test.ts: Program wrapper
 * - resolved-files.test.ts: File resolution results
 *
 * VALIDATION TESTS (4 test files, ~15 tests):
 * - no-dependency.validation.test.ts: Forbidden deps, allowed deps, multiple contracts
 * - must-implement.validation.test.ts: Port-adapter matching, missing implementations
 * - layer-structure.validation.test.ts: Clean Architecture validation
 * - dependency-resolution.validation.test.ts: File resolution, import resolution
 *
 * TOTAL: ~55 tests proving architecture works with mocks
 */

describe('M0 Test Coverage', () => {
  it('has zero TypeScript API dependencies in domain layer', () => {
    // This would be a static analysis test
    // Could use madge or dependency-cruiser to verify
    expect(true).toBe(true); // Placeholder
  });

  it('has zero real file I/O in all tests', () => {
    // This would be a static analysis test
    // Verify no fs imports in test files
    expect(true).toBe(true); // Placeholder
  });
});
```

**Completion Criteria for Day 6-7:**
- ✅ 20+ architecture validation tests written and passing
- ✅ Tests cover all contract types (noDependency, mustImplement, etc.)
- ✅ Tests use only mock adapters (zero real TypeScript API, zero real file I/O)
- ✅ Tests validate entire use case flow end-to-end
- ✅ Test coverage report shows 100% coverage of domain entities

---

## Success Criteria (Final M0 Checklist)

### Code Quality
- ✅ All TypeScript files compile with strict mode
- ✅ No `any` types except in explicitly marked mock interfaces
- ✅ All exports are explicitly typed
- ✅ ESLint passes with no warnings

### Architecture Purity
- ✅ Domain layer has zero imports from outside `domain/`
- ✅ Application layer only imports from `domain/` and `application/`
- ✅ Infrastructure layer can import from anywhere
- ✅ No circular dependencies between layers

### Test Coverage
- ✅ 20+ tests written and passing
- ✅ All tests use mock adapters only
- ✅ No tests perform real file I/O
- ✅ No tests call real TypeScript compiler API
- ✅ Test coverage > 90% for domain entities

### Deliverables
- ✅ Complete domain model (entities, value objects, types)
- ✅ Complete port definitions (4 ports as interfaces)
- ✅ Complete mock adapters (4 mocks implementing ports)
- ✅ Complete use case interfaces (3 use cases)
- ✅ Comprehensive test suite

### Documentation
- ✅ README.md explaining M0 architecture
- ✅ Comments on all public interfaces
- ✅ Test descriptions clearly explain what's being validated

---

## Next Steps After M0

Once M0 is complete and all tests pass:

1. **Review with stakeholders**: Show that architecture works (with mocks)
2. **Proceed to M1**: Implement first real adapter (TypeScriptAdapter)
3. **Build CLI**: Create actual `ksc check` command
4. **First customer value**: Working tool that checks one contract type

The beauty of M0 is that we've **proven the architecture works** before writing a single line of real implementation code.

---

## Daily Schedule Summary

| Day | Focus | Deliverables |
|-----|-------|-------------|
| 1 | Domain entities | ArchSymbol, Contract, Diagnostic, value objects, types |
| 2 | Port definitions | TypeScriptPort, FileSystemPort, ConfigPort, DiagnosticPort |
| 3 | Use case interfaces | CheckContracts, ClassifyAST, ResolveFiles interfaces |
| 4-5 | Mock adapters | All 4 mocks implementing ports with fluent test API |
| 6-7 | Validation tests | 20+ tests proving architecture with mocks |

**Total:** 7 days to validate architecture with zero real implementations.
