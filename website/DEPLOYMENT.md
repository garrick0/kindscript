# Website Deployment Guide

This document explains how to deploy the KindScript documentation website to Vercel.

## Deployment Methods

### 1. Automated via GitHub Actions (Recommended)

The repository includes a GitHub Actions workflow for deploying to Vercel.

#### Prerequisites

Set up the following GitHub repository secrets (one-time setup):

1. Go to: `Settings → Secrets and variables → Actions → New repository secret`

2. Add these three secrets:

   | Secret Name | Value | Where to find it |
   |-------------|-------|------------------|
   | `VERCEL_TOKEN` | Your Vercel auth token | https://vercel.com/account/tokens |
   | `VERCEL_ORG_ID` | `team_ejF7ixE5qEz0KpU23ezXlAsd` | `.vercel/project.json` |
   | `VERCEL_PROJECT_ID` | `prj_aTDCrSV2cR0IKpiqNvLDFmgz2z4O` | `.vercel/project.json` |

#### Usage

1. Go to the **Actions** tab in GitHub
2. Select **Deploy Website to Vercel** workflow
3. Click **Run workflow**
4. Choose environment:
   - **production** - Deploy to production URL
   - **preview** - Deploy to preview URL for testing
5. Click **Run workflow**

The workflow will:
- Install dependencies
- Build the Next.js site
- Deploy to Vercel
- Show the deployment URL in the workflow summary

### 2. Manual Deployment via CLI

For local testing or one-off deployments:

```bash
# Navigate to website directory
cd website

# Install dependencies
npm install

# Test build locally
npm run build

# Deploy to Vercel (requires vercel CLI installed globally)
vercel --prod
```

## Build Configuration

### Required Files

- **package.json** - Dependencies including `@types/node`
- **next.config.mjs** - Next.js + Nextra configuration
- **vercel.json** - Vercel-specific settings (headers, regions)
- **.nvmrc** - Node version specification (22)

### Build Command

```bash
npm run build  # Runs: next build
```

The build:
- Generates 44 static pages (docs + ADRs + tutorial)
- Uses Next.js 15 with Nextra 4
- Outputs to `.next/` directory
- Takes ~30 seconds

## Production URLs

After deployment, the site will be available at:
- **Vercel URL:** `https://website-[hash]-garrick0s-projects.vercel.app`
- **Custom domain:** (if configured in Vercel)

## Vercel Configuration

The deployment is protected by default. To make it public:
1. Go to Vercel dashboard → Project settings → Deployment Protection
2. Disable "Vercel Protection" or add allowed domains

## Monitoring

- **GitHub Actions:** View workflow runs in the Actions tab
- **Vercel Dashboard:** https://vercel.com/garrick0s-projects/website
