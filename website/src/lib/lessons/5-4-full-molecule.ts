import { Lesson } from './types';

export const lesson: Lesson = {
  "slug": "5-4-full-molecule",
  "title": "Composing the Molecule",
  "partTitle": "Modeling Molecules",
  "partNumber": 5,
  "lessonNumber": 4,
  "focus": "src/context.ts",
  "files": [
    {
      "path": "src/context.ts",
      "contents": "import type { Kind, Instance } from 'kindscript';\n\n// Leaf Kinds\ntype MoleculeSource = Kind<\"MoleculeSource\">;\ntype MoleculeStory  = Kind<\"MoleculeStory\">;\n\n// MoleculeVersion: a version folder containing source + stories\ntype MoleculeVersion = Kind<\"MoleculeVersion\", {\n  source: [MoleculeSource, './Card.tsx'];\n  story:  [MoleculeStory,  './Card.stories.tsx'];\n}, {\n  noDependency: [[\"source\", \"story\"]];\n}>;\n\n// Molecule: the full component package with version(s)\ntype Molecule = Kind<\"Molecule\", {\n  v1: [MoleculeVersion, './v1.0.0'];\n}>;\n\nexport const card = {\n  v1: {\n    source: {},\n    story: {},\n  },\n} satisfies Instance<Molecule, '.'>;\n"
    },
    {
      "path": "src/index.ts",
      "contents": "export {\n  Card,\n  CardHeader,\n  CardTitle,\n  CardContent,\n  CardFooter,\n} from './v1.0.0/Card';\nexport type { CardProps } from './v1.0.0/Card';\n"
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
      "contents": "import type { Kind, Instance } from 'kindscript';\n\n// Leaf Kinds\ntype MoleculeSource = Kind<\"MoleculeSource\">;\ntype MoleculeStory  = Kind<\"MoleculeStory\">;\n\n// MoleculeVersion: a version folder containing source + stories\ntype MoleculeVersion = Kind<\"MoleculeVersion\", {\n  source: [MoleculeSource, './Card.tsx'];\n  story:  [MoleculeStory,  './Card.stories.tsx'];\n}, {\n  noDependency: [[\"source\", \"story\"]];\n}>;\n\n// Molecule: the full component package with version(s)\ntype Molecule = Kind<\"Molecule\", {\n  v1: [MoleculeVersion, './v1.0.0'];\n}>;\n\nexport const card = {\n  v1: {\n    source: {},\n    story: {},\n  },\n} satisfies Instance<Molecule, '.'>;\n"
    },
    {
      "path": "src/index.ts",
      "contents": "export {\n  Card,\n  CardHeader,\n  CardTitle,\n  CardContent,\n  CardFooter,\n} from './v1.0.0/Card';\nexport type { CardProps } from './v1.0.0/Card';\n"
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
