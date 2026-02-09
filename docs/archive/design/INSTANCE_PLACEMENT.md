# Instance Placement: Where Do Instance Declarations Live?

**Date:** 2026-02-08

## The Problem

KindScript currently derives an instance's root location from its `.k.ts` file's directory. This works well when you have one or two instances per project:

```
src/
  context.k.ts          # Kind def + instance → root is src/
  domain/
  infrastructure/
```

But when a Kind has many instances — like AtomVersion applied to every version of every atom — the one-file-per-instance model breaks down:

```
atoms/
  atom1/
    v0.0.1/
      atom1.tsx
      instance.k.ts      # just: export const v = { source: {} } satisfies InstanceConfig<AtomVersion>
    v0.0.2/
      atom1.tsx
      instance.k.ts      # identical boilerplate
  atom2/
    v0.0.1/
      atom2.tsx
      instance.k.ts      # identical boilerplate
  atom3/
    v0.0.1/
      atom3.tsx
      instance.k.ts      # identical boilerplate
```

Four instances = four nearly-identical files, each containing roughly:

```typescript
import type { InstanceConfig } from 'kindscript';
import type { AtomVersion } from '../../atomVersion.k.ts';
export const v = { source: {} } satisfies InstanceConfig<AtomVersion>;
```

This doesn't scale. A design system with 40 atoms, 2 versions each = 80 boilerplate files.

## The Principle

**Instances should never specify their own paths.** The Kind defines what the structure should be (constraints). The compiler discovers what actually exists (reality). Validation compares them. If the instance says "look here," it's doing the compiler's job.

This means the current `{ path: "..." }` override in InstanceConfig is a design smell. It exists today as a practical escape hatch (member name `atoms` but directory is `components/atoms`), but it mixes the roles of declaration and discovery.

Any solution to the instance placement problem must respect this principle.

## The Approaches

### A. Per-Instance `.k.ts` Files (Current Model)

Each instance gets its own `.k.ts` file in its directory. Location derived from file position.

```
atoms/
  atomVersion.k.ts                    # Kind definition
  atom1/v0.0.1/instance.k.ts         # { source: {} } satisfies InstanceConfig<AtomVersion>
  atom1/v0.0.2/instance.k.ts
  atom2/v0.0.1/instance.k.ts
  atom3/v0.0.1/instance.k.ts
```

**Pros:**
- Location derived from file position (no path specification)
- TypeScript type-checks each instance against the Kind
- Consistent with how KindScript works today
- Each instance can customise its member config if needed (e.g., nested members)

**Cons:**
- One file per instance — doesn't scale (80 files for 40 atoms x 2 versions)
- Every file is near-identical boilerplate
- Clutters source directories with metadata files
- Relative import paths to the Kind definition get awkward (`../../atomVersion.k.ts`)

**Assessment:** Works for low-instance-count Kinds (1-5 instances). Unworkable for Kinds with tens or hundreds of instances.

---

### B. Source File as Kind File

Instead of a separate `.k.ts` alongside `atom1.tsx`, what if the source file itself IS the instance declaration?

Two variants:

**B1: Merged file (`.k.tsx`)**

The component file contains both source code and Kind metadata:

```typescript
// atom1/v0.0.1/atom1.k.tsx
import type { InstanceConfig } from 'kindscript';
import type { AtomVersion } from '../../atomVersion.k.ts';

export const _kind = { source: {} } satisfies InstanceConfig<AtomVersion>;

// Actual component code
export const Button = () => <button>Click me</button>;
```

```
atoms/
  atomVersion.k.ts
  atom1/v0.0.1/atom1.k.tsx      # component code + Kind instance
  atom1/v0.0.2/atom1.k.tsx
  atom2/v0.0.1/atom2.k.tsx
```

**B2: Convention-based extension**

A `.k.tsx` extension signals "this file is both a component and a Kind instance":

```
atoms/
  atomVersion.k.ts
  atom1/v0.0.1/Button.k.tsx      # compiler knows .k.tsx = instance of parent Kind
  atom2/v0.0.1/Icon.k.tsx
```

**Pros (B1):**
- No extra files — metadata lives in the source file
- Location still derived from file position
- TypeScript type-checks the instance

**Cons (B1):**
- Mixes architectural metadata with component code
- Every component file needs the import boilerplate
- Build tools (webpack, vite) need to handle `.k.tsx` or ignore the metadata export
- If the Kind definition changes, every source file needs updating

