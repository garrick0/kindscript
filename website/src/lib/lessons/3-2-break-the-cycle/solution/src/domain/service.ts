export interface DataStore {
  query(sql: string): string[];
}

export class DomainService {
  constructor(private store: DataStore) {}
  getData(): string[] { return this.store.query('SELECT *'); }
}
