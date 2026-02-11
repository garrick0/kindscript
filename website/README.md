# KindScript Website

The official website for KindScript — architecture as types.

## Features

- **Documentation**: Complete docs powered by Nextra 4
- **Interactive Tutorial**: 15 lessons with live code editor (Monaco) and WebContainer-powered terminal
- **Architecture Decision Records**: All 32 ADRs with proper navigation

## Tech Stack

- Next.js 15 (App Router)
- Nextra 4 (docs theme)
- Monaco Editor (@monaco-editor/react)
- WebContainer API (@webcontainer/api)
- xterm.js (@xterm/xterm)
- TypeScript

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Building

```bash
npm run build
npm start
```

## Deployment

The site is deployed to Vercel with automated GitHub Actions workflows.

### Automated Deployment (Recommended)

Deploy via GitHub Actions workflow:

```bash
# Via GitHub UI
# 1. Go to Actions tab
# 2. Select "Deploy Website to Vercel"
# 3. Click "Run workflow"
# 4. Choose environment (production/preview)

# Via GitHub CLI
gh workflow run deploy-website.yml -f environment=production
```

The workflow automatically:
- Builds the Next.js site
- Deploys to Vercel
- Shows deployment URL in workflow summary

**Live site:** https://website-five-theta-38.vercel.app

### Manual Deployment

```bash
npm run build
vercel --prod
```

### Requirements

- Node.js 22+ (specified in `.nvmrc`)
- npm 10+
- All dependencies in `package.json` (including `@types/node`)

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment guide.

## Testing & Verification

**Status:** ✅ **Verified and ready for production** (2026-02-11)

The website has been comprehensively tested using Playwright browser automation:

### Verification Documents
- **[PLAYWRIGHT_VERIFICATION_SUMMARY.md](PLAYWRIGHT_VERIFICATION_SUMMARY.md)** - Complete test report with:
  - Test methodology and coverage
  - Detailed results for each verified page
  - Component verification matrix
  - Production readiness assessment
  - Pre/post-deployment checklists

- **[VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md)** - Page-by-page verification checklist

### What Was Tested
- ✅ Landing page and navigation
- ✅ Documentation pages (Nextra framework)
- ✅ **Interactive tutorials** - Fully functional:
  - WebContainer boots successfully
  - Monaco editor with syntax highlighting
  - Terminal (xterm.js) integration
  - File tree navigation
  - Run Check & Show Solution buttons
  - Lesson-to-lesson navigation

### Known Issues
- See `FIXES.md` for resolved critical bugs (WebContainer singleton, Terminal integration)
- Minor dev server instability (development-only, not production)

## Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.mdx            # Landing page
│   ├── docs/               # Documentation (Nextra)
│   └── tutorial/           # Interactive tutorial
├── components/
│   └── tutorial/           # Tutorial UI components
├── lib/
│   ├── lessons/            # Lesson data (migrated from TutorialKit)
│   └── webcontainer/       # WebContainer utilities
└── content/
    └── lessons/            # Lesson MDX content
```

## CORS Headers

WebContainer requires specific CORS headers to enable `SharedArrayBuffer`. These are configured in `next.config.mjs` and scoped to `/tutorial/*` routes only:

```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

## License

MIT
