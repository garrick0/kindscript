import { Lesson } from './types';

export const lesson: Lesson = {
  "slug": "4-1-atom-source",
  "title": "Modeling a Component",
  "partTitle": "Modeling a Design System",
  "partNumber": 4,
  "lessonNumber": 1,
  "focus": "src/context.ts",
  "files": [
    {
      "path": "src/context.ts",
      "contents": "import type { Kind, Instance } from 'kindscript';\n\n// A leaf Kind: a .tsx file that defines a UI component\ntype AtomSource = Kind<\"AtomSource\">;\n\n// A composite Kind with one member\ntype ButtonComponent = Kind<\"ButtonComponent\", {\n  source: [AtomSource, './v1.0.0/Button.tsx'];\n}>;\n\nexport const button = {\n  source: {},\n} satisfies Instance<ButtonComponent, '.'>;\n"
    },
    {
      "path": "src/v1.0.0/Button.tsx",
      "contents": "export interface ButtonProps {\n  variant?: 'default' | 'outline' | 'ghost';\n  size?: 'sm' | 'md' | 'lg';\n  label: string;\n  disabled?: boolean;\n}\n\nexport function Button({ variant = 'default', size = 'md', label, disabled }: ButtonProps) {\n  const className = `btn btn-${variant} btn-${size}`;\n  return `<button class=\"${className}\" ${disabled ? 'disabled' : ''}>${label}</button>`;\n}\n"
    }
  ],
  "solution": [
    {
      "path": "src/context.ts",
      "contents": "import type { Kind, Instance } from 'kindscript';\n\n// A leaf Kind: a .tsx file that defines a UI component\ntype AtomSource = Kind<\"AtomSource\">;\n\n// A composite Kind with one member\ntype ButtonComponent = Kind<\"ButtonComponent\", {\n  source: [AtomSource, './v1.0.0/Button.tsx'];\n}>;\n\nexport const button = {\n  source: {},\n} satisfies Instance<ButtonComponent, '.'>;\n"
    },
    {
      "path": "src/v1.0.0/Button.tsx",
      "contents": "export interface ButtonProps {\n  variant?: 'default' | 'outline' | 'ghost';\n  size?: 'sm' | 'md' | 'lg';\n  label: string;\n  disabled?: boolean;\n}\n\nexport function Button({ variant = 'default', size = 'md', label, disabled }: ButtonProps) {\n  const className = `btn btn-${variant} btn-${size}`;\n  return `<button class=\"${className}\" ${disabled ? 'disabled' : ''}>${label}</button>`;\n}\n"
    }
  ]
};
