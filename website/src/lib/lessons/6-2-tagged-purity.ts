import { Lesson } from './types';

export const lesson: Lesson = {
  "slug": "6-2-tagged-purity",
  "title": "Pure Tagged Exports",
  "partTitle": "Wrapped Kinds — Declaration-Level Enforcement",
  "partNumber": 6,
  "lessonNumber": 2,
  "focus": "src/validate-order.ts",
  "files": [
    {
      "path": "src/context.ts",
      "contents": "import type { Kind, Instance } from 'kindscript';\n\ntype DeciderFn = (command: unknown) => unknown[];\ntype Decider = Kind<\"Decider\", {}, { pure: true }, { wraps: DeciderFn }>;\n\ntype OrderModule = Kind<\"OrderModule\", {\n  deciders: Decider;\n}>;\n\nexport const order = {\n  deciders: {},\n} satisfies Instance<OrderModule, '.'>;\n"
    },
    {
      "path": "src/validate-order.ts",
      "contents": "import { readFileSync } from 'fs';\nimport type { Kind } from 'kindscript';\n\ntype DeciderFn = (command: unknown) => unknown[];\ntype Decider = Kind<\"Decider\", {}, { pure: true }, { wraps: DeciderFn }>;\n\nexport const validateOrder: Decider = (cmd) => {\n  // Reading config from disk — but Deciders must be pure!\n  const config = readFileSync('/tmp/config.json', 'utf-8');\n  return [{ type: 'OrderValidated', data: cmd, config }];\n};\n"
    }
  ],
  "solution": [
    {
      "path": "src/context.ts",
      "contents": "import type { Kind, Instance } from 'kindscript';\n\ntype DeciderFn = (command: unknown) => unknown[];\ntype Decider = Kind<\"Decider\", {}, { pure: true }, { wraps: DeciderFn }>;\n\ntype OrderModule = Kind<\"OrderModule\", {\n  deciders: Decider;\n}>;\n\nexport const order = {\n  deciders: {},\n} satisfies Instance<OrderModule, '.'>;\n"
    },
    {
      "path": "src/validate-order.ts",
      "contents": "import type { Kind } from 'kindscript';\n\ntype DeciderFn = (command: unknown) => unknown[];\ntype Decider = Kind<\"Decider\", {}, { pure: true }, { wraps: DeciderFn }>;\n\nexport const validateOrder: Decider = (cmd) => {\n  return [{ type: 'OrderValidated', data: cmd }];\n};\n"
    }
  ]
};
