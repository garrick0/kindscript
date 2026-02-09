# AtomSource Kind Design

**Date:** 2026-02-08

## The Kind

AtomSource represents a single `.tsx` file where an atom component is defined. It has no members and no behavioral constraints — just a file pattern that says what it matches.

```typescript
type AtomSource = Kind<"AtomSource", {}, {
  filePattern: "*.tsx";
}>;
```

When used as a member in a parent Kind, the pattern is already known — the instance just provides `{}`:

```typescript
type AtomVersion = Kind<"AtomVersion", {
  source: AtomSource;
  // ...other members later (stories, tests)
}, {
  // ...relational constraints later
}>;

export const buttonV1 = {
  source: {},  // KindScript knows AtomSource = *.tsx from the type
} satisfies Instance<AtomVersion>;
```

KindScript resolves `source` by scanning the parent's scope (the `v1.0.0/` directory) for files matching `*.tsx`. Those files become the AtomSource scope.

## Why the pattern is on the type, not the instance

The `*.tsx` pattern is part of what AtomSource IS, not where a specific instance lives. Every AtomSource in every atom in every version is a `*.tsx` file — that's definitional. Putting it on the instance would mean repeating `{ match: "*.tsx" }` for every atom, which is both noisy and error-prone.

This is consistent with how `pure: true` works today: purity is intrinsic to what a DomainLayer IS, so it lives on the Kind type. The file pattern is intrinsic to what an AtomSource IS, so it lives on the Kind type.

## Uplift needed

### 1. Add `filePattern` to `Constraints`

```typescript
export type Constraints<Members = Record<string, never>> = {
  pure?: true;
  noDependency?: ReadonlyArray<...>;
  // ...existing constraints...

  /** File glob pattern — scopes this Kind to matching files instead of a directory */
  filePattern?: string;
};
```

### 2. Scope resolution: files, not just directories

Today, every Kind's scope is a directory. The classifier resolves a member's scope by joining the parent's root path with the member name (or explicit `path` override) to get a directory.

With `filePattern`, the classifier needs a second resolution mode:

1. Resolve the parent Kind's directory scope (e.g., `atoms/Button/v1.0.0/`)
2. For each member, check if the member's Kind has a `filePattern` constraint
3. If yes: scan the parent directory for files matching the glob. Those files are the member's scope.
4. If no: resolve as a subdirectory (existing behavior).

### 3. Instance accepts `{}` for file-pattern members

When a member's Kind has `filePattern`, the instance doesn't need to provide a path — the pattern is already on the type. The instance just provides `{}` (or optionally an `exclude` override if needed).

## What this enables

Once `filePattern` works, AtomSource can be used as a building block:

```typescript
// Atom version — groups the source with its stories and tests
type AtomVersion = Kind<"AtomVersion", {
  source: AtomSource;
  stories: AtomStories;   // filePattern: "*.stories.tsx"
  tests: AtomTests;       // filePattern: "*.test.tsx"
}, {
  noDependency: [["source", "stories"], ["source", "tests"]];
}>;
```

The same `filePattern` mechanism scales to MoleculeSource, OrganismSource, etc. — each with different patterns but the same underlying resolution.
