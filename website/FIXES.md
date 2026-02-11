# Critical Tutorial Fixes - 2026-02-11

## Summary

Fixed two critical bugs that prevented the interactive tutorial from working correctly:

1. **Terminal Integration Bug** - Terminal reference wasn't being passed to WebContainerProvider
2. **WebContainer Singleton Bug** - Lesson navigation tried to boot multiple WebContainer instances

---

## Fix 1: Terminal Integration (Callback Pattern)

### Problem
The Terminal component was using `forwardRef` with dynamic imports, which caused the ref to not be properly initialized when WebContainerProvider tried to access it. This resulted in the terminal never loading.

### Solution
Changed Terminal from `forwardRef` to a callback pattern:

**Before:**
```tsx
export const Terminal = forwardRef<TerminalHandle>((_, ref) => {
  // ...
  useImperativeHandle(ref, () => ({
    terminal: xtermRef.current!,
    fitAddon: fitAddonRef.current!,
  }));
});
```

**After:**
```tsx
interface TerminalProps {
  onTerminalReady?: (terminal: XTerm) => void;
}

export function Terminal({ onTerminalReady }: TerminalProps) {
  useEffect(() => {
    // ... after terminal is created
    onTerminalReady?.(terminal);
  }, [onTerminalReady]);
}
```

**Files Changed:**
- `src/components/tutorial/Terminal.tsx` - Removed forwardRef, added callback
- `src/components/tutorial/TutorialLayout.tsx` - Added `handleTerminalReady` callback

---

## Fix 2: WebContainer Singleton Pattern

### Problem
When navigating between lessons (e.g., from 1-1 to 1-2), the WebContainerProvider component was unmounted and remounted. Each mount tried to call `WebContainer.boot()`, but WebContainer only allows **one instance per browser tab**, causing the error:

```
Error: Only a single WebContainer instance can be booted
```

### Solution
Created a singleton manager for WebContainer that persists across React component mounts/unmounts:

**New File:** `src/lib/webcontainer/singleton.ts`
```typescript
let instance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

export async function getWebContainer(): Promise<WebContainer> {
  if (instance) return instance;
  if (bootPromise) return bootPromise;

  bootPromise = WebContainer.boot();
  instance = await bootPromise;
  bootPromise = null;

  return instance;
}

export function isWebContainerBooted(): boolean {
  return instance !== null;
}
```

**Updated:** `src/components/tutorial/WebContainerProvider.tsx`
- Added logic to check if WebContainer is already booted
- Reuses existing instance instead of calling `.boot()` again
- Only boots on first lesson, reuses for all subsequent lessons
- Terminal shows: "✓ WebContainer ready (reused from previous lesson)"

**Files Changed:**
- `src/lib/webcontainer/singleton.ts` - **NEW** - Singleton manager
- `src/components/tutorial/WebContainerProvider.tsx` - Use singleton instead of direct boot

---

## Verification

All critical test scenarios now pass:

### ✅ Part 1: Initial Load (Lesson 1-1)
- WebContainer boots successfully (~30-60s first time)
- Terminal shows boot progress
- Dependencies install (npm install)
- Status shows "✓ Ready"
- Editor loads with syntax highlighting
- Files display in tree

### ✅ Part 2: Run Check Button
- Executes `npm run check` command
- Shows output in terminal
- Detects 0 violations in clean lesson (1-1)
- Detects 1 violation in violating lesson (1-2)

### ✅ Part 3: File Switching
- Click different files in tree
- Editor content updates
- Syntax highlighting preserved

### ✅ Part 4: Solution Toggle
- "Show Solution" loads solution files
- Button changes to "Reset"
- "✓ Solution" indicator appears
- "Reset" restores original files

### ✅ Part 5: Lesson Navigation (Critical!)
- Navigate from 1-1 to 1-2
- Terminal shows: **"✓ WebContainer ready (reused from previous lesson)"**
- No error about duplicate instances
- Files update successfully
- "📝 Lesson files updated" appears
- Run Check works in new lesson

---

## Console Log Evidence

**Lesson 1 (First Boot):**
```
Terminal mounted, calling onTerminalReady
Terminal ready callback received
Terminal ready, starting WebContainer boot...
Browser support confirmed, calling WebContainer.boot()...
WebContainer booted successfully
✓ Dependencies installed
=== Ready! ===
Shell started
```

**Lesson 2 (Reuse):**
```
Terminal mounted, calling onTerminalReady
Terminal ready callback received
Terminal ready, starting WebContainer boot...
WebContainer already booted, reusing instance...
Shell started for new lesson
📝 Lesson files updated
```

---

## Impact

**Before fixes:**
- Terminal never loaded
- Lesson navigation failed with error
- Tutorial completely non-functional

**After fixes:**
- Terminal loads immediately after WebContainer boots
- Lesson navigation seamless (instant file switch)
- Full tutorial workflow works end-to-end
- No errors in console

---

## Technical Details

### Why Callback > forwardRef for Terminal

Dynamic imports + forwardRef don't play well in Next.js:
- Ref initialization timing is unpredictable
- Parent component polls for ref availability
- Race conditions between mount and ref assignment

Callback pattern is more reliable:
- Terminal calls callback immediately after mount
- Parent receives terminal reference synchronously
- No polling or race conditions

### Why Singleton > Component State for WebContainer

WebContainer is a browser-level resource:
- Only one instance allowed per tab
- Lives beyond React component lifecycle
- Should persist across route changes

Storing in component state causes:
- Re-initialization on unmount/remount
- Duplicate boot attempts
- Lost state between lessons

Singleton pattern ensures:
- Single instance across entire session
- Survives component unmount/remount
- Instant "reuse" on subsequent lessons

---

## Files Modified

1. `src/components/tutorial/Terminal.tsx` - Callback pattern
2. `src/components/tutorial/TutorialLayout.tsx` - Handle terminal callback
3. `src/lib/webcontainer/singleton.ts` - **NEW** - WebContainer singleton
4. `src/components/tutorial/WebContainerProvider.tsx` - Use singleton

---

## Next Steps

- [x] Test all 15 lessons for navigation
- [ ] Run full test plan (TEST_PLAN.md)
- [ ] Production build test
- [ ] Deploy to Vercel

---

**Status:** ✅ **FIXED - Tutorial Fully Functional**

**Date:** 2026-02-11
**Tested:** Chrome 120+, Firefox 95+
**Result:** All critical paths working
