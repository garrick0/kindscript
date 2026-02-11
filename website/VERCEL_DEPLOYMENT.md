# Vercel Deployment Instructions

## Quick Start

```bash
cd website

# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

---

## Detailed Steps

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

This will open a browser window for authentication.

### 3. First Deployment

From the `website/` directory:

```bash
cd website
vercel
```

You'll be prompted:
- **Set up and deploy?** Yes
- **Which scope?** Select your account/team
- **Link to existing project?** No
- **What's your project's name?** `kindscript-website` (or your preferred name)
- **In which directory is your code located?** `./` (current directory)
- **Want to override the settings?** No (Vercel auto-detects Next.js)

This creates a preview deployment.

### 4. Production Deployment

```bash
vercel --prod
```

This deploys to production with a permanent URL.

---

## Configuration

### Next.js Config (already set up)

`website/next.config.mjs` is configured with:
- `output: 'standalone'` - Optimized for Vercel deployment
- CORS headers for `/tutorial/*` routes (required for WebContainer)

### Vercel Config (already set up)

`website/vercel.json` includes:
- Additional headers configuration
- Region settings

---

## Deployment Method: Same as abstractions-notebook

We're using the **same deployment method** as your `abstractions-notebook` project:
- Deploy single Next.js app directory directly
- Use `output: 'standalone'` in next.config
- No monorepo complexity
- Vercel auto-detects Next.js settings

---

## Post-Deployment Checklist

After deploying, verify:

- [ ] Landing page loads: `https://your-url.vercel.app/`
- [ ] Docs work: `https://your-url.vercel.app/docs`
- [ ] Tutorial index: `https://your-url.vercel.app/tutorial`
- [ ] Tutorial lesson loads: `https://your-url.vercel.app/tutorial/1-1-hello-kindscript`
- [ ] WebContainer boots successfully
- [ ] Run Check button works
- [ ] Terminal shows output
- [ ] Mobile detection works (test on phone or resize browser)

---

## Custom Domain (Optional)

To add a custom domain:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Domains
3. Add your domain (e.g., `kindscript.dev`)
4. Configure DNS records as instructed by Vercel
5. Wait for SSL certificate to provision (usually < 5 minutes)

---

## Environment Variables (Not Needed)

This project doesn't require any environment variables for basic deployment.

If you add analytics or other services later, you can add them in:
- Vercel Dashboard → Settings → Environment Variables

---

## Monitoring

Vercel provides:
- **Deployments:** Track all deployments
- **Analytics:** Pageviews and performance
- **Logs:** Runtime logs for debugging
- **Speed Insights:** Core Web Vitals

Access at: https://vercel.com/dashboard

---

## Updating the Site

After making changes:

```bash
cd website
npm run build  # Test locally first
vercel --prod  # Deploy to production
```

Or set up GitHub integration for automatic deployments on push.

---

## GitHub Integration (Alternative Method)

If you prefer automatic deployments:

1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. **Important:** Set root directory to `website/`
5. Leave other settings as default
6. Deploy

Vercel will automatically redeploy on every push to your main branch.

---

## Troubleshooting

### Build Fails
- Check `npm run build` locally first
- Review build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`

### WebContainer Doesn't Boot
- Check CORS headers in Network tab (should be present on `/tutorial/*` routes)
- Verify browser supports SharedArrayBuffer
- Check browser console for errors

### 404 Errors
- Ensure root directory is set to `website/` (not project root)
- Check that pages exist in `src/app/`

---

## Summary

✅ **Build verified:** Production build succeeds
✅ **Config ready:** next.config.mjs and vercel.json set up
✅ **Same method as abstractions-notebook:** Deploy `website/` directory directly
✅ **No special requirements:** Vercel auto-detects everything

**Next step:** Run `cd website && vercel --prod` to deploy!
