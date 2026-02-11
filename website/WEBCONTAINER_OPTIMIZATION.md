# WebContainer Loading Optimization

## The Problem

WebContainer boots and installs dependencies on **every page navigation**, showing a loading overlay each time. This takes 30-60 seconds and creates a poor user experience.

## Why This Happens

1. **WebContainer is a browser instance** - It runs Node.js in the browser tab
2. **Next.js page navigation** - Can trigger full remounts of React components
3. **Module-level state** - May not persist reliably across navigations in Next.js

## Current Status (Partially Fixed)

### ✅ What's Been Improved

1. **Singleton Pattern** (`src/lib/webcontainer/singleton.ts`)
   - Ensures only one WebContainer instance per browser tab
   - Prevents multiple concurrent boots

2. **Dependency Caching** (using sessionStorage)
   - Tracks if `npm install` has completed
   - Skips reinstall on subsequent lesson loads

3. **Improved Text Contrast** (`src/components/tutorial/LessonContent.tsx`)
   - Lesson text now uses dark colors (#334155, #0f172a)
   - Much more readable than previous light gray

### ⚠️ What Still Needs Work

The loading overlay still appears because:
- WebContainer instance may not persist across Next.js page navigations
- The boot sequence runs again even if WebContainer is cached

## Recommended Solutions

### Option 1: Client-Side Only Navigation (BEST)

Ensure all tutorial navigation uses Next.js `<Link>` components with client-side routing:

```tsx
// Good - keeps WebContainer in memory
<Link href="/tutorial/next-lesson">Next Lesson</Link>

// Bad - full page reload
<a href="/tutorial/next-lesson">Next Lesson</a>
```

**Benefits:**
- WebContainer instance preserved in memory
- No reload needed between lessons
- Instant navigation

### Option 2: Lazy Boot + Better UX

Don't boot WebContainer until user first clicks "Run Check":

```tsx
// Only boot when needed
const handleRunCheck = async () => {
  if (!webContainer) {
    await bootWebContainer();
  }
  await runCheck();
};
```

**Benefits:**
- Page loads instantly
- Only pays boot cost when actually using the feature
- Can explore lessons without waiting

### Option 3: Persistent Window-Level Singleton

Store WebContainer reference on `window` object:

```typescript
declare global {
  interface Window {
    __webcontainer?: WebContainer;
  }
}

export async function getWebContainer(): Promise<WebContainer> {
  if (typeof window !== 'undefined' && window.__webcontainer) {
    return window.__webcontainer;
  }

  const wc = await WebContainer.boot();
  if (typeof window !== 'undefined') {
    window.__webcontainer = wc;
  }
  return wc;
}
```

**Benefits:**
- Survives React component unmounts
- Works across page navigations
- Browser-level persistence

### Option 4: Skip Loading Overlay for Cached Instance

When reusing WebContainer, don't show the loading overlay:

```tsx
// In WebContainerProvider
if (isWebContainerBooted()) {
  // Don't call setState('booting') - skip directly to 'ready'
  setState('ready');
  // ... reuse instance
}
```

**Benefits:**
- No visual interruption for returning users
- Feels instant
- Less jarring UX

## Implementation Priority

**Phase 1 (Quick Wins):**
1. ✅ Add sessionStorage for dependency caching
2. ✅ Improve text contrast
3. ⚠️ Skip loading overlay for cached WebContainer (partially done)
4. 🔲 Store WebContainer on `window` object for persistence

**Phase 2 (Better UX):**
5. 🔲 Implement lazy boot (on-demand)
6. 🔲 Add subtle "Reconnecting..." indicator instead of full overlay
7. 🔲 Audit all tutorial navigation links (ensure client-side)

**Phase 3 (Advanced):**
8. 🔲 Cache compiled node_modules in IndexedDB
9. 🔲 Pre-warm WebContainer on tutorial home page
10. 🔲 Add service worker for offline support

## Testing

To verify improvements:

1. **First Load** - Should show loading overlay (expected)
2. **Navigate to different lesson** - Should be instant (no overlay)
3. **Refresh page** - May show overlay (browser resets memory)
4. **Use browser back/forward** - Should be instant

## Files Modified

- `website/src/lib/webcontainer/singleton.ts` - Added sessionStorage caching
- `website/src/components/tutorial/WebContainerProvider.tsx` - Skip npm install if cached
- `website/src/components/tutorial/LessonContent.tsx` - Improved text contrast
- `website/src/components/tutorial/BrowserCheck.tsx` - Added dev mode auto-reload

## Next Steps

The most impactful next step is **Option 3** (window-level singleton) combined with **Option 4** (skip overlay for cached). This will give instant navigation between lessons while maintaining WebContainer state.

---

**Last Updated:** 2026-02-11
**Status:** Partially implemented, needs window-level persistence
