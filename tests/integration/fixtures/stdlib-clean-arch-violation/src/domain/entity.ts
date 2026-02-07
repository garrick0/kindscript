import { Repository } from '../infrastructure/repository';

export class Entity {
  id: string = '';
  repo = new Repository();
}
