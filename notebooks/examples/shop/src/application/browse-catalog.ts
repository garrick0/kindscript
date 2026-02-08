import { Product } from '../domain/product';
import { ProductCatalogPort } from './product-catalog.port';

export function listProducts(catalog: ProductCatalogPort): Product[] {
  return catalog.findAll().filter(p => p.inStock);
}

export function searchProducts(query: string, catalog: ProductCatalogPort): Product[] {
  return catalog.search(query).filter(p => p.inStock);
}
