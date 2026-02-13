# Changelog

All notable changes to KindScript will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.3] - 2026-02-13

### Fixed

- **ESM Compatibility**: Added `.js` extensions to all 201 relative imports across 70 source files for Node.js ESM compliance
- **npm Package Publishing**: Fixed GitHub Actions workflow to verify build output before publishing (prevents empty dist/ directories)
- **Tutorial TypeScript Errors**: Configured Monaco Editor with manual type injection to resolve "Cannot find module 'kindscript'" errors in all 21 tutorial lessons
- **Tutorial CLI Execution**: Updated WebContainer template to use direct node execution path for `ksc` CLI command

### Changed

- **Website Tutorial**: Monaco Editor now uses `declare module 'kindscript'` with `addExtraLib()` for IntelliSense
- **GitHub Workflow**: Added build verification step to ensure `dist/types/index.d.ts` and `dist/types/index.js` exist before publishing

## [2.0.2] - 2026-02-12

### Fixed

- Published with complete `dist/` directory (2.0.1 and earlier had empty dist/)

## [2.0.0] - 2026-02-12

### 🎉 Major Release: Simplified Wrapped Kind API

KindScript 2.0.0 removes the `InstanceOf<K>` type in favor of direct Kind type annotations, making wrapped Kinds simpler and more intuitive.

### ⚠️ BREAKING CHANGES

**Removed `InstanceOf<K>` type from public API**

Wrapped Kind exports must now use direct type annotation instead of `InstanceOf<K>`:

```typescript
// ❌ Old (v1.x):
import type { Kind, InstanceOf } from 'kindscript';
export const validateOrder: InstanceOf<Decider> = (cmd) => { ... };

// ✅ New (v2.x):
import type { Kind } from 'kindscript';
export const validateOrder: Decider = (cmd) => { ... };
```

**Migration Guide:**
1. Remove `InstanceOf` from all imports: `import type { Kind, InstanceOf }` → `import type { Kind }`
2. Replace all `InstanceOf<K>` type annotations with direct Kind type: `: InstanceOf<Decider>` → `: Decider`
3. Update to KindScript 2.0.0

### Changed

- **Internal**: Unified carrier model with TS-aligned symbol ownership
  - Symbols now directly own their resolved files (`symbol.files: string[]`)
  - Carriers are parse-time intermediates consumed by the binder
  - Scanner detects wrapped Kind exports via direct type annotation
  - Simplified checker context (removed `resolvedFiles`, `containerFiles`, `declarationOwnership` maps)

### Documentation

- Updated all documentation to reflect direct annotation pattern
- Updated 4 interactive tutorial lessons (Part 6: Wrapped Kinds)
- Updated all test fixtures to use new pattern

### Internal

- Removed `InstanceOf` backward-compatibility detection code
- Simplified AST adapter annotation detection
- All 381 tests passing with new pattern

## [1.0.0] - 2026-02-11

### 🎉 First Stable Release

KindScript 1.0.0 is the first production-ready release of architectural enforcement for TypeScript.

### Added

- **Recursive Ownership Model** - Complete 7-phase implementation:
  - Phase 0: Explicit instance locations via `Instance<T, Path>`
  - Phase 1: Container file resolution for `Instance<T>` and `Instance<T, Path>`
  - Phase 2: Automatic overlap detection for sibling instances
  - Phase 3: Exhaustiveness validation (opt-in via `exhaustive: true`)
  - Phase 4: Ownership tree construction from scope containment
  - Phase 5: Declaration-level containment checking
  - Phase 6: Intra-file dependency validation

- **Six Contract Types**:
  - `noDependency` - Prevent dependencies between architectural layers
  - `purity` - Enforce zero external dependencies (pure modules)
  - `noCycles` - Detect circular dependencies
  - `scope` - Validate instance scope containment
  - `overlap` - Auto-generated for sibling instances (prevents file overlap)
  - `exhaustiveness` - Ensure all project files belong to an instance

- **TypeScript Compiler Integration**:
  - Language Service Plugin for IDE integration
  - CLI tool (`ksc`) for build pipelines
  - Four-stage pipeline: scan → parse → bind → check

- **Kind System**:
  - `Kind` - Structural architectural abstractions (directory-based)
  - Wrapped Kinds via `{ wraps: T }` - Declaration-level enforcement
  - `Instance<T, Path>` - Explicit location syntax for instances
  - Member-based composition via `MemberMap`

### Changed

- **Breaking**: Removed backward-compatibility `Diagnostic` getters (`.file`, `.line`, `.column`, `.scope`)
  - Consumers now use `.source.file`, `.source.line`, `.source.column`, `.source.scope`

- **API**: Added `exhaustive?: true` to `Constraints` type in public API

### Documentation

- 32 Architecture Decision Records (ADRs) documenting key design choices
- 6 comprehensive documentation chapters
- Interactive browser-based tutorial (7 lessons)
- Complete testing guide with 342 tests across 31 test files

### Internal

- A+Apps+Pipeline architecture with onion layers
- Domain layer: 100% pure (zero external dependencies)
- Application layer: Four-stage compiler pipeline aligned with TypeScript stages
- Infrastructure layer: Shared driven adapters only
- Apps layer: CLI + Plugin with dedicated ports/adapters

## [0.8.0-m8] - 2026-02-09

### Changed

- Pre-release milestone (m8) with recursive ownership work in progress

## [0.8.0-m7] - 2026-02-08

### Changed

- Pre-release milestone (m7)

---

**Legend**:
- 🎉 Major milestone
- ✨ New feature
- 🐛 Bug fix
- 📚 Documentation
- ⚠️ Breaking change
- 🔧 Internal/refactor

[2.0.0]: https://github.com/garrick0/kindscript/releases/tag/v2.0.0
[1.0.0]: https://github.com/garrick0/kindscript/releases/tag/v1.0.0
[0.8.0-m8]: https://github.com/garrick0/kindscript/releases/tag/v0.8.0-m8
[0.8.0-m7]: https://github.com/garrick0/kindscript/releases/tag/v0.8.0-m7
