# Website Consolidation Plan

**Date:** 2026-02-12
**Goal:** Consolidate `kindscript-website` repo into `kindscript/website` and remove the separate repo

---

## Executive Summary

**Good News:** The two websites are nearly identical in functionality. The `kindscript-website` repo was essentially a COPY of `kindscript/website` with a few modifications:
- Added `fetch-docs.sh` to pull docs from separate repos
- Accidentally removed 7 newer lessons (6-8)
- Removed tests
- Possibly broke Tailwind CSS configuration

**Recommendation:** Keep `~/dev/kindscript/website/` as the canonical source. It has:
- ✅ All 18 lessons (newer content)
- ✅ Test suite (Vitest + Playwright)
- ✅ Working Tailwind CSS
- ✅ No need for fetch-docs.sh (docs in same repo)

---

## Gap Analysis: What kindscript-website Has That kindscript/website Needs

### ✅ IDENTICAL Features (No Migration Needed)

Both websites have:
- Interactive tutorial with WebContainer + Monaco editor
- Docs powered by Nextra
- Agent, About, Privacy pages
- Waitlist form component
- Homepage with hero section
- Tutorial layout and components
- Lesson navigation
- Terminal component
- File tree component
- Error boundaries
- Loading overlays
- Browser compatibility check

### ❌ DIFFERENCES (Require Action)

| Feature | kindscript/website | kindscript-website | Action Required |
|---------|-------------------|-------------------|----------------|
| **Lessons** | 18 lessons (complete 1-8) | 16 lessons (only 1-5) | ✅ Keep old (has newer content) |
| **fetch-docs.sh** | Not needed | Has it | ❌ Remove (docs in same repo) |
| **Tests** | ✅ Full suite | ❌ No tests | ✅ Keep old (has tests) |
| **Tailwind CSS** | ✅ Configured | ❌ Missing config | ✅ Keep old (working CSS) |
| **Scripts** | `generate-lessons.mjs` | `fetch-docs.sh` | ✅ Keep old scripts |
| **Dependencies** | @formspree/react listed | @formspree/react NOT listed | ⚠️ Check if missing |

### 🔍 MISSING in kindscript-website (Lost Features)

**1. Lessons 6-8 (7 files)**
```
6-1-full-design-system.mdx
6-1-wrapped-kinds.mdx
6-2-tagged-purity.mdx
6-3-tagged-boundaries.mdx
7-1-bounded-contexts.mdx
7-2-exhaustive-enforcement.mdx
8-1-full-stack-architecture.mdx
```

**2. Test Suite**
```
tests/
├── snapshots/           # Snapshot tests
│   └── __snapshots__/
└── unit/               # Unit tests
```

**3. Tailwind Configuration**
```
tailwind.config.js      # Tailwind CSS setup
```

**4. Migration Scripts**
```
scripts/migrate-lessons.mjs   # Lesson migration utility
```

---

## Migration Plan: Zero Migration Needed!

### Phase 1: Clean Up kindscript/website (Keep It)

**Status:** The old website (`~/dev/kindscript/website/`) is ALREADY BETTER than the new one.

**Actions:**
1. ✅ **No lesson migration needed** - Old website has all 18 lessons
2. ✅ **No test migration needed** - Old website has full test suite
3. ✅ **No Tailwind migration needed** - Old website has working CSS
4. ❌ **Remove fetch-docs.sh logic** - Not needed (docs in same repo)
5. ✅ **Keep generate-lessons.mjs** - Still needed for lesson index

### Phase 2: Update Documentation References

**Update these files to point to kindscript.ai deployment:**

```
~/dev/kindscript/
├── README.md                    # Update website URL references
├── CLAUDE.md                    # Update website deployment info
└── .github/workflows/
    └── deploy-website.yml       # Already deploys kindscript/website
```

### Phase 3: Reconfigure Vercel Deployment

**Current State:**
- `deploy-website.yml` deploys `~/dev/kindscript/website/` ✅ (correct)
- Old URL: https://website-five-theta-38.vercel.app

**New State:**
- Point Vercel project to kindscript.ai domain
- Update Vercel environment variables
- Test deployment

**Vercel Configuration:**
```json
// website/vercel.json (already exists and is correct)
{
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/tutorial/:path*",
      "headers": [
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        },
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        }
      ]
    }
  ]
}
```

### Phase 4: Remove kindscript-website Repo

**After verification:**
1. ✅ Verify kindscript.ai is live and serving from `kindscript/website/`
2. ✅ Verify all 18 lessons are accessible
3. ✅ Verify interactive tutorial works (WebContainer)
4. ✅ Verify docs are loading correctly
5. ❌ Archive `kindscript-website` repo on GitHub
6. ❌ Remove `~/dev/kindscript-website/` local directory

---

## Required Changes to kindscript/website

### 1. Update package.json Scripts

**Current:**
```json
{
  "scripts": {
    "generate:lessons": "node scripts/generate-lessons.mjs",
    "dev": "npm run generate:lessons && next dev",
    "build": "npm run generate:lessons && next build"
  }
}
```

