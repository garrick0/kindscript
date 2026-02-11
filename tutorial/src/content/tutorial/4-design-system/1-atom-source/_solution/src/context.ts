import type { Kind, Instance } from 'kindscript';

// A leaf Kind: a .tsx file that defines a UI component
type AtomSource = Kind<"AtomSource">;

// A composite Kind with one member
type ButtonComponent = Kind<"ButtonComponent", {
  source: [AtomSource, './v1.0.0/Button.tsx'];
}>;

export const button = {
  source: {},
} satisfies Instance<ButtonComponent, '.'>;
