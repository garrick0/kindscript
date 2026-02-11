# Website Test Plan

## Critical Path: Tutorial WebContainer Test

This is the most important test - the interactive tutorial must work end-to-end.

### Setup
1. Start production build locally:
   ```bash
   npm run build
   npm start
   ```
2. Open http://localhost:3000

### Test Steps

#### Part 1: Navigate to Tutorial
- [ ] Visit http://localhost:3000
- [ ] Click "🚀 Start Interactive Tutorial" button
- [ ] Verify tutorial index loads showing 5 parts
- [ ] Click on "1.1 Hello KindScript"

#### Part 2: WebContainer Boot Sequence
- [ ] **Loading overlay appears** with "⚡ Booting WebContainer"
- [ ] **Overlay changes** to "📦 Installing Dependencies"
- [ ] **Terminal shows progress**:
  ```
  Booting WebContainer...
  Mounting files...
  Installing dependencies...
  This may take 30-60 seconds on first load...
  [npm install output...]
  ✓ Dependencies installed
  === Ready! ===
  ```
- [ ] **Overlay disappears** when ready
- [ ] **Top nav shows** "✓ Ready" in green

**⏱️ Expected time:** 30-60 seconds on first run, 5-10s on subsequent lessons

#### Part 3: UI Verification
- [ ] **Left panel** shows lesson content with proper formatting (not raw markdown)
- [ ] **File tree** (middle-left) shows 4 files:
  - `src/context.ts`
  - `src/application/register-user.ts`
  - `src/domain/user.ts`
  - `src/infrastructure/user-repo.ts`
- [ ] **Editor** (top-right) shows `src/context.ts` with TypeScript syntax highlighting
- [ ] **Terminal** (bottom-right) shows boot messages and shell prompt
- [ ] **Top nav** shows:
  - "← Lessons" link
  - Part title "noDependency — Forbidden Imports"
  - "▶ Run Check" button (green, enabled)
  - "Show Solution" button

#### Part 4: Editor Functionality
- [ ] Click different files in file tree
- [ ] Verify active file switches in editor
- [ ] Edit a file (add a comment: `// test`)
- [ ] Verify editor accepts input
- [ ] **File should persist** (debounced write to WebContainer)

#### Part 5: Run Check Button
- [ ] Click "▶ Run Check" button
- [ ] Terminal should show:
  ```
  $ npm run check
  [KindScript output...]
  ✓ Command completed successfully
  ```
- [ ] For lesson 1.1, should show "0 violations"

#### Part 6: Solution Toggle
- [ ] Click "Show Solution" button
- [ ] Button changes to "Reset"
- [ ] Editor shows "✓ Solution" indicator
- [ ] Verify solution file loads
- [ ] Click "Reset"
- [ ] Verify original files restore

#### Part 7: Lesson Navigation
- [ ] Click "Next" button at bottom
- [ ] Should navigate to "1.2 Catching Violations"
- [ ] **Important:** Verify terminal shows "📝 Lesson files updated"
- [ ] Verify file tree shows new files
- [ ] Verify editor switches to new lesson's focus file
- [ ] Click "Previous" to go back
- [ ] Verify files switch back

## Secondary Tests

### Mobile/Browser Compatibility
- [ ] Open tutorial on mobile device OR
- [ ] Open in Safari private browsing (may not support WebContainer)
- [ ] Should show "Desktop Browser Required" fallback page
- [ ] Verify fallback has:
  - Clear explanation
  - Supported browser list
  - "Read Static Tutorial" link
  - "Back to Lessons" link

### Error Boundary
- [ ] Force an error by opening DevTools during boot
- [ ] Pause JavaScript execution
- [ ] Should show error boundary with:
  - "⚠️ Something went wrong" message
  - Error details
  - "Reload Page" button
  - "Back to Lessons" link

### Docs Site
- [ ] Visit http://localhost:3000/docs
- [ ] Navigate through chapters
- [ ] Verify sidebar works
- [ ] Click an ADR link
- [ ] Search (if Pagefind built)

### Landing Page
- [ ] Visit http://localhost:3000
- [ ] Verify hero section loads
- [ ] Verify feature cards show
- [ ] Verify code example has syntax highlighting
- [ ] Click "Read the Docs" - should go to /docs
- [ ] Click "Start Interactive Tutorial" - should go to /tutorial

## Performance Benchmarks

### Expected Load Times
- Landing page: < 2 seconds
- Docs page: < 2 seconds
- Tutorial index: < 2 seconds
- **WebContainer boot (first time): 30-60 seconds**
- **WebContainer boot (cached): 5-10 seconds**
- Lesson switch: < 1 second

### Bundle Sizes
- Shared JS: ~103 kB
- Lesson page: ~100 kB
- Total First Load: ~210 kB

## Browser Compatibility Matrix

| Browser | Version | WebContainer Support | Expected Result |
|---------|---------|---------------------|-----------------|
| Chrome | 92+ | ✅ Yes | Full tutorial works |
| Firefox | 95+ | ✅ Yes | Full tutorial works |
| Safari | 15.2+ | ✅ Yes | Full tutorial works |
| Mobile Chrome | Any | ❌ Maybe | Fallback page OR works |
| Mobile Safari | Any | ❌ No | Fallback page |
| Edge | 92+ | ✅ Yes | Full tutorial works |

## Common Issues & Solutions

### WebContainer doesn't boot
**Symptoms:** Loading overlay stuck on "Booting..."

**Check:**
1. Browser console for errors
2. Network tab - verify CORS headers present
3. Try Chrome/Firefox (known to work)

**Solution:** Use supported browser, check CORS headers

### npm install takes forever
**Symptoms:** Stuck on "Installing Dependencies..." for > 2 minutes

**Possible causes:**
1. Slow network
2. npm registry issues
3. KindScript package not found

**Solution:** Wait longer, check npm registry has kindscript@1.0.0

### Editor changes don't affect check output
**Symptoms:** Edit file, run check, changes not reflected

**Check:**
1. Wait 300ms after edit (debounce)
2. Look for "📝 Lesson files updated" in terminal

**Solution:** Debounce is working, may need to wait

### Terminal not responding
**Symptoms:** Can't type in terminal

**Possible causes:**
1. Shell process not started
2. WebContainer not ready

**Solution:** Wait for "Ready" status, reload page

## Success Criteria

✅ **Must have all of these:**
- Landing page loads
- Docs navigation works
- Tutorial loads without errors
- WebContainer boots successfully
- npm install completes
- Editor shows files with syntax highlighting
- Run Check button executes command
- Terminal shows output
- File switching works
- Solution toggle works
- Lesson navigation works
- Mobile fallback shows on unsupported browsers

## Test Report Template

After testing, fill this out:

```
Date: ___________
Tester: ___________
Browser: ___________
OS: ___________

✅/❌ Landing page loads
✅/❌ Docs navigation works
✅/❌ Tutorial index loads
✅/❌ WebContainer boots (time: ____ seconds)
✅/❌ npm install completes (time: ____ seconds)
✅/❌ Editor works
✅/❌ Run Check works
✅/❌ Solution toggle works
✅/❌ Lesson navigation works
✅/❌ Mobile fallback works

Issues found:
1. ___________
2. ___________

Overall: PASS / FAIL
```

---

**Ready to test!** 🧪

Run the Critical Path test first. If that passes, the site is ready to deploy.
