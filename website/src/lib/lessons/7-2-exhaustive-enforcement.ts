import { Lesson } from './types';

export const lesson: Lesson = {
  "slug": "7-2-exhaustive-enforcement",
  "title": "Exhaustive Enforcement",
  "partTitle": "Scaling Your Architecture",
  "partNumber": 7,
  "lessonNumber": 2,
  "focus": "src/context.ts",
  "files": [
    {
      "path": "src/context.ts",
      "contents": "import type { Kind, Instance } from 'kindscript';\n\ntype Core = Kind<\"Core\">;\n\ntype App = Kind<\"App\", {\n  core: [Core, './core'];\n}, {\n  exhaustive: true;\n}>;\n\nexport const app = {\n  core: {},\n} satisfies Instance<App, '.'>;\n"
    },
    {
      "path": "src/core/logic.ts",
      "contents": "export function processData(input: string): string {\n  return input.toUpperCase();\n}\n"
    },
    {
      "path": "src/helpers.ts",
      "contents": "export function formatDate(date: Date): string {\n  return date.toISOString().split('T')[0];\n}\n\nexport function generateId(): string {\n  return Math.random().toString(36).slice(2);\n}\n"
    }
  ],
  "solution": [
    {
      "path": "src/context.ts",
      "contents": "import type { Kind, Instance } from 'kindscript';\n\ntype Core = Kind<\"Core\">;\ntype Helpers = Kind<\"Helpers\">;\n\ntype App = Kind<\"App\", {\n  core: [Core, './core'];\n  helpers: [Helpers, './helpers.ts'];\n}, {\n  exhaustive: true;\n}>;\n\nexport const app = {\n  core: {},\n  helpers: {},\n} satisfies Instance<App, '.'>;\n"
    },
    {
      "path": "src/core/logic.ts",
      "contents": "export function processData(input: string): string {\n  return input.toUpperCase();\n}\n"
    },
    {
      "path": "src/helpers.ts",
      "contents": "export function formatDate(date: Date): string {\n  return date.toISOString().split('T')[0];\n}\n\nexport function generateId(): string {\n  return Math.random().toString(36).slice(2);\n}\n"
    }
  ]
};
