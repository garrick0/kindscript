# KindScript Incremental Build Plan
## Clean Architecture with Customer Validation Gates

> **📖 Architecture Reference:** This build plan implements the architecture defined in
> `COMPILER_ARCHITECTURE.md`. For design rationale, component details, and
> ecosystem evidence, refer to that document.
>
> **Key V4 Sections:**
> - **Part 1**: TypeScript compiler architecture (what we're building on)
> - **Part 4**: What KindScript adds (binder, checker, host, generator)
> - **Part 4.1**: The Binder/Classifier (→ M2 in this plan)
> - **Part 4.3**: The Checker/Contract Evaluation (→ M1, M3 in this plan)
> - **Part 4.4**: KindScriptHost and ports (→ M0, M1 in this plan)
> - **Part 4.5**: Generator/Scaffolding (→ M7 in this plan)
> - **Part 5**: Language Service Plugin (→ M5 in this plan)
> - **Part 9**: Build/Wrap/Skip decisions with ecosystem precedents

---

## Architectural Foundation: Ports & Adapters

### Layer Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                        DOMAIN LAYER                              │
│                                                                  │
│  Entities:                                                       │
│    ArchSymbol, Contract, Diagnostic, Program                    │
│                                                                  │
│  Value Objects:                                                  │
│    Location, ImportEdge                                         │
│                                                                  │
│  No dependencies on anything. Pure business logic.              │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ uses
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                          │
│                                                                  │
│  Ports (Interfaces - defined here, implemented in infra):       │
│    TypeScriptPort, FileSystemPort, ConfigPort, DiagnosticPort  │
│    (See V4 Part 4.4 for port design rationale)                 │
│                                                                  │
│  Use Cases:                                                      │
│    ClassifyAST, ClassifyProject, CheckContracts,               │
│    GetPluginDiagnostics, GetPluginCodeFixes                    │
│                                                                  │
│  Orchestrates domain entities, depends on ports (not adapters)  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ uses
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                         │
│                                                                  │
│  Adapters (implement ports):                                    │
│    TypeScriptAdapter (implements TypeScriptPort)               │
│    FileSystemAdapter (implements FileSystemPort)               │
│    CLIAdapter (implements DiagnosticPort)                      │
│    PluginAdapter (implements DiagnosticPort)                   │
│                                                                  │
│  Test Doubles:                                                  │
│    MockTypeScript, MockFileSystem (for testing use cases)      │
│                                                                  │
│  Depends on domain + application. Knows about TypeScript API.  │
└─────────────────────────────────────────────────────────────────┘
```

### Port Definitions (Application Layer)

> **📖 See V4 Part 4.4** for the complete KindScriptHost interface and design rationale.
> These ports abstract external dependencies (TypeScript API, filesystem, etc.) so that
> use cases remain pure and testable.

All ports defined in application layer, implemented in infrastructure:

```typescript
// application/ports/typescript.port.ts
export interface TypeScriptPort {
  // Create a program from config
  createProgram(rootFiles: string[], options: CompilerOptions): Program;

  // Get source file from program
  getSourceFile(program: Program, fileName: string): SourceFile | undefined;

  // Get type checker
  getTypeChecker(program: Program): TypeChecker;

  // Get imports from source file
  getImports(sourceFile: SourceFile, checker: TypeChecker): ImportEdge[];

  // Get diagnostics from program
  getDiagnostics(program: Program): Diagnostic[];
}

// application/ports/filesystem.port.ts
export interface FileSystemPort {
  // Check existence
  fileExists(path: string): boolean;
  directoryExists(path: string): boolean;

  // Read operations
  readFile(path: string): string | undefined;
  readDirectory(path: string, recursive: boolean): string[];

  // Write operations (for generator)
  writeFile(path: string, content: string): void;
  createDirectory(path: string): void;
}

// application/ports/config.port.ts
export interface ConfigPort {
  // Read config files
  readKindScriptConfig(path: string): KindScriptConfig;
  readTSConfig(path: string): TSConfig;
}

// application/ports/diagnostic.port.ts
export interface DiagnosticPort {
  // Report diagnostics
  reportDiagnostics(diagnostics: Diagnostic[]): void;

  // Format for output
  formatDiagnostic(diagnostic: Diagnostic): string;
}
```

---

## Milestone 0: Domain + Ports + Test Infrastructure
**Duration:** 1 week
**Goal:** Validate architecture with no real implementations

> **📖 V4 Architecture Context:**
> - Domain entities map to concepts in V4 Part 3 (ArchSymbol, Contract, Diagnostic)
> - Ports are defined in application layer (this is where use cases declare their needs)
> - No infrastructure dependencies in domain or application layers

### What We Build

**1. Domain Entities (Pure TypeScript, no dependencies)**

```typescript
// domain/entities/arch-symbol.ts
export class ArchSymbol {
  constructor(
    public readonly name: string,
    public readonly kind: ArchSymbolKind,
    public readonly declaredLocation?: string,
    public readonly members: Map<string, ArchSymbol> = new Map(),
    public readonly contracts: ContractDescriptor[] = []
  ) {}

  // Pure domain logic
  hasContract(contractType: string): boolean {
    return this.contracts.some(c => c.type === contractType);
  }

  findMember(name: string): ArchSymbol | undefined {
    return this.members.get(name);
  }
}

// domain/entities/diagnostic.ts
export class Diagnostic {
  constructor(
    public readonly message: string,
    public readonly code: number,
    public readonly file: string,
    public readonly line: number,
    public readonly relatedContract?: ContractReference
  ) {}

  static forbidden(edge: ImportEdge, contract: Contract): Diagnostic {
    return new Diagnostic(
      `Forbidden dependency: ${edge.from} → ${edge.to}`,
      70001,
      edge.sourceFile,
      edge.line,
      { contract: contract.name, location: contract.location }
    );
  }
}

// domain/value-objects/import-edge.ts
export class ImportEdge {
  constructor(
    public readonly sourceFile: string,
    public readonly targetFile: string,
    public readonly line: number,
    public readonly importPath: string
  ) {}

  // Value object methods
  equals(other: ImportEdge): boolean {
    return this.sourceFile === other.sourceFile &&
           this.targetFile === other.targetFile;
  }
}
```

**2. Port Definitions (Interfaces only)**

All ports defined as shown above. No implementations yet.

**3. Test Infrastructure (Mocks implementing all ports)**

```typescript
// infrastructure/adapters/testing/mock-typescript.adapter.ts
export class MockTypeScriptAdapter implements TypeScriptPort {
  private programs = new Map<string, MockProgram>();

  // Configure test data
  withSourceFile(fileName: string, content: string): this {
    // ... store for later retrieval
    return this;
  }

  withImport(from: string, to: string): this {
    // ... store for later retrieval
    return this;
  }

  // Implement interface
  createProgram(rootFiles: string[], options: CompilerOptions): Program {
    // Return mock program
  }

  getImports(sourceFile: SourceFile, checker: TypeChecker): ImportEdge[] {
    // Return configured mock imports
  }

  // ... other methods
}

// infrastructure/adapters/testing/mock-filesystem.adapter.ts
export class MockFileSystemAdapter implements FileSystemPort {
  private files = new Map<string, string>();
  private directories = new Set<string>();

  // Configure test data
  withFile(path: string, content: string): this {
    this.files.set(path, content);
    return this;
  }

  withDirectory(path: string, files: string[]): this {
    this.directories.add(path);
    // ... store files
    return this;
  }

  // Implement interface
  fileExists(path: string): boolean {
    return this.files.has(path);
  }

  readDirectory(path: string, recursive: boolean): string[] {
    // Return configured files
  }

  // ... other methods
}
```

**4. Use Case Interfaces (Application Layer)**

```typescript
// application/use-cases/check-contracts.use-case.ts
export interface CheckContractsUseCase {
  execute(request: CheckContractsRequest): CheckContractsResponse;
}

export interface CheckContractsRequest {
  symbols: ArchSymbol[];
  config: KindScriptConfig;
}

export interface CheckContractsResponse {
  diagnostics: Diagnostic[];
  contractsChecked: number;
  violationsFound: number;
}
```

### Deliverable

**Architecture Validation Tests:**

```typescript
// tests/architecture/milestone-0.test.ts
describe('Milestone 0: Architecture Validation', () => {
  let mockTS: MockTypeScriptAdapter;
  let mockFS: MockFileSystemAdapter;
  let checkContracts: CheckContractsUseCase;

  beforeEach(() => {
    mockTS = new MockTypeScriptAdapter();
    mockFS = new MockFileSystemAdapter();

    // Wire up use case with mocks
    checkContracts = new CheckContractsService(mockTS, mockFS);
  });

  it('validates domain-infra dependency rule', () => {
    // Arrange: Configure mocks
    mockFS
      .withDirectory('src/domain', ['entity.ts', 'service.ts'])
      .withDirectory('src/infrastructure', ['database.ts']);

    mockTS
      .withImport('src/domain/service.ts', 'src/infrastructure/database.ts');

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
      [domainSymbol, infraSymbol]
    );

    // Act: Execute use case
    const result = checkContracts.execute({
      symbols: [domainSymbol, infraSymbol],
      contracts: [contract],
      config: defaultConfig
    });

    // Assert: Verify business logic
    expect(result.violationsFound).toBe(1);
    expect(result.diagnostics[0].code).toBe(70001);
    expect(result.diagnostics[0].message).toContain('domain → infrastructure');
  });

  it('validates ports must have adapters', () => {
    // ... similar test for mustImplement contract
  });
});
```

### Success Criteria

✅ All domain entities defined with pure business logic
✅ All ports defined as interfaces
✅ Mock implementations of all ports
✅ Use case interfaces defined
✅ 20+ architecture validation tests passing
✅ **Zero** dependencies on TypeScript compiler API in domain/application layers
✅ **Zero** real file I/O in tests

**Customer Value:** None yet, but architecture is proven to work.

**Time to next milestone:** Can proceed with confidence that architecture is sound.

---

## Milestone 1: Single Contract End-to-End
**Duration:** 2 weeks
**Goal:** Real CLI tool that checks one contract on real codebases

> **📖 V4 Architecture Context:**
> - Real adapters implement ports defined in application layer
> - TypeScriptAdapter wraps ts.Program (V4 Part 3: "Use TypeScript's own")
> - Contract checking logic from V4 Part 4.3 (KS Checker)
> - This validates the "Wrap" decision for TypeScript integration (V4 Part 9)

### What We Build

**1. Real Adapters (Infrastructure Layer)**

```typescript
// infrastructure/adapters/typescript/typescript.adapter.ts
import * as ts from 'typescript';

