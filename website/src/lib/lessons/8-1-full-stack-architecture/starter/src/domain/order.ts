import { OrderRepository } from '../infrastructure/order-repo';

export class Order {
  constructor(public readonly id: string, public readonly total: number) {}

  save(): void {
    const repo = new OrderRepository();
    repo.save(this);
  }
}
