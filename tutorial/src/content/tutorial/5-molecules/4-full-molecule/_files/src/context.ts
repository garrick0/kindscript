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

// Molecule: the full component package with version(s)
type Molecule = Kind<"Molecule", {
  v1: [MoleculeVersion, './v1.0.0'];
}>;

export const card = {
  v1: {
    source: {},
    story: {},
  },
} satisfies Instance<Molecule, '.'>;
