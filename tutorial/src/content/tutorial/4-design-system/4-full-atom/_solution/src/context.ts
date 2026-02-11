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

// Atom: the full component package with version(s)
type Atom = Kind<"Atom", {
  v1: [AtomVersion, './v1.0.0'];
}>;

export const button = {
  v1: {
    source: {},
    story: {},
  },
} satisfies Instance<Atom, '.'>;
