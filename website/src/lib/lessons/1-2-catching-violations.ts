import { Lesson } from './types';

export const lesson: Lesson = {
  "slug": "1-2-catching-violations",
  "title": "Catching Violations",
  "partTitle": "noDependency — Forbidden Imports",
  "partNumber": 1,
  "lessonNumber": 2,
  "focus": "src/domain/user.ts",
  "files": [
    {
      "path": "src/application/register-user.ts",
      "contents": "import { createUser, User } from '../domain/user';\n\nexport function registerUser(name: string, email: string): User {\n  const user = createUser(name, email);\n  console.log('Registered:', user.name);\n  return user;\n}\n"
    },
    {
      "path": "src/context.ts",
      "contents": "import type { Kind, Instance } from 'kindscript';\n\ntype DomainLayer = Kind<\"DomainLayer\">;\ntype ApplicationLayer = Kind<\"ApplicationLayer\">;\ntype InfrastructureLayer = Kind<\"InfrastructureLayer\">;\n\ntype CleanArchitectureContext = Kind<\"CleanArchitectureContext\", {\n  domain: [DomainLayer, './domain'];\n  application: [ApplicationLayer, './application'];\n  infrastructure: [InfrastructureLayer, './infrastructure'];\n}, {\n  noDependency: [[\"domain\", \"infrastructure\"], [\"domain\", \"application\"]];\n}>;\n\nexport const app = {\n  domain: {},\n  application: {},\n  infrastructure: {},\n} satisfies Instance<CleanArchitectureContext, '.'>;\n"
    },
    {
      "path": "src/domain/user.ts",
      "contents": "import { saveUser } from '../infrastructure/user-repo';\n\nexport interface User {\n  id: string;\n  name: string;\n  email: string;\n}\n\nexport function createUser(name: string, email: string): User {\n  const user = { id: Math.random().toString(36), name, email };\n  saveUser(user); // BAD: domain reaching into infrastructure\n  return user;\n}\n"
    },
    {
      "path": "src/infrastructure/user-repo.ts",
      "contents": "import { User } from '../domain/user';\n\nconst store: User[] = [];\n\nexport function saveUser(user: User): void {\n  store.push(user);\n}\n"
    }
  ],
  "solution": [
    {
      "path": "src/application/register-user.ts",
      "contents": "import { createUser, User } from '../domain/user';\n\nexport function registerUser(name: string, email: string): User {\n  const user = createUser(name, email);\n  console.log('Registered:', user.name);\n  return user;\n}\n"
    },
    {
      "path": "src/context.ts",
      "contents": "import type { Kind, Instance } from 'kindscript';\n\ntype DomainLayer = Kind<\"DomainLayer\">;\ntype ApplicationLayer = Kind<\"ApplicationLayer\">;\ntype InfrastructureLayer = Kind<\"InfrastructureLayer\">;\n\ntype CleanArchitectureContext = Kind<\"CleanArchitectureContext\", {\n  domain: [DomainLayer, './domain'];\n  application: [ApplicationLayer, './application'];\n  infrastructure: [InfrastructureLayer, './infrastructure'];\n}, {\n  noDependency: [[\"domain\", \"infrastructure\"], [\"domain\", \"application\"]];\n}>;\n\nexport const app = {\n  domain: {},\n  application: {},\n  infrastructure: {},\n} satisfies Instance<CleanArchitectureContext, '.'>;\n"
    },
    {
      "path": "src/domain/user.ts",
      "contents": "export interface User {\n  id: string;\n  name: string;\n  email: string;\n}\n\nexport function createUser(name: string, email: string): User {\n  return { id: Math.random().toString(36), name, email };\n}\n"
    },
    {
      "path": "src/infrastructure/user-repo.ts",
      "contents": "import { User } from '../domain/user';\n\nconst store: User[] = [];\n\nexport function saveUser(user: User): void {\n  store.push(user);\n}\n"
    }
  ]
};
