# Playwright-Verify Quick Reference 🚀

## Usage

```bash
# Auto mode (recommended) - screenshots homepage only
/playwright-verify website local

# Full visual - screenshots all pages
/playwright-verify website local all

# Inventory mode - comprehensive audit (NEW!)
/playwright-verify website local inventory

# Fast mode - no screenshots
/playwright-verify website local off
```

## What Changed

| Feature | Before | After |
|---------|--------|-------|
| **CSS issues** | ❌ Missed | ✅ Caught |
| **Layout bugs** | ❌ Missed | ✅ Caught |
| **Visual defects** | ❌ Missed | ✅ Caught |
| **404 errors** | ✅ Caught | ✅ Caught |
| **Speed (auto)** | 2 min | 2.5 min |
| **Speed (all)** | 2 min | 4-5 min |

## When to Use Each Mode

### Auto (Default) ⚡
- First verification
- After CSS changes
- Balanced speed/thoroughness
- **Best for:** Most cases

### All 📸
- Production deploys
- Major redesigns
- "Something looks wrong"
- **Best for:** Comprehensive checks

### Inventory 📊 NEW!
- Quarterly audits
- Pre-redesign documentation
- Stakeholder reviews
- Finding improvements
- **Best for:** Complete site assessment
- **Time:** 30-90 min

### Off 🏃
- Quick re-checks
- CI/CD pipelines
- Functional-only changes
- **Best for:** Speed

## What It Catches Now

✅ Tailwind not loading
✅ Giant icons (500px+)
✅ Wrong themes
✅ Invisible text
✅ Cramped navigation
✅ Layout breaks
✅ Missing styles

## Inventory Mode Extras 📊

✅ Complete page inventory
✅ User flow mapping
✅ UX assessment
✅ Improvement suggestions
✅ Prioritized recommendations
✅ Living audit document

## Files Created

```
playwright-verification-checklist-[date].md
playwright-verification-issues-[date].md
playwright-screenshots-[date]/
  ├── homepage.png
  ├── docs.png
  └── ...
```

## Skill Location

```
~/.claude/skills/playwright-verify/skill.md
```

## Rollback

```bash
cp ~/.claude/skills/playwright-verify/skill.md.backup \
   ~/.claude/skills/playwright-verify/skill.md
```

---

**Updated:** 2026-02-12
**Version:** 2.0 with visual verification
