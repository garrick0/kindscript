import * as fs from 'fs';

export class Entity {
  id: string = '';

  loadFromDisk(path: string): string {
    return fs.readFileSync(path, 'utf-8');
  }
}
