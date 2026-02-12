import { Lesson } from './types';

export const lesson: Lesson = {
  "slug": "8-1-full-stack-architecture",
  "title": "Full-Stack Architecture",
  "partTitle": "Real-World Capstone",
  "partNumber": 8,
  "lessonNumber": 1,
  "focus": "src/context.ts",
  "files": [
    {
      "path": "src/application/register-order.ts",
      "contents": "import { Order } from '../domain/order';\n\nexport function registerOrder(id: string, total: number): Order {\n  return new Order(id, total);\n}\n"
    },
    {
      "path": "src/context.ts",
      "contents": "import type { Kind, Instance } from 'kindscript';\n\n// Wrapped Kind: pure command handlers\ntype HandlerFn = (command: unknown) => unknown[];\ntype CommandHandler = Kind<\"CommandHandler\", {}, { pure: true }, { wraps: HandlerFn }>;\n\n// Layer Kinds\ntype DomainLayer = Kind<\"DomainLayer\", {}, { pure: true }>;\ntype ApplicationLayer = Kind<\"ApplicationLayer\">;\ntype InfrastructureLayer = Kind<\"InfrastructureLayer\">;\n\n// Full architecture\ntype OrderingContext = Kind<\"OrderingContext\", {\n  domain: [DomainLayer, './domain'];\n  application: [ApplicationLayer, './application'];\n  infrastructure: [InfrastructureLayer, './infrastructure'];\n  handlers: CommandHandler;\n}, {\n  noDependency: [\n    [\"domain\", \"infrastructure\"],\n    [\"domain\", \"application\"],\n    [\"handlers\", \"infrastructure\"],\n  ];\n  noCycles: [\"domain\", \"application\", \"infrastructure\"];\n}>;\n\nexport const ordering = {\n  domain: {},\n  application: {},\n  infrastructure: {},\n  handlers: {},\n} satisfies Instance<OrderingContext, '.'>;\n"
    },
    {
      "path": "src/domain/order.ts",
      "contents": "import { OrderRepository } from '../infrastructure/order-repo';\n\nexport class Order {\n  constructor(public readonly id: string, public readonly total: number) {}\n\n  save(): void {\n    const repo = new OrderRepository();\n    repo.save(this);\n  }\n}\n"
    },
    {
      "path": "src/infrastructure/order-repo.ts",
      "contents": "export class OrderRepository {\n  save(order: unknown): void {\n    console.log('Saved:', order);\n  }\n\n  findById(id: string): unknown {\n    return { id };\n  }\n}\n"
    },
    {
      "path": "src/validate-order.ts",
      "contents": "import { readFileSync } from 'fs';\nimport type { Kind } from 'kindscript';\n\ntype HandlerFn = (command: unknown) => unknown[];\ntype CommandHandler = Kind<\"CommandHandler\", {}, { pure: true }, { wraps: HandlerFn }>;\n\nexport const validateOrder: CommandHandler = (cmd) => {\n  const rules = readFileSync('/tmp/rules.json', 'utf-8');\n  return [{ type: 'OrderValidated', data: cmd, rules }];\n};\n"
    }
  ],
  "solution": [
    {
      "path": "src/application/register-order.ts",
      "contents": "import { Order } from '../domain/order';\n\nexport function registerOrder(id: string, total: number): Order {\n  return new Order(id, total);\n}\n"
    },
    {
      "path": "src/context.ts",
      "contents": "import type { Kind, Instance } from 'kindscript';\n\n// Wrapped Kind: pure command handlers\ntype HandlerFn = (command: unknown) => unknown[];\ntype CommandHandler = Kind<\"CommandHandler\", {}, { pure: true }, { wraps: HandlerFn }>;\n\n// Layer Kinds\ntype DomainLayer = Kind<\"DomainLayer\", {}, { pure: true }>;\ntype ApplicationLayer = Kind<\"ApplicationLayer\">;\ntype InfrastructureLayer = Kind<\"InfrastructureLayer\">;\n\n// Full architecture\ntype OrderingContext = Kind<\"OrderingContext\", {\n  domain: [DomainLayer, './domain'];\n  application: [ApplicationLayer, './application'];\n  infrastructure: [InfrastructureLayer, './infrastructure'];\n  handlers: CommandHandler;\n}, {\n  noDependency: [\n    [\"domain\", \"infrastructure\"],\n    [\"domain\", \"application\"],\n    [\"handlers\", \"infrastructure\"],\n  ];\n  noCycles: [\"domain\", \"application\", \"infrastructure\"];\n}>;\n\nexport const ordering = {\n  domain: {},\n  application: {},\n  infrastructure: {},\n  handlers: {},\n} satisfies Instance<OrderingContext, '.'>;\n"
    },
    {
      "path": "src/domain/order.ts",
      "contents": "export interface OrderRepo {\n  save(order: unknown): void;\n}\n\nexport class Order {\n  constructor(public readonly id: string, public readonly total: number) {}\n}\n"
    },
    {
      "path": "src/infrastructure/order-repo.ts",
      "contents": "export class OrderRepository {\n  save(order: unknown): void {\n    console.log('Saved:', order);\n  }\n\n  findById(id: string): unknown {\n    return { id };\n  }\n}\n"
    },
    {
      "path": "src/validate-order.ts",
      "contents": "import type { Kind } from 'kindscript';\n\ntype HandlerFn = (command: unknown) => unknown[];\ntype CommandHandler = Kind<\"CommandHandler\", {}, { pure: true }, { wraps: HandlerFn }>;\n\nexport const validateOrder: CommandHandler = (cmd) => {\n  return [{ type: 'OrderValidated', data: cmd }];\n};\n"
    }
  ]
};
