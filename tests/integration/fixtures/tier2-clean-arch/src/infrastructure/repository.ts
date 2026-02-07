import { Entity } from '../domain/entity';

export class Repository {
  private entities: Entity[] = [];

  save(entity: Entity): void {
    this.entities.push(entity);
  }
}
