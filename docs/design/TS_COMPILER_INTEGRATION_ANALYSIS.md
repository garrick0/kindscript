# TypeScript Compiler Integration Analysis

> **Design exploration:** Can KindScript push architectural enforcement into the TypeScript compiler itself, rather than building it externally?

**Date:** 2026-02-07
**Status:** Exploration (not authoritative)

---

## The Core Question

KindScript currently runs as two separate entry points:
- **CLI** (`ksc check`) — consumes `ts.Program` as a library, runs checks, reports violations
- **Language Service Plugin** — intercepts `getSemanticDiagnostics` inside tsserver, appends violations

This works, but has a fundamental limitation: **there is no way to make `tsc` itself report KindScript violations.** The CLI is a separate step in CI. The plugin only runs inside editors.

Could we push more (or all) of our checking into the TypeScript compiler pipeline itself, so that `tsc` reports architectural violations natively?

---

## TypeScript's Extension Points

TypeScript exposes four injection interfaces, each at a different level:

### 1. CompilerHost

**Used by:** `ts.createProgram(rootFiles, options, host)`

Controls how the compiler reads files and resolves modules. Key methods: `getSourceFile()`, `fileExists()`, `readFile()`, `directoryExists()`, `resolveModuleNames()`, `writeFile()`.

**Default:** `ts.createCompilerHost()` delegates to `ts.sys` (real Node.js `fs`).

**What you can inject:** Virtual filesystems, custom module resolution, intercept file reads.

### 2. WatchCompilerHost

**Used by:** `ts.createWatchProgram(host)`

Extends CompilerHost with file watching. Key additions: `watchFile()`, `watchDirectory()`, `afterProgramCreate()`.

**What you can inject:** Custom file watchers, post-compilation hooks.

### 3. LanguageServiceHost

**Used by:** `ts.createLanguageService(host)`

Like CompilerHost but for the long-lived IDE service. Key additions: `getScriptSnapshot()` (for unsaved editor buffers), `getScriptVersion()` (change tracking).

**What you can inject:** Custom file versioning, virtual documents.

### 4. CustomTransformers

**Used by:** `program.emit(target, writeFile, cancel, emitOnly, transformers)`

Functions that receive and return AST nodes during emit. Three hooks: `before`, `after`, `afterDeclarations`.

**What you can inject:** Code rewriting, import path rewriting, runtime code injection.

### 5. Language Service Plugin API (what we use)

**Used by:** tsconfig.json `compilerOptions.plugins`

Proxy the language service and intercept methods like `getSemanticDiagnostics`, `getCodeFixesAtPosition`, `getCompletionsAtPosition`.

