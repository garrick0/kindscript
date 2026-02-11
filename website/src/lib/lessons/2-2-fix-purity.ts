import { Lesson } from './types';

export const lesson: Lesson = {
  "slug": "2-2-fix-purity",
  "title": "Fix Purity",
  "partTitle": "purity — No I/O in Pure Layers",
  "partNumber": 2,
  "lessonNumber": 2,
  "focus": "src/domain/service.ts",
  "files": [
    {
      "path": "src/context.ts",
      "contents": "import type { Kind, Instance } from 'kindscript';\n\ntype DomainLayer = Kind<\"DomainLayer\", {}, { pure: true }>;\n\ntype AppContext = Kind<\"AppContext\", {\n  domain: [DomainLayer, './domain'];\n}>;\n\nexport const app = {\n  domain: {},\n} satisfies Instance<AppContext, '.'>;\n"
    },
    {
      "path": "src/domain/service.ts",
      "contents": "import * as fs from 'fs';\n\nexport class DomainService {\n  readData(): string {\n    return fs.readFileSync('/tmp/data.txt', 'utf-8');\n  }\n}\n"
    }
  ],
  "solution": [
    {
      "path": "src/context.ts",
      "contents": "import type { Kind, Instance } from 'kindscript';\n\ntype DomainLayer = Kind<\"DomainLayer\", {}, { pure: true }>;\n\ntype AppContext = Kind<\"AppContext\", {\n  domain: [DomainLayer, './domain'];\n}>;\n\nexport const app = {\n  domain: {},\n} satisfies Instance<AppContext, '.'>;\n"
    },
    {
      "path": "src/domain/service.ts",
      "contents": "export interface DataReader {\n  read(path: string): string;\n}\n\nexport class DomainService {\n  constructor(private reader: DataReader) {}\n  readData(): string {\n    return this.reader.read('/tmp/data.txt');\n  }\n}\n"
    }
  ]
};
