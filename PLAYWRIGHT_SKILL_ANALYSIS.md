# Playwright-Verify Skill Analysis & Recommendations

**Date:** 2026-02-12
**Issue:** Skill failed to detect CSS/visual rendering problems on website

---

## Root Cause Analysis

### The Skill Uses `browser_snapshot` Only

**Location:** `~/.claude/skills/playwright-verify/skill.md` line 201

```typescript
// Current approach (existing)
mcp__playwright__browser_snapshot({})
```

### What browser_snapshot Returns

A **text-based accessibility tree**:
```
navigation [ref_1]
  link "Docs" [ref_2]
  link "Tutorial" [ref_3]
  link "Agent" [ref_4]
  link "About" [ref_5]
  button "Get Early Access" [ref_6]
```

### What It Cannot See

- ❌ CSS loaded or not
- ❌ Element sizes (24px vs 500px)
- ❌ Colors (white vs black background)
- ❌ Spacing (cramped vs proper)
- ❌ Layout (overlapping vs separated)
- ❌ Visual rendering at all

### Why This Design Choice?

The tool documentation says:
> "browser_snapshot is **better than screenshot**"

This is true **for functional testing** (finding clickable elements), but misleading **for visual verification**.

---

## What the Skill Missed

In our case, the skill reported:
- ✅ Navigation exists
- ✅ Links are present
- ✅ Buttons are clickable
- ✅ Page structure correct

But it didn't detect:
- ❌ Tailwind CSS v4/v3 compatibility issue
- ❌ PostCSS config missing
- ❌ No CSS loading at all
- ❌ Icons 500px instead of 24px
- ❌ Navigation links cramped together
- ❌ White background instead of dark theme

---

## The Tool HAS Screenshot Capability!

**Available tool:** `mcp__playwright__browser_take_screenshot`

```typescript
mcp__playwright__browser_take_screenshot({
  fullPage: true,
  filename: "homepage.png",
  type: "png"
})
```

**The skill just doesn't use it.**

---

## Recommendations

### Option 1: Quick Fix (5 minutes)
**Update skill line 201** to add screenshot after snapshot:

```typescript
// Structural check (fast)
mcp__playwright__browser_snapshot({})

// Visual check (for homepage/critical pages)
if (isHomepage || isCriticalPage) {
  mcp__playwright__browser_take_screenshot({
    fullPage: true,
    filename: `${pageName}-visual-check.png`
  })
  // Inspect screenshot for CSS/layout issues
}
```

**Impact:**
- ✅ Catches visual issues on critical pages
- ✅ Minimal performance hit (only screenshots 1-2 pages)
- ✅ Easy to implement

### Option 2: Add Visual Mode (15 minutes)
**Add new argument** to skill frontmatter:

```yaml
arguments:
  - name: visual
    description: "Enable visual verification (default: auto)"
    default: auto
```

**Modes:**
- `auto` - Screenshot homepage only (smart default)
- `enabled` - Screenshot all pages (thorough)
- `disabled` - Skip screenshots (fast)

**Usage:**
```bash
/playwright-verify website local           # auto (screenshots homepage)
/playwright-verify website local --visual  # all pages
```

### Option 3: Comprehensive Overhaul (1-2 hours)
**New skill section:** "Step 3.5: Visual Verification"

**Includes:**
- Screenshot checklist
- Visual issue detection patterns
- Before/after comparison workflow
- Screenshot storage organization
- Performance optimization (parallel captures)

**See:** `visual-verification-enhancement.md` for full spec

---

## Recommended Approach

### Phase 1: Immediate (Do Now)
1. **Add homepage screenshot** to existing workflow
2. **Add visual checklist items** to templates
3. **Document CSS/styling issues** in common issues list

### Phase 2: Near-term (Next Week)
1. **Add `--visual` flag** for opt-in comprehensive screenshots
2. **Create screenshot comparison** workflow for regressions
3. **Update skill documentation** with visual verification examples

### Phase 3: Future (Nice to Have)
1. **Visual regression testing** with baseline comparisons
2. **Responsive design checks** (multiple viewport sizes)
3. **Accessibility contrast checks** from screenshots
4. **AI-powered visual diff** detection

---

## Files Created

1. **`visual-verification-enhancement.md`**
   Comprehensive specification for adding visual verification to the skill

2. **`skill-with-visual.md`**
   Stub for updated skill with visual verification integrated

3. **This document**
   Summary and recommendations

---

## Impact Analysis

### Without Visual Verification (Current)
- ✅ Fast execution (~2 min for 15 pages)
- ✅ Catches functional bugs
- ✅ Validates structure/accessibility
- ❌ Misses CSS issues (like our Tailwind problem)
- ❌ Misses layout breaks
- ❌ Misses theme problems

### With Visual Verification (Proposed)
- ✅ Catches CSS issues
- ✅ Catches layout breaks
- ✅ Catches theme problems
- ✅ Catches icon sizing issues
- ⚠️  Slower (~3-5 min for 15 pages with screenshots)
- ⚠️  Requires manual inspection of screenshots

### With Smart Visual Verification (Recommended)
- ✅ All benefits of visual verification
- ✅ Fast for non-critical pages (no screenshots)
- ✅ Thorough for critical pages (screenshots)
- ✅ Configurable (opt-in for more screenshots)
- ✅ Best of both worlds

---

## Next Steps

1. **Review the enhancement spec** - `visual-verification-enhancement.md`

2. **Choose an option:**
   - Quick fix (5 min) - Add homepage screenshot
   - Visual mode (15 min) - Add `--visual` flag
   - Comprehensive (1-2 hrs) - Full integration

3. **Test on this project:**
   ```bash
   /playwright-verify website local --visual
   ```

4. **Verify it catches the CSS issue** we just fixed:
   - Revert the Tailwind fix
   - Run skill
   - Confirm it detects broken CSS
   - Re-apply fix

5. **Update skill documentation** with visual verification guide

---

## Key Insight

**The skill isn't bad** - it's optimized for functional testing.

**The tool misleads** - saying snapshot is "better" without context.

**The solution is simple** - use screenshots **in addition to** snapshots, not instead of.

**For this project specifically:** Homepage and `/agent` page should always get visual verification since they're public-facing marketing pages.

---

## Questions?

- Where are skills stored? `~/.claude/skills/`
- Can I edit the skill? Yes! It's just a markdown file
- Will my changes persist? Yes, they're local to your machine
- Can I create custom skills? Yes, copy the template

**To implement:** Edit `~/.claude/skills/playwright-verify/skill.md` directly or create a new skill variant.