**Critical limitation:** Plugins only run inside tsserver (editors). They do NOT run during `tsc` compilation. This is explicitly by design — TypeScript issue [#32371](https://github.com/microsoft/TypeScript/issues/32371) was closed as "Working as Intended."

### What's Missing

There is no **CheckerHost** or **CheckerPlugin** — no way to inject custom type-checking logic or diagnostics into `tsc` itself. This is the gap that forces every TypeScript-adjacent tool (KindScript, ESLint, Angular, dependency-cruiser) to run as a separate process.

---

## Options for Deeper Integration

### Option 1: Restricted CompilerHost Per Boundary

**Mechanism:** Create separate `ts.Program` instances where each boundary's CompilerHost only exposes files it's allowed to see.

```typescript
// Domain program — can only see domain files
const domainHost = createRestrictedHost({
  visibleDirs: ['src/domain'],
  visibleModules: [],  // no node builtins → purity for free
});
const domainProgram = ts.createProgram(domainFiles, options, domainHost);
// import { Db } from '../../infrastructure/db'
// → TypeScript reports: "Cannot find module '../../infrastructure/db'"
```

**What you get:**
- TypeScript's own checker reports the error
- Real squiggles, real error codes, real `tsc` output
- Purity enforcement comes free (don't expose Node builtins)

**Problems:**
- Error messages are misleading ("Cannot find module" instead of "Forbidden dependency")
- No way to customize the diagnostic message or code
- Requires N programs for N boundaries (slow, memory-heavy)
- Only covers `noDependency` and `purity` — cannot express `mustImplement`, `colocated`, or `noCycles`
- Complex to get right: shared `node_modules`, type definitions, cross-boundary type checking all break

**Feasibility:** Low. The error message problem alone makes this unacceptable for users.

---

### Option 2: Poison Module Resolution

**Mechanism:** Intercept `resolveModuleNames` on the CompilerHost. When a file in boundary A imports from forbidden boundary B, resolve to a synthetic `.d.ts` file that declares all exports as `never`.

```typescript
host.resolveModuleNames = (moduleNames, containingFile) => {
  return moduleNames.map((name, i) => {
    const resolved = originalResolve([name], containingFile)[0];
    if (resolved && isForbidden(containingFile, resolved.resolvedFileName)) {
      return { resolvedFileName: generatePoisonFile(resolved) };
    }
    return resolved;
  });
};
```

**What you get:**
- TypeScript's checker produces type errors wherever forbidden imports are used
- Works inside a single `ts.Program`

**Problems:**
- Errors appear at usage sites, not at the import statement
- Error messages are bizarre type incompatibilities, not architectural messages
- Requires generating synthetic `.d.ts` files on the fly
- Fragile: re-exports without usage produce no error
- Breaks go-to-definition, hover, and other IDE features for poisoned imports

**Feasibility:** Very low. Worse UX than running externally.

---

### Option 3: TypeScript Project References as Boundaries

**Mechanism:** Each architectural layer gets its own `tsconfig.json` with `composite: true`. Layers declare allowed dependencies via `references`. TypeScript's `--build` mode enforces that a project can only import from its declared references.

```
src/domain/tsconfig.json      — references: [] (nothing)
src/application/tsconfig.json — references: [{ path: "../domain" }]
src/infrastructure/tsconfig.json — references: [{ path: "../application" }, { path: "../domain" }]
```

**What you get:**
- Native `tsc --build` enforcement — real compiler errors
- Works in both IDE and CLI
- Circular references are structurally impossible
- Faster incremental builds (only recompile changed projects)
- No custom tool needed for dependency direction

**Problems:**
- Requires restructuring the project into separate tsconfig zones
- Every boundary needs its own `tsconfig.json` (configuration proliferation)
- Error messages are about project references, not architecture ("Output file has not been built from source file X")
- `declaration: true` required everywhere
- Only enforces dependency direction — no `purity`, `mustImplement`, `colocated`, `noCycles`
- Doesn't work for fine-grained boundaries within a single directory tree
- Real-world: [moonrepo](https://moonrepo.dev/docs/guides/javascript/typescript-project-refs) and [Nx](https://nx.dev/blog/typescript-project-references) document this pattern extensively

**Feasibility:** Medium for `noDependency` only. This is a legitimate complementary mechanism, not a replacement. Could be generated by KindScript as an optional output.

---

### Option 4: Transformer as Diagnostic Side-Channel

**Mechanism:** Register a "no-op transformer" via `CustomTransformers` that doesn't transform anything but walks the AST, performs all KindScript checks, and collects diagnostics via a closure.

```typescript
function architecturalChecker(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
  return (context) => (sourceFile) => {
    // Don't transform — just inspect
    const checker = program.getTypeChecker();
    for (const imp of getImports(sourceFile, checker)) {
      if (isForbidden(sourceFile.fileName, imp.targetFile)) {
        collectedDiagnostics.push(makeDiagnostic(imp));
      }
    }
    return sourceFile; // unchanged
  };
}

// Usage
const diagnostics: Diagnostic[] = [];
program.emit(undefined, () => {}, undefined, false, {
  before: [architecturalChecker(program)]
});
```

**What you get:**
- Full access to TypeScript's resolved program, type checker, source files
- The transformer runs inside the compiler pipeline — consistent program state guaranteed
- Can check all contract types (you're just querying the program)
- Custom diagnostic messages

**Problems:**
- Transformers only run during `emit()` — you must call emit even though you don't care about the output
- No official way to inject diagnostics from a transformer back into the diagnostic stream
- Side-channel (closure variable) is hacky and fragile
- Does not run in the language service plugin context — only in `program.emit()`
- At this point you're just using `emit()` as a roundabout way to trigger code that queries `ts.Program`, which is what `ksc check` already does more directly

**Feasibility:** Low. Adds complexity without meaningful benefit over the current approach.

---

### Option 5: Type-System Encoding (Phantom Branded Types)

**Mechanism:** Use CompilerHost's `getSourceFile()` to rewrite module declarations, injecting phantom type brands that encode filesystem location. Then architectural constraints become type-level constraints that TypeScript's own checker enforces.

```typescript
// What the user writes (src/domain/entity.ts):
export interface User { name: string; }

// What CompilerHost.getSourceFile returns to the compiler:
declare const __layer: unique symbol;
export interface User { name: string; [__layer]: 'domain'; }

// Architectural constraint as a type:
type DomainOnly<T> = T extends { [__layer]: 'domain' } ? T : never;
```

**What you get:**
- TypeScript's own checker does the enforcement
- Real type errors in both `tsc` and IDE
- Works without any external tool

**Problems:**
- Enormously complex to implement correctly
- Rewriting source files in `getSourceFile` breaks source maps, go-to-definition, hover, everything
- Phantom type brands on every export are invasive and leak into user-facing types
- Users see cryptic type errors about phantom brands, not architectural messages
- Only works for dependency direction — expressing `noCycles` or `mustImplement` as type constraints is nearly impossible
- Any `as` cast or type assertion bypasses the branding
- Fragile: breaks under re-exports, type inference, and many other common patterns

**Feasibility:** Very low. Creative but impractical.

---

### Option 6: ts-patch Diagnostic Plugin

**Mechanism:** [ts-patch](https://github.com/nonara/ts-patch) patches the TypeScript installation to support plugins with diagnostic emission capabilities. Source transformers can call `addDiagnostic()` during compilation.

```typescript
// Plugin using ts-patch's TransformerExtras
export default function(program: ts.Program, host: ts.CompilerHost, extras: TransformerExtras) {
  return (context: ts.TransformationContext) => (sourceFile: ts.SourceFile) => {
    // Run KindScript checks
    const violations = checkArchitecture(program, sourceFile);
    for (const v of violations) {
      extras.addDiagnostic(v); // This is the key addition ts-patch provides
    }
    return sourceFile;
  };
}
```

**What you get:**
- Diagnostics appear in `tsc` output (the holy grail)
- Custom diagnostic messages and codes
- Works alongside TypeScript's own diagnostics
- Configuration via tsconfig.json `plugins` array

**Problems:**
- Requires patching the TypeScript installation (`ts-patch install` modifies `node_modules/typescript`)
- Fragile across TypeScript version upgrades — TS 5.0's esbuild bundling broke all previous patching
- Needs a `prepare` script or the `tspc` wrapper command
- IDE integration still requires a separate Language Service plugin
- **Will not work with tsgo (TypeScript 7)** — a Go binary cannot be monkey-patched from JavaScript
- Adds a build-time dependency on a community tool with a single maintainer
- Still runs during emit, not during checking

**Feasibility:** Medium for today, zero for the future. This is a legitimate option for immediate `tsc` integration but is a dead-end strategy given TypeScript 7.

---

### Option 7: ESLint Bridge

**Mechanism:** Implement KindScript checks as ESLint rules using typescript-eslint's type-aware linting. Rules access `ts.Program` and `ts.TypeChecker` via `parserServices`.

```typescript
// eslint-plugin-kindscript
export const rules = {
  'no-forbidden-dependency': {
    meta: { type: 'problem', schema: [] },
    create(context) {
      const services = ESLintUtils.getParserServices(context);
      return {
        ImportDeclaration(node) {
          const tsNode = services.esTreeNodeToTSNodeMap.get(node);
          const program = services.program;
          // Run KindScript noDependency check
          if (isForbidden(context.filename, resolvedTarget)) {
            context.report({ node, message: 'Forbidden dependency: domain → infrastructure' });
          }
        }
      };
    }
  }
};
```

**What you get:**
- Editor feedback via ESLint integration (red squiggles)
- CI enforcement via `eslint` command (already in most CI pipelines)
- Familiar configuration format for developers
- Access to full type information via typescript-eslint's parser services
- ESLint's fix/suggestion system for code fixes

**Problems:**
- Duplicates the enforcement engine (KindScript checks reimplemented as ESLint rules)
- Performance: typescript-eslint's type-aware linting is slow (builds full program per lint run)
- Bypassable via `eslint-disable` comments
- ESLint's AST (ESTree) differs from TypeScript's AST — requires node mapping
- Doesn't leverage KindScript's Kind/Instance/Contract model — would be a simpler, less expressive reimplementation
- Two sources of truth for architectural rules (architecture.ts + eslint config)

**Feasibility:** Medium. Viable as a complementary integration, not a replacement. Could expose a simplified subset of KindScript rules as ESLint rules for teams that want ESLint-based enforcement.

---

### Option 8: WatchCompilerHost.afterProgramCreate

**Mechanism:** In watch mode, hook `afterProgramCreate` to run KindScript checks after every TypeScript recompilation.

```typescript
const host = ts.createWatchCompilerHost(
  configPath, {}, ts.sys,
  ts.createSemanticDiagnosticsBuilderProgram,
  reportDiagnostic, reportWatchStatus,
);

const origAfterCreate = host.afterProgramCreate;
host.afterProgramCreate = (builderProgram) => {
  origAfterCreate?.(builderProgram);
  const program = builderProgram.getProgram();
  const ksDiagnostics = runKindScriptChecks(program);
  for (const d of ksDiagnostics) {
    reportDiagnostic(d);
  }
};

ts.createWatchProgram(host);
```

**What you get:**
- KindScript diagnostics appear in `tsc --watch` output alongside TypeScript diagnostics
- Hooks into TypeScript's file change detection
- Full access to the freshly-compiled program
- Custom diagnostic messages
- No patching required — uses public API

**Problems:**
- Only works in watch mode, not one-shot `tsc` compilation
- Diagnostics are reported to the console but don't affect the exit code of the TypeScript process
- Still a separate tool wrapping `tsc`, not `tsc` itself
- Would need a `ksc watch` command (or wrapper) instead of plain `tsc --watch`

**Feasibility:** High. This is a solid approach for `ksc check --watch`. It's not "pushing checks into tsc" but rather "running alongside tsc in watch mode." Worth implementing.

---

### Option 9: package.json `exports` Field

**Mechanism:** Use the `exports` field in `package.json` to control which entry points consumers can import. With `moduleResolution: "node16"` or `"bundler"`, TypeScript respects `exports` and reports errors for restricted paths.

```json
{
  "name": "@myapp/domain",
  "exports": {
    ".": "./dist/index.js",
    "./entities/*": "./dist/entities/*.js",
    "./internal/*": null
  }
}
```

Importing `@myapp/domain/internal/secret` produces a TypeScript error.

**What you get:**
- Native TypeScript error for restricted imports
- Works in both `tsc` and IDE
- Standard Node.js mechanism, no custom tooling

**Problems:**
- Only works at the package level — requires each architectural layer to be a separate npm package (or workspace package)
- Doesn't support directional rules between sibling directories within a single package
- `exports` restricts the public API, not inter-layer dependencies
- Requires `moduleResolution: "node16"` or `"bundler"` (not compatible with `"node"`)
- Doesn't cover any contract type besides basic encapsulation

**Feasibility:** Low as a primary mechanism, but useful as a complementary technique for monorepo workspaces where each layer is already a separate package.

---

## How Other Tools Handle This

Every tool in the ecosystem faces the same "no checker plugin" gap. Here's how they cope:

| Tool | Strategy | Editor | `tsc` | CI |
|---|---|---|---|---|
| **Angular** | Own compiler (`ngc`) wrapping `tsc` + LSP server | Yes | Yes (via `ngc`) | Yes |
| **typescript-eslint** | Parallel type-checker inside ESLint | Via ESLint plugin | No | Yes (as ESLint) |
| **dependency-cruiser** | Standalone CLI, optional ESLint wrapper | Via ESLint wrapper | No | Yes (own CLI) |
| **good-fences** | Standalone CLI with `fence.json` config | No | No | Yes (own CLI) |
| **Sheriff** | ESLint plugin with `sheriff.config.ts` | Yes (via ESLint) | No | Yes (as ESLint) |
| **Nx Boundaries** | ESLint rule with tag-based constraints | Yes (via ESLint) | No | Yes (as ESLint) |
| **ts-patch** | Patches TypeScript binary | Needs separate LS plugin | Yes (patched `tsc`) | Yes |
| **KindScript** | LS Plugin + separate CLI | Yes (LS plugin) | No | Yes (`ksc check`) |

**Key observation:** No tool relies on TypeScript's plugin system for CI enforcement. Every tool that needs CI-level enforcement either wraps/patches `tsc` (Angular, ts-patch) or runs as a completely separate tool (ESLint, Nx, dependency-cruiser, KindScript).

Angular is the only project that successfully made its diagnostics appear in `tsc` output — by building its own compiler that wraps TypeScript's. This is a massive engineering investment that makes sense for a framework with millions of users but not for a smaller tool.

---

## The tsgo / TypeScript 7 Factor

The TypeScript team is rewriting the compiler in Go ([Project Corsa](https://devblogs.microsoft.com/typescript/typescript-native-port/)). This has major implications for all JS-based extension points.

### What's happening

- **TypeScript 6.x** — last JavaScript-based version (bridge release)
- **TypeScript 7.0** — Go rewrite, expected early-to-mid 2026
- **Performance:** 8-10x faster builds (VSCode codebase: 89s → 8.74s)
- **Repository:** [github.com/microsoft/typescript-go](https://github.com/microsoft/typescript-go)

### What breaks

| Extension point | Status in tsgo |
|---|---|
| CompilerHost (JS) | **Gone** — Go binary doesn't accept JS host objects |
| CustomTransformers (JS) | **Gone** — emit is in Go |
| LanguageServiceHost (JS) | **Gone** — replaced by standard LSP |
| Language Service Plugin API | **Unknown** — tsserver replaced by LSP server; plugin model TBD |
| ts-patch | **Dead** — cannot patch a Go binary |

Jake Bailey (TS team) stated explicitly in [typescript-go #516](https://github.com/microsoft/typescript-go/issues/516): "Go lacks strong plugin support; porting code to Go won't solve the architecture problem."

### What this means for KindScript

**The current architecture (external CLI + LS plugin) is actually the most future-proof strategy.** Here's why:

1. **CLI (`ksc check`)** — Uses `ts.createProgram()` as a library. As long as TypeScript provides a way to programmatically create a program and query it (whether in JS or via a Go FFI/API), the CLI works. The TypeScript team has committed to providing a "Corsa API" (successor to the "Strada API"), though its shape is TBD.

2. **Plugin** — Currently uses the TS Language Service Plugin API. tsgo replaces tsserver with standard LSP. KindScript may need to move to a standalone LSP extension or find the new plugin mechanism. This is the most at-risk component.

3. **Any approach that patches or wraps `tsc`** (Options 1, 2, 5, 6) becomes impossible with a Go binary.

4. **Project References** (Option 3) will continue to work — it's a compiler feature, not an extension point.

5. **ESLint bridge** (Option 7) depends on typescript-eslint, which itself depends on the JS compiler API. typescript-eslint will need its own migration strategy for tsgo.

---

## The Diagnostic Plugin Proposal (#45886)

The most relevant open TypeScript issue is [#45886: Diagnostic Compiler Plugin Proposal](https://github.com/microsoft/TypeScript/issues/45886), filed by Pei Wang from Google based on their experience building `tsec` (a Trusted Types security checker).

### What it proposes

A narrowly-scoped plugin API that allows third-party tools to emit custom semantic diagnostics during `tsc` compilation. Not syntax extension, not emit modification — just diagnostics.

### Key requirements from the proposal

- Work across all compilation modes (build, watch, one-shot)
- Automatic option parsing via tsconfig.json
- Build cache invalidation when plugin options change
- IDE integration without a separate language service implementation

### Status

- Assigned to Daniel Rosenwasser and Ron Buckton (TS team)
- Ron Buckton authored a work-in-progress prototype on the `compilerPluginModel` branch
- Labeled "In Discussion" — no commitment to ship
- Issue [#16607: Allow Compiler Plugins](https://github.com/microsoft/TypeScript/issues/16607) has 1,200+ upvotes

### What it would mean for KindScript

If diagnostic plugins ship, KindScript could:
- Register as a compiler plugin in tsconfig.json
- Emit architectural violation diagnostics during `tsc` compilation
- Eliminate the separate `ksc check` CLI entirely
- Have one integration point for both IDE and `tsc`

This would be the ideal outcome. However:
- There is no timeline or commitment
- The tsgo rewrite may reset the entire discussion (a Go plugin model would be fundamentally different from a JS one)
- Even if it ships for TS 6.x, it may not carry over to TS 7.x

---

## Assessment Matrix

| Option | Works in `tsc`? | Works in IDE? | Custom messages? | All contracts? | Future-proof (tsgo)? | Feasibility |
|---|---|---|---|---|---|---|
| 1. Restricted Host | Yes | No | No | 2 of 5 | No | Low |
| 2. Poison Resolution | Yes | Partially | No | 1 of 5 | No | Very Low |
| 3. Project References | Yes | Yes | No | 1 of 5 | Yes | Medium (complementary) |
| 4. Transformer Side-Channel | Emit only | No | Yes (hacky) | All | No | Low |
| 5. Type-System Encoding | Yes | Yes | No | 1 of 5 | No | Very Low |
| 6. ts-patch Plugin | Yes | Needs LS plugin | Yes | All | No (dead-end) | Medium (today only) |
| 7. ESLint Bridge | No | Yes | Yes | All (reimplemented) | Uncertain | Medium (complementary) |
| 8. Watch Hook | Watch only | No | Yes | All | Uncertain | High (for watch mode) |
| 9. package.json exports | Yes | Yes | No | 0 of 5 | Yes | Low (complementary) |
| **Current (CLI + Plugin)** | **Via CLI** | **Yes** | **Yes** | **All** | **Mostly** | **High** |

---

## Strategic Recommendation

### Keep the current architecture

The external CLI + Language Service Plugin approach is the right strategy. No option for pushing checks into `tsc` itself achieves all of:
- Custom diagnostic messages
- All five contract types
- Both IDE and CI coverage
- Future-proofing for tsgo

The current architecture achieves all four.

### Complement with targeted additions

1. **Watch mode (Option 8)** — Implement `ksc check --watch` using `WatchCompilerHost.afterProgramCreate`. This gives a unified watch experience where KindScript checks run alongside TypeScript recompilation. High value, low risk.

2. **Project References generation (Option 3)** — Optionally generate `tsconfig.json` project references from Kind definitions as a complementary enforcement layer. Users who want `tsc --build` to enforce dependency direction can opt in. This was previously in scope as `ksc init --detect` (now removed) but could return as `ksc generate-refs`.

3. **ESLint rules (Option 7)** — Consider exposing a simplified subset of KindScript's `noDependency` check as an ESLint rule (`eslint-plugin-kindscript`). This gives teams that already use ESLint a lower-friction entry point. Not a replacement for the full tool.

### Position for the future

1. **Monitor [#45886](https://github.com/microsoft/TypeScript/issues/45886)** (diagnostic plugin proposal). If it ships, KindScript should be an early adopter — the architecture is already structured to take advantage of it (application-layer services are decoupled from both entry points).

2. **Monitor [typescript-go](https://github.com/microsoft/typescript-go)** extensibility discussions. When tsgo's "Corsa API" stabilizes, validate that KindScript's CLI can migrate to it. The plugin will likely need to move to a standalone LSP extension or whatever plugin model tsgo provides.

3. **Do not invest in ts-patch** (Option 6). It's a dead-end given tsgo.

### The fundamental constraint

TypeScript's extension points let you control **what the compiler sees** (filesystem, modules, source text) but not **what it reports** (diagnostics). Until TypeScript provides a diagnostic plugin API, external tools are the only way to get custom messages, custom codes, and full contract coverage. The current architecture is not a workaround — it's the correct design for the constraints that exist.

---

## References

- [TypeScript Wiki: Using the Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
- [TypeScript Wiki: Using the Language Service API](https://github.com/microsoft/TypeScript/wiki/Using-the-Language-Service-API)
- [TypeScript Wiki: Writing a Language Service Plugin](https://github.com/microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin)
- [Issue #45886: Diagnostic Compiler Plugin Proposal](https://github.com/microsoft/TypeScript/issues/45886)
- [Issue #16607: Allow Compiler Plugins](https://github.com/microsoft/TypeScript/issues/16607) (1,200+ upvotes)
- [Issue #32371: LS Plugin diagnostics not in tsc](https://github.com/microsoft/TypeScript/issues/32371) (closed: Working as Intended)
- [Issue #54276: Custom Transformer Plugin Proposal](https://github.com/microsoft/TypeScript/issues/54276) (closed: not planned)
- [typescript-go #516: Plugin/Extension Support](https://github.com/microsoft/typescript-go/issues/516)
- [ts-patch](https://github.com/nonara/ts-patch)
- [A 10x Faster TypeScript (tsgo announcement)](https://devblogs.microsoft.com/typescript/typescript-native-port/)
- [Progress on TypeScript 7](https://devblogs.microsoft.com/typescript/progress-on-typescript-7-december-2025/)
- [Angular Language Service: Under the Hood](https://blog.angular.dev/under-the-hood-of-the-language-service-ab763c26f522)
- [typescript-eslint: Typed Linting](https://typescript-eslint.io/getting-started/typed-linting/)
- [dependency-cruiser](https://github.com/sverweij/dependency-cruiser)
- [good-fences](https://github.com/smikula/good-fences)
- [Sheriff](https://github.com/softarc-consulting/sheriff)
- [Nx: Enforce Module Boundaries](https://nx.dev/docs/features/enforce-module-boundaries)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
