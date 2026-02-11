import { Lesson } from './types';

export const lesson: Lesson = {
  "slug": "4-3-atom-version",
  "title": "The Version Pattern",
  "partTitle": "Modeling a Design System",
  "partNumber": 4,
  "lessonNumber": 3,
  "focus": "src/context.ts",
  "files": [
    {
      "path": "src/context.ts",
      "contents": "import type { Kind, Instance } from 'kindscript';\n\n// Leaf Kinds\ntype AtomSource = Kind<\"AtomSource\">;\ntype AtomStory  = Kind<\"AtomStory\">;\n\n// AtomVersion: a version folder containing source + stories\ntype AtomVersion = Kind<\"AtomVersion\", {\n  source: [AtomSource, './Button.tsx'];\n  story:  [AtomStory,  './Button.stories.tsx'];\n}, {\n  noDependency: [[\"source\", \"story\"]];\n}>;\n\nexport const buttonV1 = {\n  source: {},\n  story: {},\n} satisfies Instance<AtomVersion, './v1.0.0'>;\n"
    },
    {
      "path": "src/v1.0.0/Button.stories.tsx",
      "contents": "import { Button, type ButtonProps } from './Button';\n\ntype Story = { args: ButtonProps };\n\nexport default { title: 'Atoms/Button/v1.0.0' };\n\nexport const Default: Story = { args: { label: 'Click me' } };\nexport const Outline: Story = { args: { variant: 'outline', label: 'Outline' } };\nexport const Disabled: Story = { args: { disabled: true, label: 'Disabled' } };\n"
    },
    {
      "path": "src/v1.0.0/Button.tsx",
      "contents": "export interface ButtonProps {\n  variant?: 'default' | 'outline' | 'ghost';\n  size?: 'sm' | 'md' | 'lg';\n  label: string;\n  disabled?: boolean;\n}\n\nexport function Button({ variant = 'default', size = 'md', label, disabled }: ButtonProps) {\n  const className = `btn btn-${variant} btn-${size}`;\n  return `<button class=\"${className}\" ${disabled ? 'disabled' : ''}>${label}</button>`;\n}\n"
    }
  ],
  "solution": [
    {
      "path": "src/context.ts",
      "contents": "import type { Kind, Instance } from 'kindscript';\n\n// Leaf Kinds\ntype AtomSource = Kind<\"AtomSource\">;\ntype AtomStory  = Kind<\"AtomStory\">;\n\n// AtomVersion: a version folder containing source + stories\ntype AtomVersion = Kind<\"AtomVersion\", {\n  source: [AtomSource, './Button.tsx'];\n  story:  [AtomStory,  './Button.stories.tsx'];\n}, {\n  noDependency: [[\"source\", \"story\"]];\n}>;\n\nexport const buttonV1 = {\n  source: {},\n  story: {},\n} satisfies Instance<AtomVersion, './v1.0.0'>;\n"
    },
    {
      "path": "src/v1.0.0/Button.stories.tsx",
      "contents": "import { Button, type ButtonProps } from './Button';\n\ntype Story = { args: ButtonProps };\n\nexport default { title: 'Atoms/Button/v1.0.0' };\n\nexport const Default: Story = { args: { label: 'Click me' } };\nexport const Outline: Story = { args: { variant: 'outline', label: 'Outline' } };\nexport const Disabled: Story = { args: { disabled: true, label: 'Disabled' } };\n"
    },
    {
      "path": "src/v1.0.0/Button.tsx",
      "contents": "export interface ButtonProps {\n  variant?: 'default' | 'outline' | 'ghost';\n  size?: 'sm' | 'md' | 'lg';\n  label: string;\n  disabled?: boolean;\n}\n\nexport function Button({ variant = 'default', size = 'md', label, disabled }: ButtonProps) {\n  const className = `btn btn-${variant} btn-${size}`;\n  return `<button class=\"${className}\" ${disabled ? 'disabled' : ''}>${label}</button>`;\n}\n"
    }
  ]
};
