# 1. Language Service Plugin Instead of Custom LSP

Date: 2026-02-07
Status: Done

**Date:** 2026-02-07
**Status:** Done

### Context

The original architecture proposed a custom LSP server for IDE integration.

### Decision

Use TypeScript's Language Service Plugin API instead.

### Rationale

**Ecosystem evidence:**

| Project | Plugin or LSP? | File Types |
|---------|---------------|------------|
| Angular Language Service | Plugin | `.ts` only |
| typescript-styled-plugin | Plugin | `.ts` with tagged templates |
| ts-graphql-plugin | Plugin | `.ts` with tagged templates |
| Vue Language Tools | Both | `.vue` (LSP) + `.ts` (plugin) |
| Svelte Language Tools | Both | `.svelte` (LSP) + `.ts` (plugin) |

**Pattern:** Projects operating on `.ts` files only use the plugin API exclusively. KindScript operates entirely on `.ts` files.

**Benefits:**
- Eliminates entire LSP server implementation
- Zero editor-specific integration work — every tsserver-based editor works immediately
- Native diagnostic display alongside TypeScript errors
- Code actions, hover info, and squiggly underlines work out of the box

**Trade-offs:**
- Contracts must be fast (sub-100ms per file) since the plugin runs in tsserver's event loop
- Complex analysis belongs in the CLI (`ksc check`), not the plugin

---

## Build / Wrap / Skip Framework

The decisions above follow a consistent framework:

**BUILD (genuinely new):**
1. Classifier — AST → ArchSymbol (no equivalent in TS ecosystem)
2. Symbol-to-files resolution — maps type declarations to filesystem
3. Contract evaluation — behavioral checking against codebase structure

**WRAP (delegate to TypeScript):**
1. Import graph — thin query over ts.Program
2. Diagnostic format — use ts.Diagnostic directly (codes 70000–79999)
3. Language service — plugin API
4. Filesystem access — ts.sys + small extensions
5. Config parsing — ts.readConfigFile

**SKIP (TypeScript handles natively):**
1. Scanner / Parser
2. AST format (ts.Node)
3. Structural type checking
4. LSP server (plugin runs inside tsserver)
