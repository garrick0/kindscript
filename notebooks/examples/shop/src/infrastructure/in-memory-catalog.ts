import { Product, createProduct } from '../domain/product';
import { Money } from '../domain/money';
import { ProductCatalogPort } from '../application/product-catalog.port';

/**
 * In-memory product catalog seeded with sample data.
 */
export class InMemoryCatalog implements ProductCatalogPort {
  private products: Product[];

  constructor() {
    this.products = [
      createProduct("p-001", "Mechanical Keyboard", new Money(149.99, "USD"), "KB-MECH-001"),
      createProduct("p-002", "Ergonomic Mouse", new Money(79.99, "USD"), "MS-ERGO-001"),
      createProduct("p-003", "USB-C Hub", new Money(49.99, "USD"), "HUB-USBC-001"),
      createProduct("p-004", "Monitor Stand", new Money(39.99, "USD"), "STD-MON-001"),
      createProduct("p-005", "Desk Mat", new Money(29.99, "USD"), "MAT-DESK-001"),
    ];
  }

  findById(id: string): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  findAll(): Product[] {
    return [...this.products];
  }

  search(query: string): Product[] {
    const lower = query.toLowerCase();
    return this.products.filter(p =>
      p.name.toLowerCase().includes(lower) || p.sku.toLowerCase().includes(lower)
    );
  }
}
