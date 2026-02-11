# Website Cleanup and Deployment Plan

## Current Status

**What we have:**
- ✅ New unified website in `website/` (Next.js + Nextra + WebContainer tutorial)
- ⚠️ Old TutorialKit version still in `tutorial/` directory
- ⚠️ Original docs in `docs/` directory (content has been migrated to website)
- ⚠️ Screenshot files in project root from Playwright review
- ⚠️ Build error in website (unused variable in LessonContent.tsx)

**What abstractions-notebook does:**
- Simple deployment: `apps/landing` directory deployed directly to Vercel
- Uses `output: "standalone"` in next.config.ts
- No special Vercel configuration needed

---

## Step 1: Fix Build Error

**Issue:** Unused `color` variable in LessonContent.tsx line 25

**Fix:** Remove unused variable from callout type mapping

---

## Step 2: Clean Up Old Files

### Files/Directories to Remove

1. **Old tutorial:** `tutorial/` - entire directory (TutorialKit version, no longer needed)
2. **Screenshot artifacts:**
   - `landing-page.png`
   - `tutorial-lesson-loading.png`
   - `tutorial-loaded.png`
   - `console-errors.txt`
3. **Consider keeping:** `docs/` - still useful as markdown source, can be kept

### Git Cleanup

```bash
# Remove old tutorial
rm -rf tutorial/

# Remove screenshots
rm landing-page.png tutorial-lesson-loading.png tutorial-loaded.png console-errors.txt

# Update .gitignore to prevent future screenshot commits
echo "*.png" >> .gitignore
echo "console-errors.txt" >> .gitignore
```

---

## Step 3: Prepare for Vercel Deployment

### Update website/next.config.mjs

Add `output: "standalone"` like abstractions-notebook:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // ... existing config (CORS headers, etc.)
};
```

### Create vercel.json (optional, but recommended)

Based on existing `website/vercel.json` - verify it has:
- Correct headers for WebContainer
- Correct region settings

---

## Step 4: Deploy to Vercel

### Method 1: Vercel CLI (Recommended)

```bash
cd website

# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (first time - will create project)
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? [your account]
# - Link to existing project? No
# - Project name? kindscript-website (or your preferred name)
# - Directory? ./ (current directory)
# - Override settings? No

# For production deployment:
vercel --prod
```

### Method 2: GitHub Integration

1. Push website to GitHub
2. Go to https://vercel.com/new
3. Import repository
4. **Set root directory to `website/`** (important!)
5. Leave build settings as default (Vercel auto-detects Next.js)
6. Deploy

---

## Step 5: Post-Deployment Verification

### Test Checklist

- [ ] Landing page loads (/)
- [ ] Docs navigation works (/docs)
- [ ] Tutorial index loads (/tutorial)
- [ ] First lesson loads with WebContainer (/tutorial/1-1-hello-kindscript)
- [ ] WebContainer boots successfully
- [ ] Run Check button works
- [ ] Mobile fallback shows on unsupported browsers
- [ ] All 32 ADR pages load correctly
- [ ] No console errors on docs pages

### Monitor

- Check Vercel deployment logs
- Check browser console for errors
- Test on multiple browsers (Chrome, Firefox, Safari)
- Test mobile responsiveness

---

## Step 6: Custom Domain (Optional)

If you want to use a custom domain like `kindscript.dev`:

1. Go to Vercel project settings → Domains
2. Add your domain
3. Configure DNS records as instructed
4. Wait for SSL certificate provisioning

---

## Summary

**Files to delete:**
- `tutorial/` (entire directory)
- `landing-page.png`
- `tutorial-lesson-loading.png`
- `tutorial-loaded.png`
- `console-errors.txt`

**Files to keep:**
- `docs/` (original markdown source)
- `website/` (new unified site)
- All other project files (src/, tests/, etc.)

**Deployment:**
- Same as abstractions-notebook: deploy `website/` directory directly
- Use Vercel CLI: `cd website && vercel --prod`
- Or GitHub integration with root directory set to `website/`

**Next steps:**
1. Fix build error (unused variable)
2. Clean up old files
3. Verify build succeeds
4. Deploy to Vercel
5. Test production deployment

---

**Estimated time:** 10-15 minutes for cleanup + deployment
**Risk level:** Low (old tutorial is completely replaced, safe to delete)
