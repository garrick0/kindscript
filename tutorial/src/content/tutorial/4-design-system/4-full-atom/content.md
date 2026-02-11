---
type: lesson
title: "Composing the Atom"
focus: src/context.ts
---

# Composing the Atom

An atom is the full component package: version folder(s) plus an `index.ts` that re-exports the current version.

```
Button/
├── index.ts             ← re-exports from v1.0.0
└── v1.0.0/
    ├── Button.tsx
    └── Button.stories.tsx
```

## What changed in `src/context.ts`?

We composed `AtomVersion` into a new `Atom` kind:

```ts
type Atom = Kind<"Atom", {
  v1: [AtomVersion, './v1.0.0'];
}>;
```

`Atom` has one member `v1` pointing to the version folder. The `AtomVersion` kind brings its own members (`source`, `story`) and constraints (`noDependency`) along for the ride.

The instance nests naturally:

```ts
export const button = {
  v1: {
    source: {},
    story: {},
  },
} satisfies Instance<Atom, '.'>;
```

The instance root is `'.'` (= `src/`), so `v1` resolves to `src/v1.0.0/`, and within that, `source` to `src/v1.0.0/Button.tsx` and `story` to `src/v1.0.0/Button.stories.tsx`.

## The index file

Open `src/index.ts` — it re-exports from the current version:

```ts
export { Button } from './v1.0.0/Button';
export type { ButtonProps } from './v1.0.0/Button';
```

This file lives at the atom root, outside any version. It's the public API of the atom.

## Run the check

```
npx ksc check .
```

**0 violations.** The full atom structure is modeled and validated.

:::info
**What we built:** A hierarchy of Kinds that mirrors your design system structure. `AtomSource` and `AtomStory` are leaf kinds. `AtomVersion` composes them with a dependency rule. `Atom` composes versions. Each level adds structure and constraints.
:::
