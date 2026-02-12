# Agent Docs Integration

This document explains how agent documentation from the `ks-agent` repository is integrated into the KindScript website.

## Architecture

**Approach:** Multi-repo checkout in GitHub Actions (Approach A from analysis)

The kindscript website pulls agent docs at build time and renders them at `/agent/docs/*`.

## How It Works

### 1. CI/CD Pipeline (Automated)

When agent docs change in `ks-agent/docs/`:

1. **ks-agent triggers kindscript deploy** (`.github/workflows/trigger-website-rebuild.yml`)
   - Watches for changes to `docs/**`
   - Calls GitHub API to trigger `deploy-website.yml` workflow in kindscript repo
   - Requires `WEBSITE_DEPLOY_TOKEN` secret (PAT with `actions:write` on kindscript)

2. **kindscript deploy workflow checks out both repos** (`.github/workflows/deploy-website.yml`)
   - Checks out `kindscript` repo to `kindscript/` directory
   - Checks out `ks-agent` repo to `ks-agent/` directory with sparse-checkout (docs only)
   - Copies `ks-agent/docs/` → `kindscript/website/content/agent-docs/`
   - Builds website with synced content
   - Deploys to Vercel

3. **Website renders agent docs** (`src/app/(marketing)/agent/docs/[[...slug]]/page.tsx`)
   - Dynamic route renders any file in `content/agent-docs/`
   - Supports nested directories and README-style indices
   - Uses ReactMarkdown with syntax highlighting

### 2. Local Development

For local development, the synced content isn't available (it's gitignored). Run the sync script:

```bash
cd website
npm run sync:agent-docs
```

This fetches the latest agent docs from GitHub and writes them to `content/agent-docs/`.

**Script:** `scripts/sync-agent-docs-local.mjs`

## File Structure

```
kindscript/
├── .github/workflows/
│   └── deploy-website.yml          # Multi-repo checkout + deploy
├── website/
│   ├── content/
│   │   └── agent-docs/             # Synced (gitignored, build-time only)
│   ├── src/app/(marketing)/agent/
│   │   ├── page.tsx                # Agent landing page
│   │   └── docs/[[...slug]]/
│   │       ├── page.tsx            # Dynamic doc renderer
│   │       └── layout.tsx          # Docs navigation
│   └── scripts/
│       └── sync-agent-docs-local.mjs  # Local dev sync script

ks-agent/
├── .github/workflows/
│   └── trigger-website-rebuild.yml # Trigger kindscript deploy
└── docs/                           # Source of truth for agent docs
```

## Routes

| Path | Content |
|------|---------|
| `/agent` | Agent product landing page (marketing) |
| `/agent/docs` | Agent documentation index (README.md) |
| `/agent/docs/tutorials/building-a-ddd-ontology` | Tutorial doc |
| `/agent/docs/reference/api-endpoints` | API reference doc |

The route structure mirrors the file structure in `ks-agent/docs/`.

## Required Secrets

### In `ks-agent` repo:
- `WEBSITE_DEPLOY_TOKEN` — PAT with `actions:write` on `kindscript` repo

### In `kindscript` repo:
- `CROSS_REPO_PAT` — PAT with `repo` scope (read access to `ks-agent`)
- `VERCEL_TOKEN` — Vercel deployment token
- `VERCEL_ORG_ID` — Vercel organization ID
- `VERCEL_PROJECT_ID` — Vercel project ID

## Freshness

- **CI builds:** Always use latest `main` from both repos
- **Local dev:** Run `npm run sync:agent-docs` to fetch latest

## Content Source of Truth

- **Agent docs:** `ks-agent/docs/` (edit there)
- **OSS docs:** `kindscript/docs/` (edit there)
- **Website content:** `kindscript/website/src/app/` (edit there)

## Troubleshooting

### Agent docs not showing up locally

Run the sync script:
```bash
npm run sync:agent-docs
```

### Agent docs out of date on website

Check the GitHub Actions workflow run. The deploy should have been triggered by ks-agent.

### Build fails with "content/agent-docs not found"

This is expected on first build. The workflow creates this directory. For local dev, run `npm run sync:agent-docs`.

### Cross-repo trigger not working

Check that `WEBSITE_DEPLOY_TOKEN` secret exists in ks-agent repo and has `actions:write` permission on kindscript repo.

## Future Improvements

- Add sidebar navigation for agent docs (currently flat layout)
- Add search integration for agent docs
- Consider using Nextra's remote content feature for ISR (no redeploy needed)
- Add breadcrumb navigation
- Implement doc versioning if needed
