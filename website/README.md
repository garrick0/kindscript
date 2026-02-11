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
