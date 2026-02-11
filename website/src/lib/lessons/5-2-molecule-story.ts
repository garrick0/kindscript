import { Lesson } from './types';

export const lesson: Lesson = {
  "slug": "5-2-molecule-story",
  "title": "Adding Molecule Stories",
  "partTitle": "Modeling Molecules",
  "partNumber": 5,
  "lessonNumber": 2,
  "focus": "src/context.ts",
  "files": [
    {
      "path": "src/context.ts",
      "contents": "import type { Kind, Instance } from 'kindscript';\n\n// Leaf Kinds\ntype MoleculeSource = Kind<\"MoleculeSource\">;\ntype MoleculeStory  = Kind<\"MoleculeStory\">;\n\n// Composite Kind with two members\ntype CardComponent = Kind<\"CardComponent\", {\n  source: [MoleculeSource, './v1.0.0/Card.tsx'];\n  story:  [MoleculeStory,  './v1.0.0/Card.stories.tsx'];\n}>;\n\nexport const card = {\n  source: {},\n  story: {},\n} satisfies Instance<CardComponent, '.'>;\n"
    },
    {
      "path": "src/v1.0.0/Card.stories.tsx",
      "contents": "import { Card, type CardProps } from './Card';\n\ntype Story = { args: CardProps };\n\nexport default { title: 'Molecules/Card/v1.0.0' };\n\nexport const Default: Story = { args: { children: 'Card content' } };\nexport const Elevated: Story = { args: { variant: 'elevated', children: 'Elevated card' } };\nexport const Outlined: Story = { args: { variant: 'outlined', children: 'Outlined card' } };\nexport const NoPadding: Story = { args: { padding: 'none', children: 'No padding' } };\n"
    },
    {
      "path": "src/v1.0.0/Card.tsx",
      "contents": "export interface CardProps {\n  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';\n  padding?: 'none' | 'sm' | 'default' | 'lg';\n  className?: string;\n  children?: string;\n}\n\nexport function Card({ variant = 'default', padding = 'default', className, children }: CardProps) {\n  const classes = `card card-${variant} card-pad-${padding} ${className || ''}`.trim();\n  return `<div class=\"${classes}\">${children || ''}</div>`;\n}\n\nexport function CardHeader({ children }: { children?: string }) {\n  return `<div class=\"card-header\">${children || ''}</div>`;\n}\n\nexport function CardTitle({ children }: { children?: string }) {\n  return `<h3 class=\"card-title\">${children || ''}</h3>`;\n}\n\nexport function CardContent({ children }: { children?: string }) {\n  return `<div class=\"card-content\">${children || ''}</div>`;\n}\n\nexport function CardFooter({ children }: { children?: string }) {\n  return `<div class=\"card-footer\">${children || ''}</div>`;\n}\n"
    }
  ],
  "solution": [
    {
      "path": "src/context.ts",
      "contents": "import type { Kind, Instance } from 'kindscript';\n\n// Leaf Kinds\ntype MoleculeSource = Kind<\"MoleculeSource\">;\ntype MoleculeStory  = Kind<\"MoleculeStory\">;\n\n// Composite Kind with two members\ntype CardComponent = Kind<\"CardComponent\", {\n  source: [MoleculeSource, './v1.0.0/Card.tsx'];\n  story:  [MoleculeStory,  './v1.0.0/Card.stories.tsx'];\n}>;\n\nexport const card = {\n  source: {},\n  story: {},\n} satisfies Instance<CardComponent, '.'>;\n"
    },
    {
      "path": "src/v1.0.0/Card.stories.tsx",
      "contents": "import { Card, type CardProps } from './Card';\n\ntype Story = { args: CardProps };\n\nexport default { title: 'Molecules/Card/v1.0.0' };\n\nexport const Default: Story = { args: { children: 'Card content' } };\nexport const Elevated: Story = { args: { variant: 'elevated', children: 'Elevated card' } };\nexport const Outlined: Story = { args: { variant: 'outlined', children: 'Outlined card' } };\nexport const NoPadding: Story = { args: { padding: 'none', children: 'No padding' } };\n"
    },
    {
      "path": "src/v1.0.0/Card.tsx",
      "contents": "export interface CardProps {\n  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';\n  padding?: 'none' | 'sm' | 'default' | 'lg';\n  className?: string;\n  children?: string;\n}\n\nexport function Card({ variant = 'default', padding = 'default', className, children }: CardProps) {\n  const classes = `card card-${variant} card-pad-${padding} ${className || ''}`.trim();\n  return `<div class=\"${classes}\">${children || ''}</div>`;\n}\n\nexport function CardHeader({ children }: { children?: string }) {\n  return `<div class=\"card-header\">${children || ''}</div>`;\n}\n\nexport function CardTitle({ children }: { children?: string }) {\n  return `<h3 class=\"card-title\">${children || ''}</h3>`;\n}\n\nexport function CardContent({ children }: { children?: string }) {\n  return `<div class=\"card-content\">${children || ''}</div>`;\n}\n\nexport function CardFooter({ children }: { children?: string }) {\n  return `<div class=\"card-footer\">${children || ''}</div>`;\n}\n"
    }
  ]
};
