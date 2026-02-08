import { Money } from './money';

export interface Product {
  readonly id: string;
  readonly name: string;
  readonly price: Money;
  readonly sku: string;
  readonly inStock: boolean;
}

export function createProduct(
  id: string,
  name: string,
  price: Money,
  sku: string,
): Product {
  return { id, name, price, sku, inStock: true };
}

export function markOutOfStock(product: Product): Product {
  return { ...product, inStock: false };
}

export function repriceProduct(product: Product, newPrice: Money): Product {
  return { ...product, price: newPrice };
}
