import { Database } from '../infrastructure/database';

export class DomainService {
  private db = new Database();
  getAll(): string[] {
    return this.db.query('SELECT * FROM entities');
  }
}