**No changes needed!** ✅ Scripts are already correct.

### 2. Verify Dependencies

**Check if @formspree/react is installed:**
```bash
cd ~/dev/kindscript/website
grep "@formspree/react" package.json
```

**If missing, add it:**
```json
{
  "dependencies": {
    "@formspree/react": "^2.5.1"
  }
}
```

### 3. Update GitHub Workflows

**File:** `.github/workflows/deploy-website.yml`

**Current state:** ✅ Already deploys from `website/` directory

**Potential update needed:**
- Update Vercel project ID to point to kindscript.ai
- Ensure environment variables are set correctly

### 4. Update CLAUDE.md

**Remove references to:**
- `~/dev/kindscript-website` repo
- `fetch-docs.sh` script (not needed)
- Cross-repo documentation triggers

**Add clarification:**
- Website lives in `~/dev/kindscript/website/`
- Docs are in `~/dev/kindscript/docs/` (same repo)
- Single source of truth

---

## Verification Checklist

### Pre-Removal Checklist

Before removing `~/dev/kindscript-website/`:

- [ ] All 18 lessons exist in `~/dev/kindscript/website/src/lib/lessons/`
- [ ] Tests pass: `cd website && npm test`
- [ ] Build succeeds: `cd website && npm run build`
- [ ] Dev server works: `cd website && npm run dev`
- [ ] Lessons generate correctly: `npm run generate:lessons`
- [ ] Interactive tutorial loads (check WebContainer)
- [ ] Monaco editor works
- [ ] Terminal works
- [ ] Docs render correctly (Nextra)
- [ ] Agent page loads
- [ ] About page loads
- [ ] Privacy page loads
- [ ] Tailwind CSS styles apply correctly

### Post-Deployment Checklist

After deploying to kindscript.ai:

- [ ] Homepage loads: https://kindscript.ai
- [ ] Docs load: https://kindscript.ai/docs
- [ ] Tutorial loads: https://kindscript.ai/tutorial
- [ ] All 18 lessons accessible: https://kindscript.ai/tutorial/1-1-hello-kindscript
- [ ] Agent page loads: https://kindscript.ai/agent
- [ ] About page loads: https://kindscript.ai/about
- [ ] Privacy page loads: https://kindscript.ai/privacy
- [ ] WebContainer starts successfully
- [ ] Monaco editor syntax highlighting works
- [ ] Terminal accepts commands
- [ ] CORS headers present (check DevTools)

---

## Risk Assessment

### 🟢 Low Risk

- **No code migration needed** - Old website is already complete
- **No new features to add** - Everything already exists
- **Tests already exist** - Can verify before deploying
- **Same Next.js version** - Both use Next.js 15
- **Same dependencies** - Package files are nearly identical

### 🟡 Medium Risk

- **Vercel reconfiguration** - Need to update project settings
- **Environment variables** - May need to be reconfigured
- **Domain pointing** - Need to ensure kindscript.ai points correctly

### 🔴 High Risk (None!)

No high-risk items identified.

---

## Timeline Estimate

### Phase 1: Verification (30 minutes)
- Verify all 18 lessons exist
- Run tests
- Build and run locally
- Check all features work

### Phase 2: Deploy to Vercel (30 minutes)
- Update Vercel project configuration
- Deploy from `website/` directory
- Verify deployment URL

### Phase 3: Update Domain (15 minutes)
- Point kindscript.ai to new deployment
- Test production URL
- Verify CORS headers

### Phase 4: Clean Up (15 minutes)
- Update documentation
- Archive kindscript-website repo
- Remove local directory

**Total Time:** ~90 minutes

---

## Post-Consolidation Benefits

1. ✅ **Single source of truth** - All code in one repo
2. ✅ **Atomic commits** - Tutorial + docs + code in one PR
3. ✅ **Simpler workflow** - No cross-repo triggers needed
4. ✅ **Fewer repos to manage** - One less repo to maintain
5. ✅ **No fetch-docs.sh** - Docs already in same repo
6. ✅ **Full test coverage** - Tests stay with the code
7. ✅ **Working Tailwind** - CSS configuration preserved

---

## Conclusion

**The consolidation is trivial because the old website is already superior:**
- ✅ Has all 18 lessons (newer content)
- ✅ Has full test suite
- ✅ Has working Tailwind CSS
- ✅ Has all the same features as kindscript-website
- ✅ Already has working deployment workflow

**All we need to do:**
1. Verify `~/dev/kindscript/website/` works correctly
2. Deploy it to kindscript.ai via Vercel
3. Delete `~/dev/kindscript-website/`

**No migration, no gap filling, no feature porting needed!**

---

**Next Steps:**
1. Run verification checklist on `~/dev/kindscript/website/`
2. Deploy to Vercel staging URL first
3. Test thoroughly
4. Point kindscript.ai to new deployment
5. Remove kindscript-website repo

---

**Document Version:** 1.0
**Last Updated:** 2026-02-12
**Status:** Ready for execution