**Pros (B2):**
- Minimal change to source files (just rename extension)
- Convention-driven — no explicit instance code needed
- Zero metadata in the source file

**Cons (B2):**
- Changing file extensions breaks imports throughout the project
- Build tool configuration changes needed
- The extension carries implicit meaning that's not visible in the file contents
- How does the compiler know WHICH Kind the file is an instance of?

**Assessment:** B1 pollutes source files with metadata. B2 is clever but fragile — file extensions carry too much implicit meaning and break tooling. Neither is a good fit.

---

### C. Centralised Instances with Explicit Paths

All instances declared in a single file, each with an explicit location:

```typescript
// atoms/atomVersion.k.ts
type AtomVersion = Kind<"AtomVersion", { source: AtomSource }, {}>;

export const atom1v001 = {
  location: "atom1/v0.0.1",
  source: {},
} satisfies InstanceConfig<AtomVersion>;

export const atom1v002 = {
  location: "atom1/v0.0.2",
  source: {},
} satisfies InstanceConfig<AtomVersion>;

export const atom2v001 = {
  location: "atom2/v0.0.1",
  source: {},
} satisfies InstanceConfig<AtomVersion>;
```

```
atoms/
  atomVersion.k.ts          # Kind def + all instances with paths
  atom1/v0.0.1/atom1.tsx
  atom1/v0.0.2/atom1.tsx
  atom2/v0.0.1/atom2.tsx
```

**Pros:**
- Single file — easy to see all instances at a glance
- Kind definition and instances co-located
- No extra files in source directories
- TypeScript type-checks each instance

**Cons:**
- **Violates the principle.** Instances specify their own paths. The instance is telling the compiler where reality is, instead of the compiler discovering it.
- File grows linearly with instances (40 atoms x 2 versions = 80 instance declarations in one file)
- Paths are strings — no type-checking that they're valid relative paths
- Paths can drift from reality (rename a directory, forget to update the instance)
- Duplicates information that's already in the filesystem

**Assessment:** Pragmatic but unprincipled. The explicit path is a source of truth that competes with the filesystem. When they disagree, which one is right? This is exactly the problem KindScript should prevent, not introduce.

---

### D. Pattern-Based Automatic Instances

Instead of declaring individual instances, declare a pattern. The compiler discovers instances by scanning the filesystem:

```typescript
// atoms/atomVersion.k.ts
type AtomSource = Kind<"AtomSource", {}, { filePattern: "*.tsx" }>;
type AtomVersion = Kind<"AtomVersion", { source: AtomSource }, {}>;

// "Every directory under my scope that matches */v*/ is an AtomVersion"
export const versions = kindScope(AtomVersion, "*/v*/");
```

The compiler:
1. Resolves the `.k.ts` file's directory as the scope root (`atoms/`)
2. Scans the filesystem for directories matching `*/v*/` under `atoms/`
3. Finds: `atom1/v0.0.1/`, `atom1/v0.0.2/`, `atom2/v0.0.1/`, `atom3/v0.0.1/`
4. Creates an implicit instance for each match
5. Validates each instance against AtomVersion's constraints

```
atoms/
  atomVersion.k.ts          # Kind def + scope pattern
  atom1/
    v0.0.1/atom1.tsx        # discovered as AtomVersion instance
    v0.0.2/atom1.tsx        # discovered as AtomVersion instance
  atom2/
    v0.0.1/atom2.tsx        # discovered as AtomVersion instance
  atom3/
    v0.0.1/atom3.tsx        # discovered as AtomVersion instance
```

**Pros:**
- Zero per-instance boilerplate
- Scales to any number of instances
- Location is discovered, not declared — respects the principle
- Convention-driven — the filesystem structure IS the source of truth
- Adding a new atom version = just create the directory. No .k.ts file needed
- Removing an atom version = just delete the directory. No .k.ts file to clean up

