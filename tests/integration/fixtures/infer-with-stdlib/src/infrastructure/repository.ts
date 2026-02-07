import { Entity } from '../domain/entity';

export class Repository {
  save(entity: Entity): void {
    console.log(entity.id);
  }
}