export class TypeScriptAdapter implements TypeScriptPort {
  createProgram(rootFiles: string[], options: CompilerOptions): Program {
    // Wrap ts.createProgram, return our domain Program type
    const tsProgram = ts.createProgram(rootFiles, options);
    return new Program(tsProgram); // Domain entity wrapping ts.Program
  }

  getImports(sourceFile: SourceFile, checker: TypeChecker): ImportEdge[] {
    const edges: ImportEdge[] = [];
    const tsSourceFile = sourceFile.unwrap(); // Get underlying ts.SourceFile

    ts.forEachChild(tsSourceFile, function visit(node) {
      if (ts.isImportDeclaration(node) &&
          ts.isStringLiteral(node.moduleSpecifier)) {
        const symbol = checker.getSymbolAtLocation(node.moduleSpecifier);
        if (symbol) {
          const decls = symbol.getDeclarations();
          if (decls?.length) {
            const resolvedFile = decls[0].getSourceFile();
            edges.push(new ImportEdge(
              tsSourceFile.fileName,
              resolvedFile.fileName,
              ts.getLineAndCharacterOfPosition(tsSourceFile, node.getStart()).line,
              node.moduleSpecifier.text
            ));
          }
        }
      }
      ts.forEachChild(node, visit);
    });

    return edges;
  }

  // ... other methods
}

// infrastructure/adapters/filesystem/filesystem.adapter.ts
import * as fs from 'fs';
import * as path from 'path';

export class FileSystemAdapter implements FileSystemPort {
  fileExists(filePath: string): boolean {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  }

  readDirectory(dirPath: string, recursive: boolean): string[] {
    if (!recursive) {
      return fs.readdirSync(dirPath);
    }

    const files: string[] = [];

    function walk(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile() && fullPath.endsWith('.ts')) {
          files.push(fullPath);
        }
      }
    }

    walk(dirPath);
    return files;
  }

  // ... other methods
}
```

**2. Use Case Implementation (Application Layer)**

```typescript
// application/use-cases/check-contracts/check-contracts.service.ts
export class CheckContractsService implements CheckContractsUseCase {
  constructor(
    private readonly tsPort: TypeScriptPort,
    private readonly fsPort: FileSystemPort
  ) {}

  execute(request: CheckContractsRequest): CheckContractsResponse {
    const diagnostics: Diagnostic[] = [];

    for (const contract of request.contracts) {
      switch (contract.type) {
        case ContractType.NoDependency:
          diagnostics.push(...this.checkNoDependency(contract, request));
          break;
        // ... other contracts
      }
    }

    return {
      diagnostics,
      contractsChecked: request.contracts.length,
      violationsFound: diagnostics.length
    };
  }

  private checkNoDependency(
    contract: Contract,
    request: CheckContractsRequest
  ): Diagnostic[] {
    const [fromSymbol, toSymbol] = contract.args;

    // Resolve files for each symbol
    const fromFiles = this.resolveFiles(fromSymbol);
    const toFiles = new Set(this.resolveFiles(toSymbol));

    // Get imports for each from-file
    const diagnostics: Diagnostic[] = [];

    for (const fromFile of fromFiles) {
      const sourceFile = this.tsPort.getSourceFile(
        request.program,
        fromFile
      );
      if (!sourceFile) continue;

      const imports = this.tsPort.getImports(
        sourceFile,
        this.tsPort.getTypeChecker(request.program)
      );

      // Check if any imports target to-files
      for (const imp of imports) {
        if (toFiles.has(imp.targetFile)) {
          diagnostics.push(
            Diagnostic.forbidden(imp, contract)
          );
        }
      }
    }

    return diagnostics;
  }

  private resolveFiles(symbol: ArchSymbol): string[] {
    if (!symbol.declaredLocation) return [];

    return this.fsPort.readDirectory(
      symbol.declaredLocation,
      true // recursive
    );
  }
}
```

**3. Mock Classifier (Infrastructure Layer - Temporary)**

For this milestone, we hardcode ArchSymbols instead of parsing them from TypeScript:

```typescript
// infrastructure/adapters/mock-classifier/mock-classifier.adapter.ts
export class MockClassifier implements ClassifierPort {
  classify(config: KindScriptConfig): ArchSymbol[] {
    // Hardcoded for demo purposes
    // Real classifier comes in Milestone 2

    const domain = new ArchSymbol(
      'domain',
      ArchSymbolKind.Layer,
      'src/ordering/domain'
    );

    const infrastructure = new ArchSymbol(
      'infrastructure',
      ArchSymbolKind.Layer,
      'src/ordering/infrastructure'
    );

    const noDependencyContract = new Contract(
      ContractType.NoDependency,
      [domain, infrastructure]
    );

    domain.addContract(noDependencyContract);

    return [domain, infrastructure];
  }
}
```

**4. CLI Adapter (Infrastructure Layer)**

```typescript
// infrastructure/adapters/cli/cli.adapter.ts
export class CLIAdapter implements DiagnosticPort {
  reportDiagnostics(diagnostics: Diagnostic[]): void {
    for (const diag of diagnostics) {
      const formatted = this.formatDiagnostic(diag);
      console.error(formatted);
    }

    if (diagnostics.length > 0) {
      console.error(`\nFound ${diagnostics.length} architectural violation(s).`);
      process.exit(1);
    } else {
      console.log('✓ All architectural contracts satisfied.');
      process.exit(0);
    }
  }

  formatDiagnostic(diagnostic: Diagnostic): string {
    return `${diagnostic.file}:${diagnostic.line}:1 - error KS${diagnostic.code}: ${diagnostic.message}`;
  }
}

// infrastructure/cli/commands/check.command.ts
export class CheckCommand {
  constructor(
    private readonly checkContracts: CheckContractsUseCase,
    private readonly classifier: ClassifierPort,
    private readonly tsPort: TypeScriptPort,
    private readonly diagnosticPort: DiagnosticPort,
    private readonly configPort: ConfigPort
  ) {}

  async execute(args: string[]): Promise<void> {
    // Read config
    const config = this.configPort.readKindScriptConfig('kindscript.json');
    const tsConfig = this.configPort.readTSConfig('tsconfig.json');

    // Create TS program
    const program = this.tsPort.createProgram(
      config.rootFiles ?? tsConfig.files,
      tsConfig.compilerOptions
    );

    // Classify (using mock for now)
    const symbols = this.classifier.classify(config);

    // Extract contracts from symbols
    const contracts: Contract[] = [];
    for (const symbol of symbols) {
      contracts.push(...symbol.contracts);
    }

    // Check contracts
    const result = this.checkContracts.execute({
      symbols,
      contracts,
      program,
      config
    });

    // Report diagnostics
    this.diagnosticPort.reportDiagnostics(result.diagnostics);
  }
}
```

**5. Composition Root (Infrastructure Layer)**

```typescript
// infrastructure/cli/main.ts
import { CheckCommand } from './commands/check.command';
import { CheckContractsService } from '../../application/use-cases/check-contracts.service';
import { TypeScriptAdapter } from '../adapters/typescript/typescript.adapter';
import { FileSystemAdapter } from '../adapters/filesystem/filesystem.adapter';
import { CLIAdapter } from '../adapters/cli/cli.adapter';
import { MockClassifier } from '../adapters/mock-classifier/mock-classifier.adapter';
import { ConfigAdapter } from '../adapters/config/config.adapter';

