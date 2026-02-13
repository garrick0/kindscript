import { DataStore } from '../domain/service';

export class Database implements DataStore {
  query(sql: string): string[] { return [sql]; }
}
