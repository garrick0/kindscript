import { Lesson } from './types';

export const lesson: Lesson = {
  "slug": "6-3-tagged-boundaries",
  "title": "Boundaries Between Roles",
  "partTitle": "Wrapped Kinds — Declaration-Level Enforcement",
  "partNumber": 6,
  "lessonNumber": 3,
  "focus": "src/apply-discount.ts",
  "files": [
    {
      "path": "src/apply-discount.ts",
      "contents": "import type { Kind } from 'kindscript';\nimport { NOTIFICATION_PREFIX } from './notify-order';\n\ntype DeciderFn = (command: unknown) => unknown[];\ntype Decider = Kind<\"Decider\", {}, {}, { wraps: DeciderFn }>;\n\nexport const applyDiscount: Decider = (cmd) => {\n  console.log(NOTIFICATION_PREFIX);\n  return [{ type: 'DiscountApplied', data: cmd }];\n};\n"
    },
    {
      "path": "src/context.ts",
      "contents": "import type { Kind, Instance } from 'kindscript';\n\ntype DeciderFn = (command: unknown) => unknown[];\ntype EffectorFn = (event: unknown) => void;\n\ntype Decider = Kind<\"Decider\", {}, {}, { wraps: DeciderFn }>;\ntype Effector = Kind<\"Effector\", {}, {}, { wraps: EffectorFn }>;\n\ntype OrderModule = Kind<\"OrderModule\", {\n  deciders: Decider;\n  effectors: Effector;\n}, {\n  noDependency: [[\"deciders\", \"effectors\"]];\n}>;\n\nexport const order = {\n  deciders: {},\n  effectors: {},\n} satisfies Instance<OrderModule, '.'>;\n"
    },
    {
      "path": "src/notify-order.ts",
      "contents": "import type { Kind } from 'kindscript';\n\ntype EffectorFn = (event: unknown) => void;\ntype Effector = Kind<\"Effector\", {}, {}, { wraps: EffectorFn }>;\n\nexport const NOTIFICATION_PREFIX = 'ORDER:';\n\nexport const notifyOrder: Effector = (evt) => {\n  console.log(NOTIFICATION_PREFIX, evt);\n};\n"
    },
    {
      "path": "src/validate-order.ts",
      "contents": "import type { Kind } from 'kindscript';\n\ntype DeciderFn = (command: unknown) => unknown[];\ntype Decider = Kind<\"Decider\", {}, {}, { wraps: DeciderFn }>;\n\nexport const validateOrder: Decider = (cmd) => {\n  return [{ type: 'OrderValidated', data: cmd }];\n};\n"
    }
  ],
  "solution": [
    {
      "path": "src/apply-discount.ts",
      "contents": "import type { Kind } from 'kindscript';\n\ntype DeciderFn = (command: unknown) => unknown[];\ntype Decider = Kind<\"Decider\", {}, {}, { wraps: DeciderFn }>;\n\nexport const applyDiscount: Decider = (cmd) => {\n  return [{ type: 'DiscountApplied', data: cmd }];\n};\n"
    },
    {
      "path": "src/context.ts",
      "contents": "import type { Kind, Instance } from 'kindscript';\n\ntype DeciderFn = (command: unknown) => unknown[];\ntype EffectorFn = (event: unknown) => void;\n\ntype Decider = Kind<\"Decider\", {}, {}, { wraps: DeciderFn }>;\ntype Effector = Kind<\"Effector\", {}, {}, { wraps: EffectorFn }>;\n\ntype OrderModule = Kind<\"OrderModule\", {\n  deciders: Decider;\n  effectors: Effector;\n}, {\n  noDependency: [[\"deciders\", \"effectors\"]];\n}>;\n\nexport const order = {\n  deciders: {},\n  effectors: {},\n} satisfies Instance<OrderModule, '.'>;\n"
    },
    {
      "path": "src/notify-order.ts",
      "contents": "import type { Kind } from 'kindscript';\n\ntype EffectorFn = (event: unknown) => void;\ntype Effector = Kind<\"Effector\", {}, {}, { wraps: EffectorFn }>;\n\nexport const NOTIFICATION_PREFIX = 'ORDER:';\n\nexport const notifyOrder: Effector = (evt) => {\n  console.log(NOTIFICATION_PREFIX, evt);\n};\n"
    },
    {
      "path": "src/validate-order.ts",
      "contents": "import type { Kind } from 'kindscript';\n\ntype DeciderFn = (command: unknown) => unknown[];\ntype Decider = Kind<\"Decider\", {}, {}, { wraps: DeciderFn }>;\n\nexport const validateOrder: Decider = (cmd) => {\n  return [{ type: 'OrderValidated', data: cmd }];\n};\n"
    }
  ]
};