**Cons:**
- New language construct needed (`kindScope` or similar)
- Glob patterns can over-match (what if someone puts a `temp/v0/` directory there?)
- Less explicit — you can't see individual instances in the code
- What if a specific instance needs different member configuration? No per-instance customisation
- Compiler now requires filesystem access during classification (currently it doesn't)
- Debugging: when a constraint fails, the error points to a directory the user never explicitly declared as an instance

**Open questions:**
- What's the glob syntax? Standard minimatch? Custom?
- Can you compose patterns? (`*/v[0-9]*/` vs `*/v*/`)
- How do you exclude a directory that matches but shouldn't be an instance?
- Does the pattern match recursively or only one level?

**Assessment:** The strongest approach for Kinds with many uniform instances. The compiler discovering instances is philosophically aligned with KindScript's role — the Kind says what should exist, the compiler finds what does exist, and validation compares.

---

### E. Parent Kind Declares Children as a Collection

Instead of AtomVersion instances being independent, a parent Kind (Atom) declares that it HAS versions:

```typescript
type AtomVersion = Kind<"AtomVersion", { source: AtomSource }, {}>;

type Atom = Kind<"Atom", {
  versions: Collection<AtomVersion>;    // new concept: variable-count member
}, {}>;

// atoms/atom1/atom1.k.ts
export const atom1 = {
  versions: {},    // compiler discovers v0.0.1/, v0.0.2/ automatically
} satisfies InstanceConfig<Atom>;
```

The compiler resolves `versions` by scanning `atom1/` for subdirectories, and treats each as an AtomVersion.

```
atoms/
  atom.k.ts                     # Atom Kind definition
  atomVersion.k.ts              # AtomVersion Kind definition
  atom1/
    atom1.k.ts                  # Atom instance — versions discovered from subdirs
    v0.0.1/atom1.tsx
    v0.0.2/atom1.tsx
  atom2/
    atom2.k.ts
    v0.0.1/atom2.tsx
```

**Pros:**
- Explicit parent-child relationship — Atom owns its versions
- Location derived from file position (no path specification)
- Compiler discovers version subdirectories automatically
- Per-atom customisation possible (add constraints, metadata to the Atom instance)
- Compositional — Atom can have other members besides versions (README, changelog, etc.)

**Cons:**
- Requires a new `Collection<K>` concept in the type system
- Still one `.k.ts` per Atom (not per version, so much better, but still one per atom)
- The `Collection` semantics need defining: does it scan all subdirectories? Only matching ones? What about nested?
- More complex mental model than pattern-based

**Assessment:** Good compositional approach. Solves the "80 files" problem (reduces to 1 per atom + 1 Kind def = ~41 instead of 80). But introduces a new concept (`Collection`) and still requires per-atom instance files.

---

### F. Fully Implicit (No Instance Declarations)

No instance declarations at all. The Kind definition specifies its structural expectations. The compiler discovers conforming directories purely from the filesystem:

```typescript
// atoms/atomVersion.k.ts
type AtomSource = Kind<"AtomSource", {}, { filePattern: "*.tsx" }>;
type AtomVersion = Kind<"AtomVersion", { source: AtomSource }, {}>;

// No instances declared. The compiler scans atoms/**/v*/ and checks each against AtomVersion.
```

But how does the compiler know WHERE to look and WHICH Kind to apply? Options:
- A project-level config maps directory patterns to Kinds
- The Kind's file location defines its search scope
- Naming conventions (directories matching `v*` are AtomVersion, etc.)

**Pros:**
- Zero declaration boilerplate
- Pure discovery — the filesystem IS the source of truth
- Adding/removing instances is just creating/deleting directories

**Cons:**
- How does the compiler know which Kind applies where? This is the fatal question.
- No explicit opt-in — every matching directory is validated, whether intended or not
- Debugging is hard — errors reference directories that were never declared as instances
- No place to put per-instance configuration
- The mapping from "directory structure" to "Kind type" is implicit and potentially ambiguous

**Assessment:** Too implicit. Without ANY declaration connecting directories to Kinds, the compiler has to guess. The guessing logic becomes a complex, fragile system of conventions. TypeScript has explicit type annotations for a reason — purely structural validation without any declaration is brittle.

---

## Comparison

| Criterion | A (Per-File) | B (Source=Kind) | C (Centralised) | D (Pattern) | E (Collection) | F (Implicit) |
|---|---|---|---|---|---|---|
| Respects "no path in instance" | Yes | Yes | **No** | Yes | Yes | Yes |
| Scales to 100+ instances | **No** | **No** | Barely | **Yes** | Moderate | **Yes** |
| Boilerplate per instance | High | Medium | Medium | **Zero** | Low | **Zero** |
| Explicit instance declaration | Yes | Yes | Yes | Pattern-level | Parent-level | **No** |
| Per-instance customisation | Yes | Yes | Yes | **No** | Via parent | **No** |
| TypeScript type-checks instances | Yes | Yes | Yes | N/A | Yes | N/A |
| New language features needed | None | None | `location` field | `kindScope` | `Collection<K>` | Pattern→Kind mapping |
| Compiler needs filesystem access during classification | No | No | No | **Yes** | **Yes** | **Yes** |

## Key Tensions

### 1. Explicitness vs. Scale

Approaches A-C are explicit (every instance is declared). They work when instances are few but collapse when instances are many. Approaches D-F are implicit (instances are discovered). They scale but sacrifice visibility.

The question: how many instances does a typical Kind have? For architectural Kinds (CleanArchitecture, HexagonalArchitecture), usually 1-5. For structural Kinds (AtomVersion, ComponentStories), potentially hundreds. KindScript may need different mechanisms for different scales.

### 2. Discovery vs. Declaration

Today, KindScript's classifier is a pure function — it takes AST data and produces symbols. It never touches the filesystem. Approaches D-F require the classifier to scan the filesystem to discover instances. This changes the classifier's nature from "parse declarations" to "parse declarations + discover instances."

This isn't necessarily bad — the checker already uses the filesystem (for `exists`, `mirrors`, `purity`). But it's a meaningful architectural change to the classifier.

### 3. The Instance's Purpose

What is an instance declaration actually FOR?

In the current model, the instance serves two purposes:
1. **Binding**: "This specific directory conforms to this Kind" (connects reality to the type)
2. **Configuration**: "Here's how members map to subdirectories" (nested member structure, path overrides)

If we eliminate path overrides (the user's position), purpose 2 shrinks to just nested member structure. And for Kinds with no members (or only `filePattern` members), purpose 2 disappears entirely.

That leaves only purpose 1: binding. And the question becomes: does binding need to be explicit, or can it be inferred?

For a Kind like AtomVersion (one `filePattern` member, no nested members), the instance declaration is literally just `{ source: {} }`. It carries zero information beyond "this directory is an AtomVersion." At that point, the declaration is pure ceremony. A pattern-based approach (D) eliminates that ceremony.

For a Kind like CleanArchitecture (multiple members, nested structure), the instance carries real information — which members exist, how they're nested. The declaration has purpose. A per-file approach (A) makes sense here.

## Recommendation

**Not one approach. Two mechanisms for two scales.**

### For Kinds with few instances (architectural patterns):
**Approach A** — per-instance `.k.ts` files. This is what KindScript already does. It works well for CleanArchitecture, HexagonalArchitecture, BoundedContext — Kinds where you have 1-5 instances and the instance carries meaningful member configuration.

### For Kinds with many uniform instances (structural patterns):
**Approach D** — pattern-based discovery. A `kindScope` (or similar) declaration says "every directory matching this pattern is an instance of this Kind." No per-instance files needed. This is the natural mechanism for AtomVersion, ComponentStories, etc.

The two mechanisms compose naturally:

```
project/
  project.k.ts                          # CleanArchitecture instance (Approach A)
  src/
    domain/
    infrastructure/
  components/
    atoms/
      atomVersion.k.ts                  # Kind def + kindScope pattern (Approach D)
      Button/
        v0.0.1/Button.tsx               # discovered as AtomVersion
        v0.0.2/Button.tsx               # discovered as AtomVersion
      Icon/
        v0.0.1/Icon.tsx                 # discovered as AtomVersion
```

### What about path overrides?

If instances never specify paths, the `{ path: "..." }` override should be removed from `InstanceConfig`. Instead:
- Member names should match directory names (the default)
- If they don't match, use a `directoryName` constraint on the member's Kind (analogous to `filePattern` but for the directory name)
- Or accept that the member name IS the directory name — that's the convention, and KindScript enforces conventions

### What this means for AtomSource

AtomSource (a Kind with `filePattern: "*.tsx"`) already works under both mechanisms:
- In Approach A: the per-instance `.k.ts` file declares `{ source: {} }`, and the classifier resolves `source` via the `filePattern`
- In Approach D: the pattern discovers the instance directories, and the classifier resolves `source` via the `filePattern` within each discovered directory

The `filePattern` uplift (from ATOM_SOURCE_KIND.md) is needed either way. The instance placement question is orthogonal.
