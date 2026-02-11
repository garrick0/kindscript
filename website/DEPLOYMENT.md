# KindScript Website Deployment Guide

## ✅ Pre-Deployment Checklist

- [x] KindScript published to npm (v1.0.0)
- [x] Template updated to use `kindscript: '^1.0.0'`
- [x] Production build succeeds
- [x] All critical features implemented
- [x] Error boundaries in place
- [x] Mobile detection working
- [x] Loading states implemented

## 🧪 Local Testing

Before deploying, test locally:

```bash
cd website
npm run build
npm start
```

Then visit http://localhost:3000 and test:

### Docs Testing
1. ✅ Visit `/` - landing page loads
2. ✅ Click "Read the Docs" - docs navigation works
3. ✅ Browse through all 6 doc chapters
4. ✅ Check an ADR link (e.g., `/docs/decisions/0001-...`)
5. ✅ Verify search works (if Pagefind built)

### Tutorial Testing (Critical Path)
1. ✅ Visit `/tutorial` - lesson index loads
2. ✅ Click first lesson "1.1 Hello KindScript"
3. ✅ **Wait for loading overlay** - should show "Booting..." then "Installing..."
4. ✅ **Loading should complete** - overlay disappears, status shows "✓ Ready"
5. ✅ **Verify terminal output** - should show:
   - "Booting WebContainer..."
   - "Mounting files..."
   - "Installing dependencies..."
   - npm install output
   - "✓ Dependencies installed"
   - "=== Ready ==="
6. ✅ **Verify file tree** - shows 4 files on left panel
7. ✅ **Verify editor** - opens with `src/context.ts` (syntax highlighting)
8. ✅ **Edit a file** - type in editor, verify changes appear
9. ✅ **Click "Run Check" button** - verify:
   - Terminal shows `$ npm run check`
   - Output appears in terminal
   - Shows "0 violations" or similar
10. ✅ **Click "Show Solution"** - verify solution loads
11. ✅ **Click "Reset"** - verify original files restore
12. ✅ **Click "Next" lesson** - navigate to 1.2, verify files change
13. ✅ **Navigate back** - verify navigation works both ways

### Mobile/Browser Testing
1. ✅ Open lesson on mobile or in private browsing
2. ✅ If SharedArrayBuffer unsupported, should show:
   - "Desktop Browser Required" message
   - List of supported browsers
   - Links to static tutorial and back to lessons

### Error Testing
1. ✅ Force an error (e.g., kill dev server mid-boot)
2. ✅ Verify error boundary catches it
3. ✅ Verify "Reload Page" button works

## 🚀 Deploying to Vercel

### Option 1: Deploy from Website Directory

```bash
cd website
vercel
```

Follow prompts:
- Project name: `kindscript-website`
- Framework: Next.js
- Build command: `npm run build`
- Output directory: `.next`

### Option 2: Connect GitHub Repository

1. Push to GitHub:
   ```bash
   git add website/
   git commit -m "feat: add complete website with interactive tutorial"
   git push
   ```

2. Go to https://vercel.com/new
3. Import your repository
4. Set root directory to `website/`
5. Deploy

### Environment Variables

No environment variables needed for basic deployment.

### Custom Domain (Optional)

1. Go to Vercel project settings
2. Add domain: `kindscript.dev` (or your domain)
3. Configure DNS as instructed

## 🔧 Vercel Configuration

The `vercel.json` is already configured with:
- CORS headers for `/tutorial/*` routes
- Next.js framework detection
- US East region (iad1)

If you need to modify:
```json
{
  "headers": [
    {
      "source": "/tutorial/:path*",
      "headers": [
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" },
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" }
      ]
    }
  ]
}
```

These headers are **critical** for WebContainer to work.

## 🐛 Troubleshooting

### "WebContainer failed to boot"
- Check browser console for errors
- Verify CORS headers are set (check Network tab)
- Ensure using supported browser (Chrome 92+, Firefox 95+, Safari 15.2+)

### "npm install" fails in WebContainer
- Check if kindscript v1.0.0 is available on npm registry
- Verify network connection
- Wait longer (first install can take 60+ seconds)

### Build fails
```bash
npm run build
```
Check for:
- TypeScript errors
- ESLint errors
- Missing dependencies

### CORS errors
- Verify headers in `next.config.mjs` and `vercel.json` match
- Check browser console Network tab for actual headers sent
- Ensure route matches pattern `/tutorial/:path*`

## 📊 Post-Deployment Verification

Once deployed, verify:

1. ✅ Visit production URL
2. ✅ Test landing page loads
3. ✅ Test docs navigation
4. ✅ **Test tutorial with WebContainer** (most important!)
5. ✅ Check browser console for errors
6. ✅ Test on multiple browsers (Chrome, Firefox, Safari)
7. ✅ Test mobile fallback

## 🔄 Updating After Deployment

To deploy updates:

```bash
cd website
npm run build  # Test locally first
vercel --prod  # Deploy to production
```

Or if using GitHub:
```bash
git add .
git commit -m "feat: update X"
git push  # Vercel auto-deploys
```

## 📈 Monitoring

Vercel provides:
- **Analytics** - pageviews, unique visitors
- **Speed Insights** - Core Web Vitals
- **Error tracking** - runtime errors
- **Logs** - server logs for debugging

Access via: https://vercel.com/dashboard

## 🎯 Success Metrics

After deployment, the site should:
- ✅ Load in < 3 seconds (docs)
- ✅ WebContainer boot in < 60 seconds (first time)
- ✅ WebContainer boot in < 10 seconds (cached)
- ✅ Zero console errors on docs pages
- ✅ Tutorial works on Chrome/Firefox/Safari desktop
- ✅ Mobile fallback shows correctly

## 📝 Next Steps After Deployment

1. **Monitor first 24 hours** - check Vercel logs for errors
2. **Share with beta testers** - get feedback on tutorial UX
3. **Fix any issues** - deploy patches as needed
4. **Announce launch** - share on Twitter, Reddit, HN, etc.

## 🆘 Support

If issues arise:
- Check Vercel logs: `vercel logs [deployment-url]`
- Check browser console
- Verify WebContainer requirements met
- Review CORS headers
- Test locally with production build

---

**Ready to deploy!** 🚀

Run `vercel` from the `website/` directory to deploy now.
