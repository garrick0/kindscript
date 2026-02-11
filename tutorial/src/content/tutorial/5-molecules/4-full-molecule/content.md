---
type: lesson
title: "Composing the Molecule"
focus: src/context.ts
---

# Composing the Molecule

The full molecule has version folder(s) plus an `index.ts` barrel export:

```
Card/
├── index.ts             ← re-exports from v1.0.0
└── v1.0.0/
    ├── Card.tsx
    └── Card.stories.tsx
```

## What changed in `src/context.ts`?

We wrapped `MoleculeVersion` in a `Molecule` kind:

```ts
type Molecule = Kind<"Molecule", {
  v1: [MoleculeVersion, './v1.0.0'];
}>;
```

The nested instance:

```ts
export const card = {
  v1: {
    source: {},
    story: {},
  },
} satisfies Instance<Molecule, '.'>;
```

Open `src/index.ts` — it re-exports the Card and its compound components (CardHeader, CardTitle, etc.) from the current version.

## Run the check

```
npx ksc check .
```

**0 violations.** The complete molecule is modeled.

:::info
**Atoms and molecules, same pattern.** Both follow the versioned folder convention: leaf source/story kinds, a version composite with `noDependency`, and a top-level kind wrapping versions + index. The Kind hierarchy captures this shared structure while keeping atom and molecule concerns separate.
:::
