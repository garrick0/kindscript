---
type: lesson
title: "Fix the Violation"
focus: src/domain/user.ts
---

# Challenge: Fix the Violation

The domain layer is importing from infrastructure — that's forbidden by the `noDependency` constraint.

## Your task

Edit `src/domain/user.ts` to remove the infrastructure import. The domain should define pure business logic with no knowledge of how data is stored.

**Hints:**
- Remove the `import { saveUser }` line
- Remove the `saveUser(user)` call from `createUser`
- The domain just creates user objects — persistence is infrastructure's job

## Verify your fix

After editing, run:

```
npx ksc check .
```

You should see **0 violations**.

:::tip
**Fix pattern: Dependency Injection.** Define interfaces in the inner layer; implement them in the outer layer. The domain says *what* it needs, infrastructure provides *how*.
:::
