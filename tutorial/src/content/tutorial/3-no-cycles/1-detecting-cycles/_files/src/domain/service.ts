import { Database } from '../infrastructure/database';

export class DomainService {
  private db = new Database();
  getData(): string[] { return this.db.query('SELECT *'); }
}
