import { RepositoryPort } from '../ports/repository.port';

export class RepositoryAdapter implements RepositoryPort {
  save(id: string): void {
    console.log(id);
  }
}
