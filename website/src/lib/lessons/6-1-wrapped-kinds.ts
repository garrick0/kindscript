import { Lesson } from './types';

export const lesson: Lesson = {
  "slug": "6-1-wrapped-kinds",
  "title": "Wrapped Kinds",
  "partTitle": "Wrapped Kinds — Declaration-Level Enforcement",
  "partNumber": 6,
  "lessonNumber": 1,
  "focus": "src/validate-order.ts",
  "files": [
    {
      "path": "src/context.ts",
      "contents": "import type { Kind, Instance } from 'kindscript';\n\n// A wrapped Kind: wraps a TypeScript function type\ntype DeciderFn = (command: unknown) => unknown[];\ntype Decider = Kind<\"Decider\", {}, { pure: true }, { wraps: DeciderFn }>;\n\n// Composite Kind with a wrapped Kind member\ntype OrderModule = Kind<\"OrderModule\", {\n  deciders: Decider;\n}>;\n\nexport const order = {\n  deciders: {},\n} satisfies Instance<OrderModule, '.'>;\n"
    },
    {
      "path": "src/validate-order.ts",
      "contents": "import type { Kind } from 'kindscript';\n\ntype DeciderFn = (command: unknown) => unknown[];\ntype Decider = Kind<\"Decider\", {}, { pure: true }, { wraps: DeciderFn }>;\n\n// Annotate this export as a Decider\nexport const validateOrder: Decider = (cmd) => {\n  return [{ type: 'OrderValidated', data: cmd }];\n};\n"
    }
  ],
  "solution": [
    {
      "path": "src/context.ts",
      "contents": "import type { Kind, Instance } from 'kindscript';\n\n// A wrapped Kind: wraps a TypeScript function type\ntype DeciderFn = (command: unknown) => unknown[];\ntype Decider = Kind<\"Decider\", {}, { pure: true }, { wraps: DeciderFn }>;\n\n// Composite Kind with a wrapped Kind member\ntype OrderModule = Kind<\"OrderModule\", {\n  deciders: Decider;\n}>;\n\nexport const order = {\n  deciders: {},\n} satisfies Instance<OrderModule, '.'>;\n"
    },
    {
      "path": "src/validate-order.ts",
      "contents": "import type { Kind } from 'kindscript';\n\ntype DeciderFn = (command: unknown) => unknown[];\ntype Decider = Kind<\"Decider\", {}, { pure: true }, { wraps: DeciderFn }>;\n\n// Annotate this export as a Decider\nexport const validateOrder: Decider = (cmd) => {\n  return [{ type: 'OrderValidated', data: cmd }];\n};\n"
    }
  ]
};
