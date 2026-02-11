import type { Kind, Instance } from 'kindscript';

// Leaf Kinds
type AtomSource = Kind<"AtomSource">;
type AtomStory  = Kind<"AtomStory">;

// AtomVersion: a version folder containing source + stories
type AtomVersion = Kind<"AtomVersion", {
  source: [AtomSource, './Button.tsx'];
  story:  [AtomStory,  './Button.stories.tsx'];
}, {
  noDependency: [["source", "story"]];
}>;

export const buttonV1 = {
  source: {},
  story: {},
} satisfies Instance<AtomVersion, './v1.0.0'>;
