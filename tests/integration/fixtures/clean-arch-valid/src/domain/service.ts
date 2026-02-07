// Domain service only imports from domain - this is correct
import { Entity } from './entity';

export class DomainService {
  create(id: string, name: string): Entity {
    return new Entity(id, name);
  }
}
