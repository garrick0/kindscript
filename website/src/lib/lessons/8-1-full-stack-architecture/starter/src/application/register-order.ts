import { Order } from '../domain/order';

export function registerOrder(id: string, total: number): Order {
  return new Order(id, total);
}
