import { DomainService } from '../domain/service';

export class Database {
  private service = new DomainService();
  query(sql: string): string[] { return [sql]; }
}
