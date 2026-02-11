---
type: lesson
title: "The Molecule Version"
focus: src/context.ts
---

# The Molecule Version

Just like atoms, we extract the version folder into a reusable Kind.

## What changed in `src/context.ts`?

`MoleculeVersion` composes source and story with the same `noDependency` constraint:

```ts
type MoleculeVersion = Kind<"MoleculeVersion", {
  source: [MoleculeSource, './Card.tsx'];
  story:  [MoleculeStory,  './Card.stories.tsx'];
}, {
  noDependency: [["source", "story"]];
}>;
```

The constraint enforces a one-way dependency: `Card.stories.tsx` can import from `Card.tsx`, but `Card.tsx` cannot import from `Card.stories.tsx`.

The instance root shifts to the version folder:

```ts
export const cardV1 = {
  source: {},
  story: {},
} satisfies Instance<MoleculeVersion, './v1.0.0'>;
```

## Run the check

```
npx ksc check .
```

**0 violations.** Card.tsx has no imports from Card.stories.tsx, so the constraint is satisfied.

:::tip
Notice the pattern: `AtomVersion` and `MoleculeVersion` have the same shape — source + story + noDependency. They're structurally identical, just named differently. In a later step you could unify them into a single `ComponentVersion` kind.
:::
