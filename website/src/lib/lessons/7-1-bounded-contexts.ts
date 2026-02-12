import { Lesson } from './types';

export const lesson: Lesson = {
  "slug": "7-1-bounded-contexts",
  "title": "Bounded Contexts",
  "partTitle": "Scaling Your Architecture",
  "partNumber": 7,
  "lessonNumber": 1,
  "focus": "src/context.ts",
  "files": [
    {
      "path": "src/billing/domain/invoice.ts",
      "contents": "import { PaymentGateway } from '../infrastructure/payment';\n\nexport class Invoice {\n  constructor(public readonly id: string, public readonly amount: number) {}\n\n  process(): boolean {\n    const gateway = new PaymentGateway();\n    return gateway.charge(this.amount);\n  }\n}\n"
    },
    {
      "path": "src/billing/infrastructure/payment.ts",
      "contents": "export class PaymentGateway {\n  charge(amount: number): boolean {\n    return amount > 0;\n  }\n}\n"
    },
    {
      "path": "src/context.ts",
      "contents": "import type { Kind, Instance } from 'kindscript';\n\ntype DomainLayer = Kind<\"DomainLayer\">;\ntype InfrastructureLayer = Kind<\"InfrastructureLayer\">;\n\n// Define the architecture once\ntype BoundedContext = Kind<\"BoundedContext\", {\n  domain: [DomainLayer, './domain'];\n  infrastructure: [InfrastructureLayer, './infrastructure'];\n}, {\n  noDependency: [[\"domain\", \"infrastructure\"]];\n}>;\n\n// Instance 1: ordering\nexport const ordering = {\n  domain: {},\n  infrastructure: {},\n} satisfies Instance<BoundedContext, './ordering'>;\n\n// Instance 2: billing\nexport const billing = {\n  domain: {},\n  infrastructure: {},\n} satisfies Instance<BoundedContext, './billing'>;\n"
    },
    {
      "path": "src/ordering/domain/order.ts",
      "contents": "export class Order {\n  constructor(public readonly id: string, public readonly total: number) {}\n}\n"
    },
    {
      "path": "src/ordering/infrastructure/order-repo.ts",
      "contents": "export class OrderRepository {\n  findById(id: string): unknown {\n    return { id };\n  }\n}\n"
    }
  ],
  "solution": [
    {
      "path": "src/billing/domain/invoice.ts",
      "contents": "export interface PaymentProcessor {\n  charge(amount: number): boolean;\n}\n\nexport class Invoice {\n  constructor(public readonly id: string, public readonly amount: number) {}\n\n  process(processor: PaymentProcessor): boolean {\n    return processor.charge(this.amount);\n  }\n}\n"
    },
    {
      "path": "src/billing/infrastructure/payment.ts",
      "contents": "export class PaymentGateway {\n  charge(amount: number): boolean {\n    return amount > 0;\n  }\n}\n"
    },
    {
      "path": "src/context.ts",
      "contents": "import type { Kind, Instance } from 'kindscript';\n\ntype DomainLayer = Kind<\"DomainLayer\">;\ntype InfrastructureLayer = Kind<\"InfrastructureLayer\">;\n\n// Define the architecture once\ntype BoundedContext = Kind<\"BoundedContext\", {\n  domain: [DomainLayer, './domain'];\n  infrastructure: [InfrastructureLayer, './infrastructure'];\n}, {\n  noDependency: [[\"domain\", \"infrastructure\"]];\n}>;\n\n// Instance 1: ordering\nexport const ordering = {\n  domain: {},\n  infrastructure: {},\n} satisfies Instance<BoundedContext, './ordering'>;\n\n// Instance 2: billing\nexport const billing = {\n  domain: {},\n  infrastructure: {},\n} satisfies Instance<BoundedContext, './billing'>;\n"
    },
    {
      "path": "src/ordering/domain/order.ts",
      "contents": "export class Order {\n  constructor(public readonly id: string, public readonly total: number) {}\n}\n"
    },
    {
      "path": "src/ordering/infrastructure/order-repo.ts",
      "contents": "export class OrderRepository {\n  findById(id: string): unknown {\n    return { id };\n  }\n}\n"
    }
  ]
};
