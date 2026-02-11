import type { Kind, Instance } from 'kindscript';

// Leaf Kinds
type MoleculeSource = Kind<"MoleculeSource">;
type MoleculeStory  = Kind<"MoleculeStory">;

// Composite Kind with two members
type CardComponent = Kind<"CardComponent", {
  source: [MoleculeSource, './v1.0.0/Card.tsx'];
  story:  [MoleculeStory,  './v1.0.0/Card.stories.tsx'];
}>;

export const card = {
  source: {},
  story: {},
} satisfies Instance<CardComponent, '.'>;
