# Nextra Theme CSS Fix

**Date:** 2026-02-12
**Issue:** Nextra theme pages showing `@layer base` directive error
**Status:** ✅ Fixed

## Problem

All pages using Nextra theme (/docs, /tutorial, /agent, /about) were completely broken with this error:

```
Syntax error: /Users/samuelgleeson/dev/kindscript/website/node_modules/nextra-theme-docs/dist/style.css
`@layer base` is used but no matching `@tailwind base` directive is present.
```

## Root Cause

1. Nextra v4.6 pre-built CSS contains `@layer` directives
2. These directives require Tailwind's layer system to be available during CSS processing
3. When importing pre-built Nextra CSS, the `@layer` directives can't be resolved

## Solution

**Do NOT manually import Nextra theme CSS.** Let Nextra handle its own styling internally.

### Files Modified

1. **`website/tailwind.config.js`**
   - Added Nextra paths to content array:
   ```js
   content: [
     './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
     './src/components/**/*.{js,ts,jsx,tsx,mdx}',
     './src/app/**/*.{js,ts,jsx,tsx,mdx}',
     './node_modules/nextra/dist/**/*.js',           // ADDED
     './node_modules/nextra-theme-docs/dist/**/*.js', // ADDED
   ]
   ```

2. **`website/src/app/docs/layout.tsx`**
   - Removed: `import 'nextra-theme-docs/style.css';`

3. **`website/src/app/globals.css`**
   - Kept only Tailwind directives (no Nextra import):
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

### Restart Required

Clean build and restart dev server:
```bash
rm -rf .next
npm run dev
```

## Result

✅ All pages now load correctly
✅ Nextra theme styling works
✅ No more `@layer` directive errors

## Lessons Learned

- Nextra v4+ manages its own CSS internally
- Do not manually import `nextra-theme-docs/style.css`
- Only include Nextra paths in Tailwind config for proper class scanning
- Always clean `.next` directory after CSS configuration changes
