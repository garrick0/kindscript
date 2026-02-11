import { Lesson } from './types';

export const lesson: Lesson = {
  "slug": "3-1-detecting-cycles",
  "title": "Detecting Cycles",
  "partTitle": "noCycles — Break Circular Dependencies",
  "partNumber": 3,
  "lessonNumber": 1,
  "focus": "src/domain/service.ts",
  "files": [
    {
      "path": "src/context.ts",
      "contents": "import type { Kind, Instance } from 'kindscript';\n\ntype DomainLayer = Kind<\"DomainLayer\">;\ntype InfrastructureLayer = Kind<\"InfrastructureLayer\">;\n\ntype AppContext = Kind<\"AppContext\", {\n  domain: [DomainLayer, './domain'];\n  infrastructure: [InfrastructureLayer, './infrastructure'];\n}, {\n  noCycles: [\"domain\", \"infrastructure\"];\n}>;\n\nexport const app = {\n  domain: {},\n  infrastructure: {},\n} satisfies Instance<AppContext, '.'>;\n"
    },
    {
      "path": "src/domain/service.ts",
      "contents": "import { Database } from '../infrastructure/database';\n\nexport class DomainService {\n  private db = new Database();\n  getData(): string[] { return this.db.query('SELECT *'); }\n}\n"
    },
    {
      "path": "src/infrastructure/database.ts",
      "contents": "import { DomainService } from '../domain/service';\n\nexport class Database {\n  private service = new DomainService();\n  query(sql: string): string[] { return [sql]; }\n}\n"
    }
  ],
  "solution": [
    {
      "path": "src/context.ts",
      "contents": "import type { Kind, Instance } from 'kindscript';\n\ntype DomainLayer = Kind<\"DomainLayer\">;\ntype InfrastructureLayer = Kind<\"InfrastructureLayer\">;\n\ntype AppContext = Kind<\"AppContext\", {\n  domain: [DomainLayer, './domain'];\n  infrastructure: [InfrastructureLayer, './infrastructure'];\n}, {\n  noCycles: [\"domain\", \"infrastructure\"];\n}>;\n\nexport const app = {\n  domain: {},\n  infrastructure: {},\n} satisfies Instance<AppContext, '.'>;\n"
    },
    {
      "path": "src/domain/service.ts",
      "contents": "export interface DataStore {\n  query(sql: string): string[];\n}\n\nexport class DomainService {\n  constructor(private store: DataStore) {}\n  getData(): string[] { return this.store.query('SELECT *'); }\n}\n"
    },
    {
      "path": "src/infrastructure/database.ts",
      "contents": "import { DataStore } from '../domain/service';\n\nexport class Database implements DataStore {\n  query(sql: string): string[] { return [sql]; }\n}\n"
    }
  ]
};
