import type { Kind, Instance } from 'kindscript';

// A leaf Kind: a .tsx file that defines a molecule component
type MoleculeSource = Kind<"MoleculeSource">;

// A composite Kind with one member
type CardComponent = Kind<"CardComponent", {
  source: [MoleculeSource, './v1.0.0/Card.tsx'];
}>;

export const card = {
  source: {},
} satisfies Instance<CardComponent, '.'>;
