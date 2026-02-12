# WebContainer Cross-Origin Isolation Fix

## Problem

WebContainer failed to start with error: "WebContainer failed to start. Check the terminal for details."

**Root Cause:** WebContainer requires cross-origin isolation headers (`COOP` + `COEP`) to enable SharedArrayBuffer. While headers were configured in `next.config.mjs`, Next.js dev server doesn't always apply async `headers()` reliably due to HMR/Fast Refresh interactions.

---

## Solution: Next.js Middleware (Implemented)

Created `website/src/middleware.ts` to set headers on every request.

### Why Middleware?

1. **Runs on every request** - Not cached by HMR/Fast Refresh
2. **Works in dev and prod** - No environment-specific hacks
3. **More reliable than config** - Middleware has precedence over async headers()
4. **Next.js best practice** - Recommended approach for dynamic headers

### Files Changed

- ✅ **Created:** `website/src/middleware.ts` - Sets COOP/COEP headers for `/tutorial/*`
- ✅ **Updated:** `website/src/components/tutorial/WebContainerProvider.tsx` - Added better error messaging
- ✅ **Updated:** `website/src/components/tutorial/BrowserCheck.tsx` - Removed development mode bypass logic

### What Was Removed

- ❌ Development mode bypass in `WebContainerProvider`
- ❌ Development mode bypass in `BrowserCheck`
- ❌ Auto-bypass timer after 2 seconds
- ❌ Development-specific UI/messaging

---

## Alternative Approaches Considered

### Option 1: Custom Dev Server
**What:** Wrap Next.js in custom server that sets headers
**Pros:** Full control, matches production
**Cons:** Breaks Fast Refresh, slower dev experience
**Verdict:** ❌ Too complex, poor DX

### Option 2: Development Mode Bypass
**What:** Allow WebContainer to boot without cross-origin isolation in dev
**Pros:** Simple, minimal changes
**Cons:** Dev ≠ prod, might hide bugs, WebContainer might behave differently
**Verdict:** ❌ Unreliable, bad practice

### Option 3: Require Production Builds
**What:** Document that devs must run `npm run build && npm start` to test
**Pros:** Guarantees production parity
**Cons:** Terrible DX, slow iteration
**Verdict:** ❌ No one will do this

### Option 4: Separate Tutorial App
**What:** Build tutorial as standalone app (Vite, etc.)
**Pros:** Complete isolation, better dev server support
**Cons:** Maintain two apps, duplicate deps
**Verdict:** ❌ Over-engineered

---

## Testing

```bash
cd website
npm run dev
```

Visit `http://localhost:3000/tutorial` and verify:
1. No error overlay
2. WebContainer boots successfully
3. Terminal shows "=== Ready! ==="
4. Can edit files in Monaco editor
5. Can run commands in terminal

---

## Production Deployment

- Headers are also configured in `vercel.json` (redundant but safe)
- Vercel automatically applies middleware headers
- No additional configuration needed

---

## Troubleshooting

If WebContainer still fails to start:

1. **Hard refresh:** Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)
2. **Clear cache:** Open DevTools → Application → Clear storage
3. **Restart dev server:** Ctrl+C then `npm run dev`
4. **Check headers:** Open DevTools → Network → Select tutorial page → Headers tab
   - Should see `Cross-Origin-Embedder-Policy: require-corp`
   - Should see `Cross-Origin-Opener-Policy: same-origin`
5. **Check console:** Look for specific error messages about SharedArrayBuffer

---

## Summary

✅ **Implemented:** Next.js middleware for reliable header delivery
✅ **Removed:** Development mode bypasses and hacks
✅ **Result:** Dev environment matches production, WebContainer works reliably

**No environment-specific code, no bypasses, just proper headers.**
