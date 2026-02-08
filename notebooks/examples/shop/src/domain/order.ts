import { Money, ZERO_USD } from './money';
import { Product } from './product';

export interface OrderLine {
  readonly product: Product;
  readonly quantity: number;
  readonly lineTotal: Money;
}

export interface Order {
  readonly id: string;
  readonly customerId: string;
  readonly lines: ReadonlyArray<OrderLine>;
  readonly total: Money;
  readonly status: OrderStatus;
  readonly createdAt: string;
}

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export function createOrderLine(product: Product, quantity: number): OrderLine {
  if (quantity <= 0) throw new Error("Quantity must be positive");
  if (!product.inStock) throw new Error(`Product ${product.name} is out of stock`);
  return {
    product,
    quantity,
    lineTotal: product.price.multiply(quantity),
  };
}

export function createOrder(id: string, customerId: string, lines: OrderLine[]): Order {
  if (lines.length === 0) throw new Error("Order must have at least one line");
  const total = lines.reduce((sum, line) => sum.add(line.lineTotal), ZERO_USD);
  return {
    id,
    customerId,
    lines,
    total,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
}

export function confirmOrder(order: Order): Order {
  if (order.status !== "pending") {
    throw new Error(`Cannot confirm order in status: ${order.status}`);
  }
  return { ...order, status: "confirmed" };
}

export function cancelOrder(order: Order): Order {
  if (order.status === "shipped" || order.status === "delivered") {
    throw new Error(`Cannot cancel order in status: ${order.status}`);
  }
  return { ...order, status: "cancelled" };
}