// Composition root - wire up dependencies
const tsAdapter = new TypeScriptAdapter();
const fsAdapter = new FileSystemAdapter();
const cliAdapter = new CLIAdapter();
const mockClassifier = new MockClassifier();
const configAdapter = new ConfigAdapter();

const checkContractsService = new CheckContractsService(
  tsAdapter,
  fsAdapter
);

const checkCommand = new CheckCommand(
  checkContractsService,
  mockClassifier,
  tsAdapter,
  cliAdapter,
  configAdapter
);

// Parse args and execute
const command = process.argv[2];

if (command === 'check') {
  checkCommand.execute(process.argv.slice(3));
} else {
  console.error('Unknown command. Usage: ksc check');
  process.exit(1);
}
```

**6. Configuration Support**

```typescript
// kindscript.json (user config)
{
  "rootFiles": ["src/**/*.ts"],
  "contracts": {
    "noDependency": [
      ["domain", "infrastructure"]
    ]
  }
}
```

### Deliverable

**Working CLI tool:**

```bash
$ npm install -g kindscript

$ cd my-project

$ cat kindscript.json
{
  "contracts": {
    "noDependency": [["domain", "infrastructure"]]
  }
}

$ ksc check
src/ordering/domain/service.ts:12:1 - error KS70001: Forbidden dependency: domain → infrastructure

  12 import { Db } from '../../infrastructure/database';
     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Found 1 architectural violation(s).
```

### Success Criteria

✅ CLI runs on real projects
✅ Detects real violations in real codebases
✅ Uses real TypeScript compiler API
✅ Uses real filesystem
✅ Works with simple config file
✅ Exit code 1 on violations (CI integration)
✅ Mock classifier is clearly marked as temporary
✅ All adapters implement their ports correctly
✅ Domain/application layers still have zero external dependencies

**Customer Value:** ✅ **USABLE** - Can check one architectural rule on real projects

**Limitations at this milestone:**
- Only one contract type (noDependency)
- Symbols are hardcoded (no real classifier)
- No kind definitions yet (config-based only)

**Time to next milestone:** Can validate with customers. Get feedback on CLI UX.

---

## Milestone 2: Real Classifier (Parse Kind Definitions)
**Duration:** 3 weeks
**Goal:** Replace mock classifier with real TypeScript parser

> **📖 V4 Architecture Context:**
> - Implements V4 Part 4.1 (The KindScript Binder/Classifier)
> - Uses raw TypeScript API (no ts-morph), per V4 Part 9 decision
> - Classifies AST nodes as architectural entities (genuinely new logic)
> - Symbol-to-files resolution from V4 Part 4.2 (built together with classifier)

### What We Build

**1. Classifier Use Case (Application Layer)**

```typescript
// application/use-cases/classify-ast/classify-ast.service.ts
export class ClassifyASTService implements ClassifierPort {
  constructor(
    private readonly tsPort: TypeScriptPort
  ) {}

  classify(program: Program): ArchSymbol[] {
    const symbols: ArchSymbol[] = [];
    const checker = this.tsPort.getTypeChecker(program);

    // Find all types extending Kind<N>
    for (const sourceFile of program.getSourceFiles()) {
      symbols.push(...this.findKindDefinitions(sourceFile, checker));
      symbols.push(...this.findInstances(sourceFile, checker));
    }

    return symbols;
  }

  private findKindDefinitions(
    sourceFile: SourceFile,
    checker: TypeChecker
  ): ArchSymbol[] {
    const kinds: ArchSymbol[] = [];

    // Use TypeScriptPort to walk AST
    this.tsPort.forEachNode(sourceFile, (node) => {
      if (this.tsPort.isTypeAlias(node)) {
        const type = checker.getTypeAtLocation(node);

        if (this.extendsKind(type, checker)) {
          const symbol = this.createKindSymbol(node, type, checker);
          kinds.push(symbol);
        }
      }
    });

    return kinds;
  }

  private extendsKind(type: Type, checker: TypeChecker): boolean {
    const baseTypes = type.getBaseTypes?.() ?? [];

    for (const base of baseTypes) {
      const symbol = base.getSymbol();
      if (symbol?.getName() === 'Kind') {
        return true;
      }
    }

    return false;
  }

  private createKindSymbol(
    node: TypeAliasNode,
    type: Type,
    checker: TypeChecker
  ): ArchSymbol {
    const name = node.getName();
    const members = new Map<string, ArchSymbol>();

    // Extract members from type literal
    for (const prop of type.getProperties()) {
      const memberSymbol = new ArchSymbol(
        prop.getName(),
        ArchSymbolKind.Member,
        undefined // Location resolved from instance, not kind def
      );
      members.set(prop.getName(), memberSymbol);
    }

    return new ArchSymbol(
      name,
      ArchSymbolKind.Kind,
      undefined, // Kinds don't have locations, instances do
      members
    );
  }

  private findInstances(
    sourceFile: SourceFile,
    checker: TypeChecker
  ): ArchSymbol[] {
    const instances: ArchSymbol[] = [];

    this.tsPort.forEachNode(sourceFile, (node) => {
      if (this.tsPort.isVariableDeclaration(node)) {
        const type = checker.getTypeAtLocation(node);

        if (this.isKindType(type)) {
          const instance = this.createInstanceSymbol(node, type, checker);
          instances.push(instance);
        }
      }
    });

    return instances;
  }

  private createInstanceSymbol(
    node: VariableDeclarationNode,
    type: Type,
    checker: TypeChecker
  ): ArchSymbol {
    const name = node.getName();
    const initializer = node.getInitializer();

    // Extract declared location from initializer
    const location = this.extractLocation(initializer);

    // Extract member locations
    const members = this.extractMemberLocations(initializer, type);

    return new ArchSymbol(
      name,
      ArchSymbolKind.Instance,
      location,
      members
    );
  }

  private extractLocation(initializer: Expression): string | undefined {
    // Walk object literal looking for "location" property
    // Return its string value
  }

  private extractMemberLocations(
    initializer: Expression,
    type: Type
  ): Map<string, ArchSymbol> {
    // Walk object literal
    // For each property, create ArchSymbol with its location
  }
}
```

**2. Symbol-to-Files Resolution (Application Service)**

```typescript
// application/services/resolve-symbol-files.ts
// Pre-resolves all symbol locations to their file listings.
// Returns a Map<string, string[]> (location -> files) passed to the checker.
export function resolveSymbolFiles(
  symbols: ArchSymbol[],
  fsPort: FileSystemPort,
): Map<string, string[]> {
  const resolved = new Map<string, string[]>();
  for (const symbol of symbols) {
    for (const s of [symbol, ...symbol.descendants()]) {
      if (s.declaredLocation && !resolved.has(s.declaredLocation)) {
        if (fsPort.directoryExists(s.declaredLocation)) {
          resolved.set(
            s.declaredLocation,
            fsPort.readDirectory(s.declaredLocation, true),
          );
        }
      }
    }
  }
  return resolved;
}
```

**3. Contract Extraction from Kind Type Parameters (Application Layer)**

Constraints are now declared as the 3rd type parameter on `Kind<N, Members, Constraints>`,
not as separate `defineContracts()` function calls. The classifier extracts them as part of
`classify-ast.service.ts` (not a separate service).

```typescript
// Within application/use-cases/classify-ast/classify-ast.service.ts
// The classifier extracts constraints from the 3rd type parameter of Kind<N, M, C>

private extractConstraints(
  kindType: Type,
  kindSymbol: ArchSymbol,
  checker: TypeChecker
): Contract[] {
  // Get the 3rd type argument from Kind<N, Members, Constraints>
  const typeArgs = kindType.aliasTypeArguments ?? [];
  if (typeArgs.length < 3) return []; // No constraints defined

  const constraintsType = typeArgs[2];
  const contracts: Contract[] = [];

  // Walk properties of the constraints type literal
  for (const prop of constraintsType.getProperties()) {
    const name = prop.getName();
    const propType = checker.getTypeOfSymbol(prop);

    switch (name) {
      case 'noDependency':
        contracts.push(...this.parseArrayOfPairs(
          propType, ContractType.NoDependency, kindSymbol
        ));
        break;

      case 'mustImplement':
        contracts.push(...this.parseArrayOfPairs(
          propType, ContractType.MustImplement, kindSymbol
        ));
        break;

      case 'purity':
        contracts.push(this.parseSingleArray(
          propType, ContractType.Purity, kindSymbol
        ));
        break;

      case 'noCycles':
        contracts.push(this.parseSingleArray(
          propType, ContractType.NoCycles, kindSymbol
        ));
        break;
    }
  }

  return contracts;
}

