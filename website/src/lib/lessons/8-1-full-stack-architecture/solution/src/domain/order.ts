export interface OrderRepo {
  save(order: unknown): void;
}

export class Order {
  constructor(public readonly id: string, public readonly total: number) {}
}
