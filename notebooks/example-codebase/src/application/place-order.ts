import { createOrder, createOrderLine, confirmOrder, Order } from '../domain/order';
import { OrderRepositoryPort } from './order-repository.port';
import { ProductCatalogPort } from './product-catalog.port';
import { NotificationPort } from './notification.port';

export interface PlaceOrderRequest {
  orderId: string;
  customerId: string;
  items: Array<{ productId: string; quantity: number }>;
}

export function placeOrder(
  request: PlaceOrderRequest,
  orderRepo: OrderRepositoryPort,
  catalog: ProductCatalogPort,
  notifications: NotificationPort,
): Order {
  const lines = request.items.map(item => {
    const product = catalog.findById(item.productId);
    if (!product) throw new Error(`Product not found: ${item.productId}`);
    return createOrderLine(product, item.quantity);
  });

  const order = createOrder(request.orderId, request.customerId, lines);
  const confirmed = confirmOrder(order);

  orderRepo.save(confirmed);
  notifications.sendOrderConfirmation(request.customerId, confirmed.id);

  return confirmed;
}
