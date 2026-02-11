# KindScript Interactive Tutorial

Browser-based interactive tutorial built with [TutorialKit](https://tutorialkit.dev). Users edit files in a Monaco editor and run `npx ksc check .` in an in-browser terminal powered by WebContainers.

## Lessons

| # | Part | Lesson | Constraint | What happens |
|---|------|--------|------------|-------------|
| 1 | noDependency | Hello KindScript | — | Clean project, `ksc check` passes |
| 2 | | Catching Violations | KS70001 | Domain imports from infra, error shown |
| 3 | | Fix the Violation | KS70001 | Challenge: remove bad import |
| 4 | purity | Pure Layers | KS70003 | Domain imports `fs`, error shown |
| 5 | | Fix Purity | KS70003 | Challenge: refactor to dependency injection |
| 6 | noCycles | Detecting Cycles | KS70004 | Mutual import between layers, error shown |
| 7 | | Break the Cycle | KS70004 | Challenge: apply dependency inversion |
| 8 | Design System | Modeling a Component | — | Define AtomSource kind, instance Button.tsx |
| 9 | | Adding Stories | — | Define AtomStory kind, add stories member |
| 10 | | The Version Pattern | noDependency | Compose AtomVersion, add source→story constraint |
| 11 | | Composing the Atom | — | Nest AtomVersion in Atom, add index.ts |
| 12 | Molecules | Modeling a Molecule | — | Define MoleculeSource kind, instance Card.tsx |
| 13 | | Adding Molecule Stories | — | Define MoleculeStory kind, add stories member |
| 14 | | The Molecule Version | noDependency | Compose MoleculeVersion, add source→story constraint |
| 15 | | Composing the Molecule | — | Nest MoleculeVersion in Molecule, add index.ts |

## Setup

```bash
# From repo root — build KindScript and sync into the tutorial template
bash tutorial/scripts/sync-kindscript.sh

# Install tutorial dependencies
cd tutorial && npm install
```

## Development

```bash
npm start        # Dev server at http://localhost:4321
npm run build    # Production build into tutorial/dist/
npm run preview  # Preview the production build
```

## After changing KindScript source

Re-run the sync script to copy the latest compiled CLI into the template:

```bash
npm run sync     # or: bash scripts/sync-kindscript.sh
```

## Structure

```
tutorial/
├── scripts/sync-kindscript.sh       # Builds KindScript, copies dist/ into template
├── src/
│   ├── content/tutorial/            # Lesson content (markdown + file fixtures)
│   │   ├── meta.md                  # Root config (prepareCommands, terminal)
│   │   ├── 1-first-check/           # Part 1: noDependency (3 lessons)
│   │   ├── 2-purity/                # Part 2: purity (2 lessons)
│   │   ├── 3-no-cycles/             # Part 3: noCycles (2 lessons)
│   │   ├── 4-design-system/         # Part 4: Design system atoms (4 lessons)
│   │   └── 5-molecules/             # Part 5: Design system molecules (4 lessons)
│   └── templates/default/           # Shared template for all lessons
│       ├── package.json             # kindscript + typescript deps
│       ├── tsconfig.json
│       └── kindscript/              # Local KindScript package
│           ├── package.json
│           └── dist/                # Compiled CLI (gitignored, built by sync script)
├── package.json                     # TutorialKit + Astro deps
├── astro.config.ts
└── tsconfig.json
```

## Adding a lesson

1. Create a numbered directory under the appropriate part (e.g. `1-first-check/4-new-lesson/`)
2. Add `content.md` with frontmatter (`type: lesson`, `title`, `focus`)
3. Add `_files/src/` with the starting code
4. Add `_solution/src/` with the solved code
5. Run `npm start` to verify
