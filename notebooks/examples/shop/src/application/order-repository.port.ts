import { Order } from '../domain/order';

export interface OrderRepositoryPort {
  save(order: Order): void;
  findById(id: string): Order | undefined;
  findByCustomerId(customerId: string): Order[];
}