private createContract(
  descriptor: ContractDescriptor,
  kindSymbol: ArchSymbol
): Contract {
  // Resolve string args to ArchSymbol references
  const resolvedArgs = descriptor.args.map(argPair =>
    argPair.map(argName => kindSymbol.findMember(argName)!)
  );

  return new Contract(
    descriptor.type,
    resolvedArgs.flat(),
    kindSymbol
  );
}
```

**4. Update Composition Root**

```typescript
// infrastructure/cli/main.ts (updated)
const tsAdapter = new TypeScriptAdapter();
const fsAdapter = new FileSystemAdapter();
const cliAdapter = new CLIAdapter();
const configAdapter = new ConfigAdapter();

// NEW: Real classifier instead of mock
// Classifier now also extracts constraints from Kind<N, M, C> type parameters
const classifyService = new ClassifyASTService(astAdapter);

// CheckContractsService only needs TypeScriptPort — filesystem data is pre-resolved
const checkContractsService = new CheckContractsService(tsAdapter);

const classifyProject = new ClassifyProjectService(configAdapter, fsAdapter, tsAdapter, classifyService);
const checkCommand = new CheckCommand(checkContractsService, classifyProject, diagnosticAdapter, fsAdapter);

// ... rest unchanged
```

### Deliverable

**User can now define kinds in TypeScript:**

```typescript
// src/contexts/ordering/ordering.k.ts
import type { Kind, InstanceConfig } from 'kindscript';

export type DomainLayer = Kind<"DomainLayer", {
  entities: string;
  ports: string;
}>;

export type ApplicationLayer = Kind<"ApplicationLayer">;

export type InfrastructureLayer = Kind<"InfrastructureLayer">;

// Constraints are the 3rd type parameter on Kind — no separate defineContracts() call needed
export type OrderingContext = Kind<"OrderingContext", {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [["domain", "infrastructure"], ["domain", "application"]];
}>;

// Root is inferred from this .k.ts file's directory
export const ordering = {
  domain: {},
  application: {},
  infrastructure: {},
} satisfies InstanceConfig<OrderingContext>;
```

```bash
$ ksc check
✓ All architectural contracts satisfied.
```

### Success Criteria

✅ Parses kind definitions from TypeScript files
✅ Parses instance declarations
✅ Parses contract descriptors
✅ Resolves symbol members
✅ Resolves files for each symbol
✅ Links contracts to symbols
✅ Mock classifier removed entirely
✅ Full IDE support for definitions (autocomplete, go-to-def) - free from TS

**Customer Value:** ✅ **TYPE-SAFE DEFINITIONS** - Can model architecture in TypeScript with full IDE support

**Limitations at this milestone:**
- Still only one contract type
- No generator yet
- No plugin yet

**Time to next milestone:** Can validate with customers. Get feedback on definition syntax.

---

## Milestone 3: Full Contract Suite
**Duration:** 3 weeks
**Goal:** All contract types working

> **📖 V4 Architecture Context:**
> - Implements all contracts from V4 Part 4.3 (KS Checker)
> - Each contract is domain logic (validation rules) orchestrated by application use cases
> - noDependency, mustImplement, purity, noCycles all follow same pattern

### What We Build

**1. Additional Contracts (Domain Layer)**

```typescript
// domain/contracts/must-implement.contract.ts
export class MustImplementContract extends Contract {
  constructor(
    portSymbol: ArchSymbol,
    adapterSymbol: ArchSymbol,
    parent: ArchSymbol
  ) {
    super(ContractType.MustImplement, [portSymbol, adapterSymbol], parent);
  }

  // Domain logic for validation
  validate(resolvedPorts: ResolvedFiles, resolvedAdapters: ResolvedFiles): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    // For each interface in ports
    for (const portFile of resolvedPorts.files) {
      const interfaces = portFile.getInterfaces();

      for (const iface of interfaces) {
        // Check if any adapter file implements it
        const hasImpl = this.findImplementation(iface, resolvedAdapters);

        if (!hasImpl) {
          diagnostics.push(
            Diagnostic.missingImplementation(iface, this)
          );
        }
      }
    }

    return diagnostics;
  }

  private findImplementation(
    iface: InterfaceDeclaration,
    adapters: ResolvedFiles
  ): boolean {
    // Check all adapter files for implementations
  }
}

// domain/contracts/purity.contract.ts
export class PurityContract extends Contract {
  constructor(
    layerSymbol: ArchSymbol,
    parent: ArchSymbol
  ) {
    super(ContractType.Purity, [layerSymbol], parent);
  }

  validate(
    resolvedFiles: ResolvedFiles,
    allowedImports: Set<string>
  ): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    const impureModules = [
      'fs', 'path', 'http', 'https', 'net',
      'child_process', 'cluster', 'crypto',
      'process', 'os'
    ];

    for (const file of resolvedFiles.files) {
      for (const imp of file.getImports()) {
        if (impureModules.includes(imp.module)) {
          diagnostics.push(
            Diagnostic.impureImport(imp, this)
          );
        }
      }
    }

    return diagnostics;
  }
}

// domain/contracts/no-cycles.contract.ts
export class NoCyclesContract extends Contract {
  constructor(
    symbols: ArchSymbol[],
    parent: ArchSymbol
  ) {
    super(ContractType.NoCycles, symbols, parent);
  }

  validate(dependencyGraph: DependencyGraph): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    // Tarjan's algorithm for cycle detection
    const cycles = this.findCycles(dependencyGraph);

    for (const cycle of cycles) {
      diagnostics.push(
        Diagnostic.cyclicDependency(cycle, this)
      );
    }

    return diagnostics;
  }

  private findCycles(graph: DependencyGraph): Cycle[] {
    // Tarjan's strongly connected components algorithm
  }
}
```

**2. Contract Implementations (Application Layer)**

```typescript
// application/use-cases/check-contracts/check-contracts.service.ts (updated)
export class CheckContractsService implements CheckContractsUseCase {
  constructor(
    private readonly tsPort: TypeScriptPort,
  ) {}

  execute(request: CheckContractsRequest): CheckContractsResponse {
    const diagnostics: Diagnostic[] = [];

    for (const contract of request.contracts) {
      switch (contract.type) {
        case ContractType.NoDependency:
          diagnostics.push(
            ...this.checkNoDependency(contract, request)
          );
          break;

        case ContractType.MustImplement:
          diagnostics.push(
            ...this.checkMustImplement(contract, request)
          );
          break;

        case ContractType.Purity:
          diagnostics.push(
            ...this.checkPurity(contract, request)
          );
          break;

        case ContractType.NoCycles:
          diagnostics.push(
            ...this.checkNoCycles(contract, request)
          );
          break;
      }
    }

    return {
      diagnostics,
      contractsChecked: request.contracts.length,
      violationsFound: diagnostics.length
    };
  }

  // Contract methods use request.resolvedFiles (pre-resolved Map<string, string[]>)
  // instead of live filesystem queries. Example:
  //
  // private checkMustImplement(contract, request): Diagnostic[] {
  //   const portFiles = request.resolvedFiles.get(portSymbol.declaredLocation) ?? [];
  //   const adapterFiles = request.resolvedFiles.get(adapterSymbol.declaredLocation) ?? [];
  //   ...
  // }

  private checkNoCycles(
    contract: NoCyclesContract,
    request: CheckContractsRequest
  ): Diagnostic[] {
    // Build dependency graph for all symbols
    const graph = this.buildDependencyGraph(
      contract.args,
      request.program
    );

    return contract.validate(graph);
  }

  // ... existing noDependency implementation
}
```

### Deliverable

**Full contract suite:**

```typescript
// architecture.ts — constraints are the 3rd type parameter on Kind
export type OrderingContext = Kind<"OrderingContext", {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [["domain", "infrastructure"], ["domain", "application"]];
  mustImplement: [["domain.ports", "infrastructure.adapters"]];
  purity: ["domain"];
  noCycles: ["domain", "application", "infrastructure"];
}>;
```

```bash
$ ksc check
src/ordering/domain/service.ts:12:1 - error KS70001: Forbidden dependency: domain → infrastructure
src/ordering/domain/ports/repository.port.ts:1:1 - error KS70002: Missing implementation for OrderRepository
src/ordering/domain/entities/order.ts:5:1 - error KS70003: Impure import in pure layer: 'fs'

