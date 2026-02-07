import { Product } from '../domain/product';

export interface ProductCatalogPort {
  findById(id: string): Product | undefined;
  findAll(): Product[];
  search(query: string): Product[];
}
