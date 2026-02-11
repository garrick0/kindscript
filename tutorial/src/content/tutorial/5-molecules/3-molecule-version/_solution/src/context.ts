import type { Kind, Instance } from 'kindscript';

// Leaf Kinds
type MoleculeSource = Kind<"MoleculeSource">;
type MoleculeStory  = Kind<"MoleculeStory">;

// MoleculeVersion: a version folder containing source + stories
type MoleculeVersion = Kind<"MoleculeVersion", {
  source: [MoleculeSource, './Card.tsx'];
  story:  [MoleculeStory,  './Card.stories.tsx'];
}, {
  noDependency: [["source", "story"]];
}>;

export const cardV1 = {
  source: {},
  story: {},
} satisfies Instance<MoleculeVersion, './v1.0.0'>;
