# Directory Structure Migration - Removing Astro Confusion

## Problem

The `src/content/lessons/` directory structure was confusing because:
- `src/content/` is THE signature pattern for Astro Content Collections
- Seeing this directory made developers (and AI assistants) assume the project was using Astro
- The project is actually using **Next.js 15 + Nextra**, NOT Astro

## Solution

Moved all MDX lesson content to `public/lessons/` to:
1. ✅ Remove Astro confusion
2. ✅ Clarify that these are static assets (not compiled content collections)
3. ✅ Simplify the architecture

## Changes Made

### Before
```
src/content/lessons/*.mdx  → Source MDX files (Astro-like location)
public/content/lessons/    → Deployed MDX files (duplicated)
fetch('/content/lessons/') → Fetch URL
```

### After
```
public/lessons/*.mdx       → Single source of truth (static assets)
fetch('/lessons/')         → Fetch URL (cleaner)
```

## Files Modified

1. **`src/components/tutorial/LessonContent.tsx`**
   - Changed: `fetch('/content/lessons/${slug}.mdx')` → `fetch('/lessons/${slug}.mdx')`

2. **`scripts/migrate-lessons.mjs`**
   - Changed: Writes MDX to `public/lessons/` instead of `src/content/lessons/`
   - Comment updated to clarify these are static assets

3. **`LESSONS_GUIDE.md`**
   - Updated to document new structure
   - Now mentions both `.ts` and `.mdx` files

## Directories Removed

- ❌ `src/content/` (removed entirely - no longer needed)
- ❌ `public/content/` (consolidated into `public/lessons/`)

## Lesson Architecture (Final)

Each lesson consists of TWO files:

1. **TypeScript Definition** - `src/lib/lessons/X-Y-title.ts`
   - Metadata (slug, title, part info)
   - Code files (starting state)
   - Solution files

2. **MDX Content** - `public/lessons/X-Y-title.mdx`
   - Lesson instructions
   - Served as static asset
   - Fetched at runtime by React component

## Verification

```bash
# Check all MDX files are in public/lessons/
ls public/lessons/*.mdx

# Should show 16 lessons:
# 1-1-hello-kindscript.mdx through 6-1-full-design-system.mdx

# Verify old directories are gone
ls src/content         # Should error: No such file or directory
ls public/content      # Should error: No such file or directory

# Test the app
npm run dev
# Visit http://localhost:3000/tutorial
# Click any lesson - content should load correctly
```

## Migration Notes

If you have uncommitted changes to `src/content/lessons/*.mdx`:
1. They were already copied to `public/lessons/`
2. Edit them in `public/lessons/` from now on
3. The `src/content/` directory is deleted

## Future Migrations

When running `scripts/migrate-lessons.mjs`:
- It will now write MDX files directly to `public/lessons/`
- No intermediate `src/content/` step
- Single source of truth

---

**Date:** 2026-02-11
**Reason:** Remove Astro confusion, simplify architecture
**Status:** ✅ Complete
