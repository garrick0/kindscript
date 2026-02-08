import { Order } from '../domain/order';
import { OrderRepositoryPort } from '../application/order-repository.port';

/**
 * In-memory implementation of OrderRepositoryPort.
 * In production this would be backed by a SQL database.
 */
export class SqlOrderRepository implements OrderRepositoryPort {
  private store = new Map<string, Order>();

  save(order: Order): void {
    this.store.set(order.id, order);
  }

  findById(id: string): Order | undefined {
    return this.store.get(id);
  }

  findByCustomerId(customerId: string): Order[] {
    return [...this.store.values()].filter(o => o.customerId === customerId);
  }
}