Found 3 architectural violations.
```

### Success Criteria

✅ All contract types working
✅ Each contract has domain-layer validation logic
✅ Each contract has application-layer orchestration
✅ Diagnostics are clear and actionable
✅ Contracts compose (can use multiple on same project)

**Customer Value:** ✅ **COMPLETE CHECKING** - Full architectural enforcement

**Limitations at this milestone:**
- Still no generator
- Still no plugin

**Time to next milestone:** Can validate with customers. Get feedback on contract types.

---

## Milestone 5: Language Service Plugin
**Duration:** 2 weeks
**Goal:** IDE integration

> **📖 V4 Architecture Context:**
> - Implements V4 Part 5 (Language Service Integration - Plugin Architecture)
> - Uses ts.server.PluginModule API (not custom LSP), per ecosystem evidence
> - Produces ts.Diagnostic objects (V4 Part 3: no custom ArchDiagnostic type)
> - Must be fast (<100ms per file) - this constraint validates contract design
> - Plugin runs inside tsserver, shares its file-watching (V4 Part 6)

### What We Build

**1. Plugin Adapter (Infrastructure Layer)**

```typescript
// infrastructure/adapters/plugin/plugin.adapter.ts
import type * as ts from 'typescript/lib/tsserverlibrary';

export class PluginAdapter implements DiagnosticPort {
  private checkContractsService: CheckContractsService;
  private classifyService: ClassifyASTService;

  init(modules: { typescript: typeof ts }): ts.server.PluginModule {
    return {
      create: (info: ts.server.PluginCreateInfo) => {
        return this.createProxy(info, modules.typescript);
      }
    };
  }

  private createProxy(
    info: ts.server.PluginCreateInfo,
    ts: typeof import('typescript')
  ): ts.LanguageService {
    const proxy: ts.LanguageService = Object.create(null);
    const oldService = info.languageService;

    // Proxy all methods
    for (const k of Object.keys(oldService)) {
      (proxy as any)[k] = (oldService as any)[k];
    }

    // Intercept getSemanticDiagnostics
    proxy.getSemanticDiagnostics = (fileName: string) => {
      const tsDiags = oldService.getSemanticDiagnostics(fileName);
      const ksDiags = this.getKindScriptDiagnostics(fileName, info);
      return [...tsDiags, ...ksDiags];
    };

    // Intercept getCodeFixesAtPosition
    proxy.getCodeFixesAtPosition = (fileName, start, end, codes, fmt, prefs) => {
      const tsFixes = oldService.getCodeFixesAtPosition(
        fileName, start, end, codes, fmt, prefs
      );
      const ksFixes = this.getKindScriptFixes(fileName, start, end, codes, info);
      return [...tsFixes, ...ksFixes];
    };

    return proxy;
  }

  private getKindScriptDiagnostics(
    fileName: string,
    info: ts.server.PluginCreateInfo
  ): ts.Diagnostic[] {
    // Get TS program from language service
    const program = info.languageService.getProgram();
    if (!program) return [];

    // Wrap in our domain Program
    const wrappedProgram = Program.fromTSProgram(program);

    // Classify architecture
    const symbols = this.classifyService.classify(wrappedProgram);

    // Extract contracts
    const contracts: Contract[] = [];
    for (const symbol of symbols) {
      contracts.push(...symbol.contracts);
    }

    // Check contracts
    const result = this.checkContractsService.execute({
      symbols,
      contracts,
      program: wrappedProgram,
      config: this.loadConfig(), // Load from kindscript.json
    });

    // Convert our Diagnostics to ts.Diagnostic
    return result.diagnostics.map(d => this.toTSDiagnostic(d));
  }

  private toTSDiagnostic(diagnostic: Diagnostic): ts.Diagnostic {
    // Convert our domain Diagnostic to ts.Diagnostic
    return {
      file: /* ... */,
      start: /* ... */,
      length: /* ... */,
      messageText: diagnostic.message,
      category: ts.DiagnosticCategory.Error,
      code: diagnostic.code,
      relatedInformation: diagnostic.relatedContract
        ? [this.toRelatedInfo(diagnostic.relatedContract)]
        : undefined,
    };
  }

  private getKindScriptFixes(
    fileName: string,
    start: number,
    end: number,
    errorCodes: readonly number[],
    info: ts.server.PluginCreateInfo
  ): ts.CodeFixAction[] {
    // Generate quick fixes for KindScript diagnostics
    const fixes: ts.CodeFixAction[] = [];

    // If diagnostic is KS70001 (forbidden dependency),
    // offer "Add import exception" fix

    if (errorCodes.includes(70001)) {
      fixes.push({
        fixName: 'addImportException',
        description: 'Add import exception to contract',
        changes: [/* ... */],
      });
    }

    return fixes;
  }

  reportDiagnostics(diagnostics: Diagnostic[]): void {
    // Not used in plugin context - diagnostics are returned directly
  }
}
```

**2. Plugin Entry Point (Infrastructure Layer)**

```typescript
// infrastructure/plugin/index.ts
import type * as ts from 'typescript/lib/tsserverlibrary';
import { PluginAdapter } from '../adapters/plugin/plugin.adapter';
import { CheckContractsService } from '../../application/use-cases/check-contracts.service';
import { ClassifyASTService } from '../../application/use-cases/classify-ast/classify-ast.service';
import { TypeScriptAdapter } from '../adapters/typescript/typescript.adapter';
import { FileSystemAdapter } from '../adapters/filesystem/filesystem.adapter';

function init(modules: { typescript: typeof ts }): ts.server.PluginModule {
  // Composition root for plugin
  const tsAdapter = new TypeScriptAdapter();
  const fsAdapter = new FileSystemAdapter();

  const classifyService = new ClassifyASTService(astAdapter);
  // CheckContractsService only needs TypeScriptPort — filesystem data is pre-resolved
  const checkContractsService = new CheckContractsService(tsAdapter);

  const classifyProject = new ClassifyProjectService(configAdapter, fsAdapter, tsAdapter, classifyService);
  const diagnosticsService = new GetPluginDiagnosticsService(checkContractsService, classifyProject, fsAdapter);

  // ... plugin setup
}

export = init;
```

**3. Plugin Package (Infrastructure Layer)**

```json
// package.json
{
  "name": "kindscript",
  "version": "0.5.0",
  "main": "dist/cli/main.js",
  "bin": {
    "ksc": "dist/cli/main.js"
  },
  "files": [
    "dist/plugin/index.js"
  ],
  "scripts": {
    "build": "tsc",
    "test": "jest"
  }
}
```

### Deliverable

**User configures plugin in tsconfig.json:**

```json
{
  "compilerOptions": {
    "plugins": [
      { "name": "kindscript" }
    ]
  }
}
```

**In VS Code:**
- Architectural violations appear inline with squiggly underlines
- Hover shows violation message + contract reference
- Quick fixes available (Cmd+. / Ctrl+.)
- Works in every editor using tsserver

### Success Criteria

✅ Plugin loads in tsserver
✅ Diagnostics appear in editor
✅ Performance is acceptable (<100ms per file)
✅ Hover shows contract information
✅ Quick fixes work
✅ No crashes or hangs

**Customer Value:** ✅ **IDE INTEGRATION** - Catch violations while coding, not in CI

**Time to next milestone:** Can validate with customers. Get feedback on IDE experience.

---

## Milestone 7: Generator (Scaffolding)
**Duration:** 2 weeks
**Goal:** Generate code from definitions

> **📖 V4 Architecture Context:**
> - Implements V4 Part 4.5 (Generator - Spec → Code)
> - Genuinely new (V4 Part 9: "Build" decision)
> - Uses raw TypeScript API for code generation (no ts-morph, per V4)
> - Plan + Apply pattern validated by Nx generators and Angular schematics

### What We Build

**1. Scaffold Service (Application Layer)**

```typescript
// application/use-cases/scaffold/scaffold.service.ts
export class ScaffoldService {
  constructor(
    private readonly fsPort: FileSystemPort
  ) {}

  scaffold(
    kindSymbol: ArchSymbol,
    instanceSymbol: ArchSymbol
  ): ScaffoldPlan {
    const operations: Operation[] = [];

    // Create root directory
    if (instanceSymbol.declaredLocation) {
      operations.push(
        Operation.createDirectory(instanceSymbol.declaredLocation)
      );
    }

    // Create directories for each member
    for (const [name, member] of instanceSymbol.members) {
      if (member.declaredLocation) {
        operations.push(
          Operation.createDirectory(member.declaredLocation)
        );

        // Create index.ts stub
        operations.push(
          Operation.createFile(
            path.join(member.declaredLocation, 'index.ts'),
            this.generateStubContent(name, member)
          )
        );
      }
    }

    return new ScaffoldPlan(operations);
  }

