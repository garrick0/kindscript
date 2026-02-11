# Lessons Auto-Discovery Guide

## How It Works

The tutorial lessons are now **auto-discovered** at build time. You no longer need to manually register lessons in `index.ts`.

## Lesson Architecture

Lessons consist of two files:
- **`src/lib/lessons/X-Y-title.ts`** - Lesson metadata, code files, and solution
- **`public/lessons/X-Y-title.mdx`** - Lesson instructions (fetched at runtime)

## Adding a New Lesson

### 1. Create the lesson file

Create a new file matching the pattern: `src/lib/lessons/X-Y-title.ts`

- `X` = Part number (1-6)
- `Y` = Lesson number within that part (1, 2, 3, etc.)
- `title` = URL-friendly slug

Example: `6-1-full-design-system.ts`

### 2. Define the lesson metadata

**File:** `src/lib/lessons/6-1-full-design-system.ts`

```typescript
import { Lesson } from './types';

export const lesson: Lesson = {
  slug: "6-1-full-design-system",
  title: "Building a Full Design System",
  partTitle: "Advanced Patterns",
  partNumber: 6,
  lessonNumber: 1,
  focus: "src/context.ts",
  files: [
    {
      path: "src/context.ts",
      contents: "// Starting code...\n"
    },
    {
      path: "src/index.ts",
      contents: "// More starting code...\n"
    }
  ],
  solution: [
    {
      path: "src/context.ts",
      contents: "// Solution code...\n"
    },
    {
      path: "src/index.ts",
      contents: "// Solution code...\n"
    }
  ]
};
```

### 3. Create the lesson content

**File:** `public/lessons/6-1-full-design-system.mdx`

```markdown
# Building a Full Design System

Learn how to model a complete design system with atoms, molecules, and organisms...

## Step 1: Install KindScript

Run the following command...
```

### 4. That's it!

The lesson will automatically appear when you run:
- `npm run dev` (dev server)
- `npm run build` (production build)
- `npm run generate:lessons` (manual generation)

## How Auto-Discovery Works

1. **Script**: `scripts/generate-lessons.mjs` scans `src/lib/lessons/` for files matching `X-Y-*.ts`
2. **Generates**: Auto-generates `src/lib/lessons/index.ts` with all imports and exports
3. **Runs**: Automatically runs before `dev` and `build` commands
4. **Groups**: Lessons are grouped into parts by `partNumber` and `partTitle`

## File Naming Convention

✅ **Valid**:
- `1-1-hello-kindscript.ts`
- `2-3-advanced-topic.ts`
- `6-1-full-design-system.ts`

❌ **Invalid** (will be ignored):
- `index.ts` (special file)
- `types.ts` (special file)
- `template.ts` (special file)
- `my-lesson.ts` (missing X-Y prefix)
- `01-01-lesson.ts` (zero-padded numbers)

## Parts Are Auto-Generated

Parts (lesson groups) are automatically created based on `partNumber` and `partTitle` in each lesson:

```typescript
// Lessons with partNumber: 6 and partTitle: "Advanced Patterns"
// will be grouped together automatically
```

If you have 3 lessons with `partNumber: 6`, they'll all be grouped under Part 6.

## Manual Generation

If you want to regenerate without starting dev server:

```bash
npm run generate:lessons
```

## Troubleshooting

### Lesson not appearing?

1. Check filename matches pattern: `X-Y-title.ts`
2. Run `npm run generate:lessons` manually
3. Check console output for errors
4. Verify lesson exports `export const lesson: Lesson = { ... }`

### TypeScript errors?

```bash
npm run generate:lessons
npx tsc --noEmit
```

### Want to see what was generated?

Look at `src/lib/lessons/index.ts` (it has a warning header: "Auto-generated - do not edit")

## Migration Notes

**Before**: Had to manually add imports and array entries in `index.ts`
**After**: Just create a `X-Y-name.ts` file and it's auto-discovered

The old manual `index.ts` has been replaced with an auto-generated version. Do not edit it manually - your changes will be overwritten on next build.
