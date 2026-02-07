import { Entity } from '../domain/entity';

export function handleEntity(e: Entity): string {
  return e.id;
}