  private generateStubContent(name: string, symbol: ArchSymbol): string {
    return `// ${name} layer\n// Generated by KindScript\n\nexport {};\n`;
  }

  execute(plan: ScaffoldPlan): ScaffoldResult {
    const results: OperationResult[] = [];

    for (const op of plan.operations) {
      try {
        this.executeOperation(op);
        results.push(OperationResult.success(op));
      } catch (error) {
        results.push(OperationResult.failure(op, error));
      }
    }

    return new ScaffoldResult(results);
  }

  private executeOperation(op: Operation): void {
    switch (op.type) {
      case OperationType.CreateDirectory:
        if (!this.fsPort.directoryExists(op.path)) {
          this.fsPort.createDirectory(op.path);
        }
        break;

      case OperationType.CreateFile:
        this.fsPort.writeFile(op.path, op.content ?? '');
        break;

      // ... other operation types
    }
  }
}
```

**2. Scaffold Command (Infrastructure Layer)**

```typescript
// infrastructure/cli/commands/scaffold.command.ts
export class ScaffoldCommand {
  constructor(
    private readonly scaffold: ScaffoldService,
    private readonly classify: ClassifyASTService,
    private readonly tsPort: TypeScriptPort,
    private readonly configPort: ConfigPort
  ) {}

  async execute(args: string[]): Promise<void> {
    // Read architecture definitions
    const config = this.configPort.readKindScriptConfig('kindscript.json');
    const tsConfig = this.configPort.readTSConfig('tsconfig.json');

    // Create TS program
    const program = this.tsPort.createProgram(
      ['architecture.ts'],
      tsConfig.compilerOptions
    );

    // Classify
    const symbols = this.classify.classify(program);

    // Find instances
    const instances = symbols.filter(
      s => s.kind === ArchSymbolKind.Instance
    );

    if (instances.length === 0) {
      console.error('No instances found in architecture.ts');
      process.exit(1);
    }

    // Let user pick which instance to scaffold
    const instance = await this.selectInstance(instances);

    // Find the kind definition
    const kindSymbol = symbols.find(
      s => s.kind === ArchSymbolKind.Kind &&
           s.name === instance.typeName
    );

    if (!kindSymbol) {
      console.error(`Kind definition not found for ${instance.typeName}`);
      process.exit(1);
    }

    // Generate plan
    console.log('\nScaffold plan:');
    const plan = this.scaffold.scaffold(kindSymbol, instance);

    for (const op of plan.operations) {
      console.log(`  ${op.type}: ${op.path}`);
    }

    // Ask for confirmation
    const answer = await this.prompt('\nExecute scaffold? (Y/n)');

    if (answer.toLowerCase() !== 'n') {
      const result = this.scaffold.execute(plan);

      console.log('\n✓ Scaffold complete:');
      for (const opResult of result.results) {
        if (opResult.success) {
          console.log(`  ✓ ${opResult.operation.path}`);
        } else {
          console.log(`  ✗ ${opResult.operation.path}: ${opResult.error}`);
        }
      }
    }
  }
}
```

### Deliverable

```bash
$ ksc scaffold

Found instances:
  1. ordering (OrderingContext)
  2. billing (BillingContext)

Select instance to scaffold: 1

Scaffold plan:
  createDirectory: src/contexts/ordering
  createDirectory: src/contexts/ordering/domain
  createFile: src/contexts/ordering/domain/index.ts
  createDirectory: src/contexts/ordering/domain/entities
  createFile: src/contexts/ordering/domain/entities/index.ts
  createDirectory: src/contexts/ordering/domain/ports
  createFile: src/contexts/ordering/domain/ports/index.ts
  createDirectory: src/contexts/ordering/application
  createFile: src/contexts/ordering/application/index.ts
  createDirectory: src/contexts/ordering/infrastructure
  createFile: src/contexts/ordering/infrastructure/index.ts

Execute scaffold? (Y/n) y

✓ Scaffold complete:
  ✓ src/contexts/ordering
  ✓ src/contexts/ordering/domain
  ✓ src/contexts/ordering/domain/index.ts
  ✓ src/contexts/ordering/domain/entities
  ✓ src/contexts/ordering/domain/entities/index.ts
  ... (all files)

Next steps:
  • Implement your domain entities in src/contexts/ordering/domain/entities/
  • Define ports in src/contexts/ordering/domain/ports/
  • Run 'ksc check' to verify structure
```

### Success Criteria

✅ Generates directory structure from kind definitions
✅ Creates stub files with basic content
✅ Shows plan before executing (dry-run preview)
✅ Handles errors gracefully (directory already exists, etc.)
✅ Clear next steps after scaffolding

**Customer Value:** ✅ **CODE GENERATION** - Can bootstrap new features from architectural definitions

---

## Milestone 8: Standard Library Packages — REMOVED

> **Note (2026-02-07):** Standard library packages were removed from the codebase. They added complexity for marginal value — users can define patterns inline in `architecture.ts`. The original milestone plan is preserved below for historical context.

**Duration:** Ongoing
**Goal:** Publish reusable patterns as npm packages

> **📖 V4 Architecture Context:**
> - Implements V4 Part 7 (Standard Library Distribution)
> - Uses npm + .d.ts distribution (V4 Part 9: "Wrap" - proven at scale by @types/*)
> - Each package: kind definitions (.d.ts) + contract runtime values (.js)
> - Follows Zod/TypeBox hybrid model (types + runtime)

### What We Build

**1. Clean Architecture Package**

```
packages/clean-architecture/
  package.json
  index.d.ts        # Type definitions
  index.js          # Contract runtime values
  README.md
  examples/
```

```typescript
// packages/clean-architecture/index.d.ts
import { Kind } from 'kindscript';

export type DomainLayer = Kind<"DomainLayer", {
  /** Core business entities. */
  entities: string;

  /** Ports (interfaces) for external dependencies. */
  ports: string;

  /** Domain services (optional). */
  services?: string;
}>;

export type ApplicationLayer = Kind<"ApplicationLayer", {
  /** Use case implementations (command/query handlers). */
  useCases: string;

  /** Application services (optional). */
  services?: string;
}>;

export type InfrastructureLayer = Kind<"InfrastructureLayer", {
  /** Implementations of domain ports. */
  adapters: string;

  /** Data persistence logic. */
  persistence?: string;
}>;

/**
 * A bounded context following Clean Architecture principles.
 * Constraints are built into the Kind type — no runtime needed.
 *
 * @see https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
 */
export type CleanContext = Kind<"CleanContext", {
  /** Pure business logic with no external dependencies. */
  domain: DomainLayer;

  /** Use cases orchestrating domain objects. */
  application: ApplicationLayer;

  /** Adapters connecting to external systems. */
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [["domain", "infrastructure"], ["domain", "application"], ["application", "infrastructure"]];
  mustImplement: [["domain.ports", "infrastructure.adapters"]];
  purity: ["domain"];
  noCycles: ["domain", "application", "infrastructure"];
}>;
```

No `.js` file is needed — the package exports types only (`export type`), so it is zero-runtime.

```json
// packages/clean-architecture/package.json
{
  "name": "@kindscript/clean-architecture",
  "version": "1.0.0",
  "description": "Clean Architecture pattern definitions for KindScript",
  "types": "index.d.ts",
  "keywords": ["kindscript", "architecture", "clean-architecture"],
  "peerDependencies": {
    "kindscript": "^0.8.0"
  }
}
```

**2. User Consumption**

```bash
$ npm install @kindscript/clean-architecture
```

```typescript
// architecture.ts
import type { CleanContext } from '@kindscript/clean-architecture';
import type { InstanceConfig } from 'kindscript';

