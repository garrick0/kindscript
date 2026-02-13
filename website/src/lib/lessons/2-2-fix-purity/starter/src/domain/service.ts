import * as fs from 'fs';

export class DomainService {
  readData(): string {
    return fs.readFileSync('/tmp/data.txt', 'utf-8');
  }
}
