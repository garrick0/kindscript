/**
 * Atomic Design system architecture (with violation).
 * Same model as design-system-clean, but atoms/Button.tsx imports from organisms.
 */

import type { Kind, Instance } from 'kindscript';

export type Atoms = Kind<"Atoms">;
export type Molecules = Kind<"Molecules">;
export type Organisms = Kind<"Organisms">;
export type Pages = Kind<"Pages">;

export type DesignSystem = Kind<"DesignSystem", {
  atoms: [Atoms, './atoms'];
  molecules: [Molecules, './molecules'];
  organisms: [Organisms, './organisms'];
  pages: [Pages, './pages'];
}, {
  noDependency: [
    ["atoms", "molecules"],
    ["atoms", "organisms"],
    ["atoms", "pages"],
    ["molecules", "organisms"],
    ["molecules", "pages"],
    ["organisms", "pages"],
  ];
}>;

export const ui = {
  atoms: {},
  molecules: {},
  organisms: {},
  pages: {},
} satisfies Instance<DesignSystem, '.'>;
