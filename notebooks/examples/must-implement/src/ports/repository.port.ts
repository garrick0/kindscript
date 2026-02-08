export interface RepositoryPort {
  save(entity: unknown): void;
  findAll(): unknown[];
}
