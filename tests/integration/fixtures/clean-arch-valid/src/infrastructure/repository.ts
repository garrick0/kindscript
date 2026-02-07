// Infrastructure importing from domain is allowed
import { Entity } from '../domain/entity';

export class Repository {
  private store: Entity[] = [];

  save(entity: Entity): void {
    this.store.push(entity);
  }

  findAll(): Entity[] {
    return [...this.store];
  }
}
