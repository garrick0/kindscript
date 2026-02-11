import type { Kind, Instance } from 'kindscript';

// Leaf Kinds
type AtomSource = Kind<"AtomSource">;
type AtomStory  = Kind<"AtomStory">;

// Composite Kind with two members
type ButtonComponent = Kind<"ButtonComponent", {
  source: [AtomSource, './v1.0.0/Button.tsx'];
  story:  [AtomStory,  './v1.0.0/Button.stories.tsx'];
}>;

export const button = {
  source: {},
  story: {},
} satisfies Instance<ButtonComponent, '.'>;