export const ordering = {
  root: "src/contexts/ordering",
  domain: {
    entities: {},
    ports: {},
  },
  application: {
    useCases: {},
  },
  infrastructure: {
    adapters: {},
    persistence: {},
  },
} satisfies InstanceConfig<CleanContext>;
```

### Deliverable

**Published packages:**
- `@kindscript/clean-architecture`
- `@kindscript/hexagonal`
- `@kindscript/onion`

**Customer Value:** ✅ **ECOSYSTEM** - Can install and use battle-tested patterns immediately

---

## Timeline and Resource Summary

```
┌────────────────────────────────────────────────────────────────────┐
│                     INCREMENTAL BUILD TIMELINE                      │
│                                                                     │
│  M0: Domain+Ports (1w)      ████                                   │
│      ↓ Architecture validated                                       │
│                                                                     │
│  M1: Single Contract (2w)   ████████                               │
│      ↓ Usable CLI tool                                             │
│                                                                     │
│  M2: Real Classifier (3w)   ████████████                           │
│      ↓ Type-safe definitions                                       │
│                                                                     │
│  M3: Full Contracts (3w)    ████████████                           │
│      ↓ Complete checking                                           │
│                                                                     │
│  M5: Plugin (2w)            ████████                               │
│      ↓ IDE integration                                             │
│                                                                     │
│  M7: Generator (2w)         ████████                               │
│      ↓ Code generation                                             │
│                                                                     │
│  M8: Std Library (ongoing)  ████████████████████████████████       │
│      ↓ Ecosystem                                                   │
│                                                                     │
│  Total: ~13 weeks (3 months) to full feature set                  │
│  Customer validation gates at M1, M2, M3, M5                      │
└────────────────────────────────────────────────────────────────────┘
```

## Key Success Factors

✅ **Clean Architecture Preserved Throughout**
- Domain never depends on infrastructure or application
- All external dependencies (TS API, filesystem) accessed through ports
- Use cases orchestrate pure domain logic
- Adapters implement ports

✅ **Incremental Customer Validation**
- M1: First customer feedback on CLI UX
- M2: Validation of definition syntax
- M3: Validation of contract types
- M5: IDE experience feedback

✅ **Architecture Validated Early**
- M0 proves all interfaces work with mocks
- Can refactor implementations without changing contracts
- Tests written against ports, not adapters

✅ **Each Milestone Adds Value**
- No "almost working" states
- Every milestone produces a usable artifact
- Can pause after any milestone if needed

✅ **Risk Mitigation**
- TypeScript integration risk: mitigated in M1
- Performance risk: mitigated in M5 (plugin must be fast)

---

## Appendix: Jupyter Notebooks for User Experience Demonstrations

### Purpose

Jupyter notebooks serve as **interactive demonstrations** where we simulate the user experience of KindScript. They allow us to:

1. **Document by doing** — show actual commands and their output
2. **Validate UX** — experience the tool as a user would before customers do
3. **Create living tutorials** — executable documentation that can't get stale
4. **Test integration points** — verify CLI commands, config formats, error messages
5. **Gather feedback** — share notebooks with stakeholders for early feedback

Think of notebooks as **"pretending to be a user"** — we set up realistic scenarios, run commands, see output, and document our observations.

---

### Notebook Strategy Per Milestone

Each milestone gets demonstration notebooks that validate the user experience **before** customers use it.

#### M0: Domain + Ports (Internal Only)

**No user-facing notebooks yet.**

Instead: Architecture validation notebooks for the team:
- `notebooks/architecture/test-domain-entities.ipynb` — Create entities, verify behavior
- `notebooks/architecture/test-ports-with-mocks.ipynb` — Wire up mocks, test use cases

These validate the internal architecture, not user experience.

---

#### M1: Single Contract End-to-End

**Notebook: `notebooks/m1-first-contract-check.ipynb`**

**Purpose:** Experience the first working CLI as a user would.

```python
# Cell 1: Setup demo project
%%bash
mkdir -p demo-project/src/ordering/{domain,infrastructure}
cd demo-project

cat > src/ordering/domain/service.ts << 'TS'
export class OrderService {
  // Domain service
}
TS

cat > src/ordering/infrastructure/database.ts << 'TS'
import { OrderService } from '../domain/service';  // ← VIOLATION

export class OrderDatabase {
  // Infrastructure
}
TS
```

```python
# Cell 2: Configure KindScript
%%bash
cd demo-project

cat > kindscript.json << 'JSON'
{
  "contracts": {
    "noDependency": [
      ["src/ordering/domain", "src/ordering/infrastructure"]
    ]
  }
}
JSON
```

```python
# Cell 3: Run check (expect violation)
%%bash
cd demo-project
ksc check
# Exit code: 1
```

**Expected output:**
```
src/ordering/infrastructure/database.ts:1:1 - error KS70001: Forbidden dependency: infrastructure → domain

  1 import { OrderService } from '../domain/service';
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Found 1 architectural violation.
```

```python
# Cell 4: Fix the violation
%%bash
cd demo-project

cat > src/ordering/infrastructure/database.ts << 'TS'
// Fixed: removed domain import

export class OrderDatabase {
  // Infrastructure
}
TS
```

```python
# Cell 5: Run check again (expect success)
%%bash
cd demo-project
ksc check
# Exit code: 0
```

**Expected output:**
```
✓ All architectural contracts satisfied.
```

```markdown
# Cell 6: Observations (markdown)

## What worked well:
- Error message clearly identifies the violation
- File path and line number are correct
- Exit code is appropriate for CI

## What could be improved:
- [ ] Error message could suggest how to fix
- [ ] Could show which contract was violated
- [ ] Could offer `--fix` option

## Questions for customers:
- Is the error message clear enough?
- Would you want more detail about the contract?
```

**Deliverable:** This notebook becomes the basis for the M1 customer demo.

---

#### M2: Real Classifier

**Notebook: `notebooks/m2-defining-architecture.ipynb`**

**Purpose:** Experience defining kinds in TypeScript.

```typescript
// Cell 1: Create architecture.ts
%%bash
cd demo-project

cat > architecture.ts << 'TS'
import { Kind, ConstraintConfig, InstanceConfig } from 'kindscript';

export type DomainLayer = Kind<"DomainLayer">;
export type InfrastructureLayer = Kind<"InfrastructureLayer">;

export type OrderingContext = Kind<"OrderingContext", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [["domain", "infrastructure"]];
}>;

export const ordering = {
  root: "src/ordering",
  domain: {},
  infrastructure: {},
} satisfies InstanceConfig<OrderingContext>;
TS
```

```python
# Cell 2: Test IDE experience
# (This cell would include screenshots or instructions)
```

```markdown
## IDE Experience Test

Open `architecture.ts` in VS Code:

1. ✅ Autocomplete works on `ordering.domain.` → suggests `entities`, `services`
2. ✅ Go-to-definition on `DomainLayer` jumps to type alias
3. ✅ Hover on `ordering` shows full type
4. ✅ Rename refactoring works

**This is FREE from TypeScript!**
```

```python
# Cell 3: Run check with type-safe definitions
%%bash
cd demo-project
ksc check
```

```markdown
# Cell 4: Observations

## What worked well:
- Type safety catches typos immediately
- IDE support is excellent
- Definition syntax feels natural

## What could be improved:
- [ ] Location strings aren't validated (typo wouldn't be caught)
- [ ] Could we infer locations from directory structure?

## Questions for customers:
- Is the definition syntax too verbose?
- Would you want a shorter syntax option?
```

---

#### M3: Full Contracts

**Notebook: `notebooks/m3-all-contract-types.ipynb`**

Shows each contract type in action:

```python
# Cell 1: mustImplement example
%%bash
cd demo-project

# Create port (interface)
cat > src/ordering/domain/ports/order-repository.port.ts << 'TS'
export interface OrderRepository {
  save(order: Order): Promise<void>;
}
TS

# DON'T create adapter yet (violation)

# Update architecture.ts to add mustImplement contract
# ...

# Run check
ksc check
# → error KS70002: Missing implementation for OrderRepository
```

```python
# Cell 2: purity example
%%bash
cd demo-project

# Add impure import to domain
cat > src/ordering/domain/entities/order.ts << 'TS'
import * as fs from 'fs';  // ← IMPURE!

export class Order {
  save() {
    fs.writeFileSync('order.json', JSON.stringify(this));
  }
}
TS

# Update architecture.ts to add purity contract
# ...

# Run check
ksc check
# → error KS70003: Impure import in pure layer: 'fs'
```

```python
# Cell 3: noCycles example
%%bash
cd demo-project

# Create circular dependency
# domain → infrastructure → domain

# Run check
ksc check
# → error KS70004: Circular dependency detected: domain → infrastructure → domain
```

```markdown
# Cell 4: Observations

## Contract Coverage

| Contract | Easy to Use? | Clear Errors? | Would Customers Use? |
|----------|--------------|---------------|----------------------|
| noDependency | ✅ | ✅ | ✅ High confidence |
| mustImplement | ✅ | ⚠️ Could be clearer | ✅ Likely |
| purity | ✅ | ✅ | ⚠️ Maybe (niche use case?) |
| noCycles | ✅ | ✅ | ✅ Likely |

## Questions for customers:
- Which contracts would you actually use?
- Are any of these too restrictive?
- What contracts are we missing?
```

---

#### M5: Plugin

**Notebook: `notebooks/m5-ide-integration.ipynb`**

**Purpose:** Document IDE experience (mostly screenshots and videos).

```markdown
# Cell 1: Setup

