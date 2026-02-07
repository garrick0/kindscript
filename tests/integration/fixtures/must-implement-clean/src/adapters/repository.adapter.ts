import { RepositoryPort } from '../ports/repository.port';

export class InMemoryRepositoryAdapter implements RepositoryPort {
  private store: unknown[] = [];

  save(entity: unknown): void {
    this.store.push(entity);
  }

  findAll(): unknown[] {
    return [...this.store];
  }
}
