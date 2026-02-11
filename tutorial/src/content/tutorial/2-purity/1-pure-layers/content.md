---
type: lesson
title: "Pure Layers"
focus: src/domain/service.ts
---

# Pure Layers

The `purity` constraint ensures a layer has no side effects — no `fs`, `http`, `net`, `child_process`, or any of Node's ~50 built-in I/O modules.

**Use case:** Domain logic should be pure. If it needs to read a file, it receives the data through a port (interface).

## How purity works

Purity is declared as an **intrinsic constraint** on a Kind:

```ts
type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;
```

When a composite Kind contains a member of this type, purity is automatically enforced for all files in that member's location.

## See the violation

Look at `src/domain/service.ts` — it imports `fs` directly. The domain is supposed to be pure!

Now look at `src/context.ts` — the `DomainLayer` Kind has `{ pure: true }`.

Run the check:

```
npx ksc check .
```

You'll see a **KS70003** error — a purity violation. The domain layer is importing a Node.js built-in I/O module.