Install plugin:
npm install kindscript

Configure tsconfig.json:
{
  "compilerOptions": {
    "plugins": [
      { "name": "kindscript" }
    ]
  }
}

Restart VS Code TypeScript server:
Cmd+Shift+P → "TypeScript: Restart TS Server"
```

```markdown
# Cell 2: IDE Experience

## Screenshot 1: Inline Diagnostics
![Squiggly underlines on violating import]

## Screenshot 2: Hover Information
![Hover shows: "Forbidden dependency: domain → infrastructure. Contract 'noDependency' defined in architecture.ts:42"]

## Screenshot 3: Quick Fix
![Cmd+. shows: "Add import exception to contract"]

## Screenshot 4: Code Lens
![Above architecture definition: "✓ 5 contracts passing | ✗ 2 violations"]
```

```markdown
# Cell 3: Performance Test

Open large file (1000+ lines) with violations.

Measure time from edit to diagnostic appearing:
- Trial 1: 47ms ✅
- Trial 2: 52ms ✅
- Trial 3: 44ms ✅

Average: 48ms (well under 100ms budget)
```

```markdown
# Cell 4: Observations

## What worked well:
- Diagnostics appear instantly
- Hover info is helpful
- Quick fixes work

## What could be improved:
- [ ] Code lens could show more detail
- [ ] Could we have "Explain this violation" action?
- [ ] Quick fixes are limited

## Questions for customers:
- Does this feel intrusive or helpful?
- Would you want to disable plugin temporarily?
- What quick fixes would be most useful?
```

---

#### M7: Generator

**Notebook: `notebooks/m7-scaffolding.ipynb`**

**Purpose:** Validate code generation.

```python
# Cell 1: Start from architecture definition
%%bash
cd new-project

cat > architecture.ts << 'TS'
// ... OrderingContext definition ...
TS
```

```python
# Cell 2: Run scaffold
%%bash
cd new-project
ksc scaffold
```

**Expected interaction:**
```
Found instances:
  1. ordering (OrderingContext)

Select instance to scaffold: 1

Scaffold plan:
  createDirectory: src/contexts/ordering
  createDirectory: src/contexts/ordering/domain
  createFile: src/contexts/ordering/domain/index.ts
  createDirectory: src/contexts/ordering/domain/entities
  createFile: src/contexts/ordering/domain/entities/index.ts
  ... (10 more operations)

Execute scaffold? (Y/n) y

✓ Scaffold complete:
  ✓ src/contexts/ordering
  ✓ src/contexts/ordering/domain
  ... (all operations)
```

```python
# Cell 3: Verify generated structure
%%bash
cd new-project
tree src/contexts/ordering
```

```markdown
## Generated Structure

src/contexts/ordering/
├── domain/
│   ├── index.ts
│   ├── entities/
│   │   └── index.ts
│   └── ports/
│       └── index.ts
├── application/
│   └── index.ts
└── infrastructure/
    └── index.ts

All directories created ✅
All index files created ✅
```

```python
# Cell 4: Check generated file content
%%bash
cd new-project
cat src/contexts/ordering/domain/index.ts
```

```markdown
## Generated File Quality

**Content:**
```typescript
// domain layer
// Generated by KindScript

export {};
```

**Assessment:**
- Minimal but valid ✅
- Has comment ✅
- Exports something (prevents empty module) ✅
- Could be more helpful ⚠️

**Improvement ideas:**
- Could include TODO comments
- Could generate example class/interface
- Could include architectural documentation
```

```markdown
## Observations

## What worked well:
- Generated structure matches definition
- All files are valid TypeScript
- Preview before execution is helpful

## What could be improved:
- [ ] Generated content is too minimal
- [ ] Could generate more than just index files
- [ ] Could use templates for common patterns

## Questions for customers:
- Is minimal generation better or worse?
- Would you want template options?
- Should we generate tests too?
```

---

### Notebook Organization

```
notebooks/
  architecture/              # M0: Internal architecture validation
    test-domain-entities.ipynb
    test-ports-with-mocks.ipynb
    test-use-case-wiring.ipynb

  milestones/               # One per customer-facing milestone
    m1-first-contract-check.ipynb
    m2-defining-architecture.ipynb
    m3-all-contract-types.ipynb
    m5-ide-integration.ipynb
    m7-scaffolding.ipynb

  tutorials/                # After M8: User-facing tutorials
    getting-started.ipynb
    clean-architecture-example.ipynb
    hexagonal-example.ipynb

  reference/                # After M8: Complete feature reference
    all-contract-types.ipynb
    configuration-options.ipynb
    cli-commands.ipynb

  troubleshooting/          # Common issues and solutions
    common-errors.ipynb
    performance-tuning.ipynb
```

---

### Notebook Development Workflow

**Before starting milestone work:**
1. Create milestone notebook with expected UX
2. Run through it manually (even if tool doesn't exist yet)
3. Document pain points and questions

**During milestone development:**
1. Update notebook as UX evolves
2. Use notebook to test each feature as it's built
3. Record observations in markdown cells

**After milestone completion:**
1. Finalize notebook with actual output
2. Review observations section
3. Use as basis for customer demo
4. Archive as documentation of milestone state

**For customer validation:**
1. Share notebook (Jupyter Viewer, Binder, or GitHub)
2. Walk through it in demo meeting
3. Collect feedback in "Observations" section
4. Update milestone plan based on feedback

---

### Technical Setup

**Jupyter Kernel Options:**

1. **Deno Kernel** (Recommended for KindScript)
   ```bash
   deno jupyter --install
   ```
   - Runs TypeScript natively
   - Can shell out to CLI commands
   - Good for demonstrating TypeScript code

2. **JavaScript/TypeScript Kernel** (IJavascript)
   ```bash
   npm install -g ijavascript
   ijsinstall
   ```
   - Node.js-based
   - Good for testing npm package usage

3. **Bash Kernel**
   ```bash
   pip install bash_kernel
   python -m bash_kernel.install
   ```
   - Shell-first
   - Good for CLI command demonstrations

**Recommended approach:** Use Deno kernel for main notebooks (native TypeScript), with `%%bash` magic for CLI commands.

---

### Benefits of Notebook-Driven Development

**1. Experience Before Building**
- We feel the UX pain before customers do
- Can iterate on CLI design quickly
- Can test error messages and help text

**2. Documentation That Can't Lie**
- Output is actual output, not hypothetical
- Examples are tested by running them
- Changes to tool automatically invalidate docs

**3. Customer Validation**
- Share notebooks for early feedback
- Walk through in demo meetings
- Capture feedback directly in notebook

**4. Onboarding Artifact**
- New team members run notebooks to learn
- Living tutorials that stay current
- Reference for "how it's supposed to work"

**5. Regression Testing**
- Re-run notebooks after changes
- Verify output hasn't changed unexpectedly
- Catch UX regressions early

---

### Example: How Notebooks Caught Issues in Other Projects

**Project: Remix (React framework)**
- Used notebooks to demo file-based routing
- Discovered confusing error messages for nested routes
- Fixed before customer launch

**Project: Prisma (Database ORM)**
- Used notebooks to demo schema → migration workflow
- Realized migration commands were too verbose
- Simplified CLI before 1.0

**Project: Deno (Runtime)**
- Used notebooks to demo standard library usage
- Found import syntax was unintuitive
- Changed import map format based on notebook feedback

**For KindScript:**
Notebooks will reveal:
- Where error messages are unclear
- Where the CLI is too verbose or too terse
- Where the happy path is too complex
- Where power users need more control
- Where beginners get stuck

---

### Success Metrics

For each milestone notebook:
- **Clarity**: Can a new person follow it? (Yes/No)
- **Accuracy**: Does output match reality? (Yes/No)
- **Pain Points Identified**: How many UX issues did we catch? (Count)
- **Questions Raised**: What did we learn we don't know? (Count)
- **Customer Feedback Incorporated**: How much did customers validate? (Qualitative)

**Goal:** Every milestone notebook should:
1. Run without errors
2. Identify at least 2-3 UX improvements before customer release
3. Serve as basis for customer demo
4. Be referenced in future tutorials

---

### Integration with Build Plan

**Updated milestone completion criteria:**

Each milestone is considered complete when:
1. ✅ Features implemented and tests passing
2. ✅ **Demonstration notebook runs successfully**
3. ✅ **Observations documented in notebook**
4. ✅ **UX issues identified and prioritized**
5. ✅ Customer demo conducted using notebook
6. ✅ Feedback incorporated into next milestone

Notebooks are **first-class deliverables**, not afterthoughts.

