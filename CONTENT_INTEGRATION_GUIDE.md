# KindScript Content Organization & Integration Guide

**Version:** 2.0 (Updated after comprehensive investigation)
**Date:** 2026-02-12
**Purpose:** Comprehensive guide to content organization, integration, and deployment across all repositories

**Status:** ✅ Verified against actual repository state (not assumptions)

---

## Investigation Summary

This document has been **fully updated** based on direct investigation of the actual repositories at:
- `~/dev/kindscript` (main KindScript OSS repo)
- `~/dev/kindscript-website` (website repo)
- `~/dev/ks-agent` (ontology-notebooks repo)
- `~/dev/kindscript/targets/induction-studio/` (sub-project)

**Key corrections made from v1.0:**
- ✅ Corrected all file paths to use `~/dev/` prefix
- ✅ Verified actual GitHub remote URLs (`garrick0` org, not `samuelgleeson` in locals)
- ✅ Identified GitHub org mismatch between local remotes and workflow URLs
- ✅ Confirmed old website is **still deployed** (not just deprecated)
- ✅ Discovered 3 unused Vercel configs (not 1) in induction-studio
- ✅ Corrected false claim about notebook trigger workflow (doesn't exist)
- ✅ Updated all repo references to match actual structure

---

## Table of Contents

1. [Repository Overview](#repository-overview)
2. [GitHub Organization Mismatch](#github-organization-mismatch) ⚠️ **Critical Issue**
3. [Content Organization](#content-organization)
4. [Website Integration & Deployment](#website-integration--deployment)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Vercel Configuration](#vercel-configuration)
7. [Current Issues & Redundancies](#current-issues--redundancies)
8. [Recommendations](#recommendations)
9. [Summary Matrix](#summary-matrix)
10. [Key Findings Summary](#key-findings-summary)

---

## Repository Overview

### Local Repository Locations

| Local Path | Repository Name | Purpose | Visibility | Remote URL |
|------------|-----------------|---------|------------|------------|
| **~/dev/kindscript** | kindscript | KindScript OSS tool | Public | https://github.com/garrick0/kindscript.git |
| **~/dev/kindscript-website** | kindscript-website | Unified documentation website | Public | https://github.com/garrick0/kindscript-website.git |
| **~/dev/ks-agent** | ontology-notebooks | Ontology discovery tools (Abstractions Notebook) | Public | https://github.com/garrick0/ontology-notebooks.git |
| **N/A** | kindscript-agent | Agent product (private) | Private | https://github.com/samuelgleeson/kindscript-agent.git |

**⚠️ Critical Note - GitHub Organization Mismatch:** Local git remotes use `garrick0` org, but GitHub Actions workflows and fetch scripts reference `samuelgleeson` org. See [GitHub Organization Mismatch](#github-organization-mismatch) section for details.

---

## GitHub Organization Mismatch

### The Problem

There is a **mismatch** between local git remotes and GitHub Actions workflow URLs:

**Local Git Remotes (verified):**
```bash
~/dev/kindscript           → https://github.com/garrick0/kindscript.git
~/dev/kindscript-website   → https://github.com/garrick0/kindscript-website.git
~/dev/ks-agent             → https://github.com/garrick0/ontology-notebooks.git
```

**GitHub Actions Workflows (verified):**
```yaml
# ~/dev/kindscript/.github/workflows/trigger-website-rebuild.yml
owner: 'samuelgleeson'
repo: 'kindscript-website'
# Dispatches to: samuelgleeson/kindscript-website
```

**Website Fetch Script (verified):**
```bash
# ~/dev/kindscript-website/scripts/fetch-docs.sh
git clone https://github.com/samuelgleeson/abstractions-as-types.git
git clone https://${REPO_ACCESS_TOKEN}@github.com/samuelgleeson/kindscript-agent.git
# Clones from: samuelgleeson org (not garrick0)
```

### Impact

1. **Confusing setup** - unclear which org is canonical
2. **Potential for divergence** - if repos exist in both orgs and drift apart
3. **Deployment fragility** - if samuelgleeson repos are deleted, deployments break
4. **Documentation confusion** - unclear which URLs to reference

### Resolution Required

**You must decide:** Which GitHub organization is canonical?

- **Option A:** `garrick0` (matches local remotes)
  - Update workflows to point to `garrick0`
  - Update fetch-docs.sh to clone from `garrick0`

- **Option B:** `samuelgleeson` (matches workflows)
  - Update all local git remotes to `samuelgleeson`
  - Update documentation to reference `samuelgleeson`

**Recommended:** Check which org has the most recent commits and use that as canonical.

---

### Fourth Component (Sub-project)

| Component | Location | Purpose | Deployment |
|-----------|----------|---------|------------|
| **induction-studio** | `~/dev/kindscript/targets/induction-studio/` | Storybook design system | Netlify |

---

## Content Organization

### 1. kindscript (Main KindScript Repo) - ~/dev/kindscript

```
~/dev/kindscript/
├── docs/                           ← SOURCE: KindScript OSS documentation
│   ├── 01-architecture.md
│   ├── 02-kind-system.md
│   ├── 03-constraints.md
│   ├── 05-examples.md
│   ├── 06-tutorial.md
│   └── decisions/                  ← 35 ADRs
│
├── src/types/index.ts              ← SOURCE: Public API types
│
├── website/                        ⚠️ REDUNDANT (old website, still deployed)
│   ├── src/
│   ├── public/lessons/
│   ├── vercel.json
│   ├── package.json
│   └── *.md                        ← ~4800 lines of deployment docs
│
├── targets/induction-studio/       ← Separate product (Storybook)
│   ├── apps/
│   │   ├── platform/vercel.json    ❌ UNUSED (all deploy to Netlify)
│   │   └── studio/vercel.json      ❌ UNUSED
│   ├── vercel.json                 ❌ UNUSED (deploys to Netlify)
│   └── .github/workflows/
│       ├── deploy.yml              ✅ ACTIVE (Netlify)
│       ├── chromatic.yml
│       └── storybook-ci.yml
│
└── .github/workflows/
    ├── trigger-website-rebuild.yml ✅ WORKING (triggers samuelgleeson/kindscript-website)
    ├── deploy-website.yml          ⚠️ STILL ACTIVE (deploys website/ to Vercel)
    └── publish.yml                 ✅ ACTIVE (publishes to npm)
```

**Key Points:**
- `docs/` and `src/types/` are the **source of truth** for KindScript docs
- `website/` directory is **redundant** but **still deployed** via deploy-website.yml
- Trigger workflow dispatches to `samuelgleeson/kindscript-website` (not `garrick0`)
- **3 unused vercel.json files** in targets/induction-studio (all deploy to Netlify)

### 2. kindscript-website (Unified Website Repo) - ~/dev/kindscript-website

```
~/dev/kindscript-website/
├── src/app/                        ← ACTUAL WEBSITE CODE
│   ├── page.tsx                    → kindscript.ai/ (unified landing)
│   ├── docs/                       → kindscript.ai/docs/ (OSS docs via Nextra)
│   ├── tutorial/                   → kindscript.ai/tutorial/ (WebContainer)
│   ├── agent/                      → kindscript.ai/agent (product page)
│   ├── about/                      → kindscript.ai/about
│   └── privacy/                    → kindscript.ai/privacy
│
├── content/                        ← BUILD-TIME CONTENT (gitignored)
│   ├── kindscript-docs/           ← Cloned from samuelgleeson/abstractions-as-types/docs/
│   ├── agent-docs/                ← Cloned from samuelgleeson/kindscript-agent/docs/ (private)
│   └── api-types.ts               ← Copied from samuelgleeson/abstractions-as-types/src/types/
│
├── scripts/
│   └── fetch-docs.sh              ← Clones docs at build time (uses samuelgleeson org)
│
├── .github/workflows/
│   └── deploy.yml                 ← Main deployment workflow
│
├── vercel.json                    ✅ ACTIVE CONFIG (CORS headers for WebContainer)
└── package.json                   → name: "kindscript-website"
```

**Key Points:**
- This is the **canonical website** - not the one in ~/dev/kindscript/website/
- Content is pulled **at build time** via `fetch-docs.sh` script
- `content/` directory is **gitignored** - regenerated on every build
- Deploys to **kindscript.ai** (or preview URL) via Vercel
- **URL Discrepancy:** fetch-docs.sh clones from `samuelgleeson/*` repos, but local remotes point to `garrick0/*`

### 3. ontology-notebooks (Abstractions Notebook) - ~/dev/ks-agent

```
~/dev/ks-agent/
├── docs/                           ← Ontology documentation (Diátaxis)
│   ├── tutorials/
│   ├── how-to/
│   ├── reference/
│   └── explanation/
│       ├── architecture/
│       ├── ai-integration/
│       ├── evidence-system/
│       ├── instance-modeling/
│       ├── notebook-pipeline/
│       └── ontology-system/
│
├── apps/
│   ├── ontology-manager/          ← React frontend (domain-driven structure)
│   │   ├── docs/                  ← App-specific docs (architecture, AI copilot, testing)
│   │   └── e2e/                   ← Playwright tests
│   └── ontology-api/              ← Express backend (Claude Agent SDK)
│
└── .github/workflows/             ❌ NO WORKFLOWS
    (no trigger workflow found)
```

**Key Points:**
- **Repo name mismatch:** Local dir is `ks-agent`, actual repo is `ontology-notebooks`
- Has extensive documentation in `docs/` (Diátaxis framework)
- **NO trigger workflow** - unlike the document claimed
- kindscript-website does NOT fetch these docs (not in fetch-docs.sh)
- These docs are **isolated** - not published anywhere
- **Note:** `~/dev/abstractions-as-types-notebook` exists but is NOT a git repo (old copy)

### 4. induction-studio (Separate Product) - ~/dev/kindscript/targets/induction-studio/

```
~/dev/kindscript/targets/induction-studio/
├── apps/
│   ├── platform/
│   │   ├── vercel.json            ❌ NOT USED (deploys to Netlify)
│   │   └── ...
│   └── studio/
│       ├── vercel.json            ❌ NOT USED (deploys to Netlify)
│       └── ...
│
├── vercel.json                    ❌ NOT USED (deploys to Netlify)
│
└── .github/workflows/
    ├── deploy.yml                 ✅ ACTIVE (Netlify)
    ├── chromatic.yml              ✅ ACTIVE (Chromatic)
    └── storybook-ci.yml           ✅ ACTIVE (CI)
```

**Key Points:**
- Completely separate product within kindscript monorepo
- Deploys to **studio.induction.systems** via **Netlify** (not Vercel)
- **3 unused vercel.json files** (root + 2 apps) - all misleading
- Has 5 active workflows (deploy, test, chromatic, sync-secrets, storybook-ci)

---

## Website Integration & Deployment

### Content Pipeline (Build Time)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Build-Time Content Fetching                   │
└─────────────────────────────────────────────────────────────────┘

Step 1: Trigger (Push to docs/)
┌──────────────────────────────┐
│  garrick0/kindscript         │
│  (~/dev/kindscript)          │
│  Push to docs/ or types/     │
└──────────────┬───────────────┘
               │
               │ GitHub Actions
               │ workflow_dispatch to samuelgleeson/kindscript-website
               ▼
Step 2: Website Rebuild Triggered
┌──────────────────────────────┐
│  garrick0/kindscript-website │
│  (~/dev/kindscript-website)  │
│  .github/workflows/          │
│    deploy.yml                │
└──────────────┬───────────────┘
               │
               ▼
Step 3: Fetch Docs (scripts/fetch-docs.sh)
┌──────────────────────────────────────────────────────────────┐
│  git clone --depth 1 --sparse                                │
│    https://github.com/samuelgleeson/abstractions-as-types    │
│    (⚠️ Note: fetches from samuelgleeson org, not garrick0)  │
│                                                               │
│  git sparse-checkout set docs src/types                      │
│                                                               │
│  cp docs/ → content/kindscript-docs/                        │
│  cp src/types/index.ts → content/api-types.ts               │
│                                                               │
│  git clone (with auth) samuelgleeson/kindscript-agent        │
│  cp docs/ → content/agent-docs/                             │
└──────────────────────────────────────────────────────────────┘
               │
               ▼
Step 4: Build Next.js Site
┌──────────────────────────────┐
│  next build                  │
│  (includes fetched docs)     │
└──────────────┬───────────────┘
               │
               ▼
Step 5: Deploy to Vercel
┌──────────────────────────────┐
│  vercel deploy --prod        │
│  → kindscript.ai             │
└──────────────────────────────┘
```

### Cross-Repo Triggering Mechanism

**How It Works:**

1. **~/dev/kindscript/.github/workflows/trigger-website-rebuild.yml**
   - Watches: `docs/**`, `src/types/index.ts`
   - On push to main: Dispatches to `samuelgleeson/kindscript-website` (not `garrick0`)
   - Uses: `WEBSITE_DEPLOY_TOKEN` secret (GitHub PAT)
   - **URL Discrepancy:** Local remote is `garrick0/kindscript` but triggers `samuelgleeson` repo

2. **~/dev/kindscript-website/.github/workflows/deploy.yml**
   - Receives: workflow_dispatch event or push to main
   - Runs: fetch-docs.sh → build → deploy
   - Requires: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `REPO_ACCESS_TOKEN`
   - **URL Discrepancy:** Clones from `samuelgleeson` repos, not `garrick0`

3. **~/dev/ks-agent/.github/workflows/** (ontology-notebooks)
   - ❌ **NO TRIGGER WORKFLOW** - previous doc was incorrect
   - No integration with kindscript-website

### Current Deployment URLs

| Site | URL | Deployed From | Platform | Status |
|------|-----|---------------|----------|--------|
| KindScript Website | https://kindscript.ai (or preview) | `~/dev/kindscript-website` | Vercel | ✅ Primary |
| Old Website | https://website-five-theta-38.vercel.app | `~/dev/kindscript/website/` | Vercel | ⚠️ Redundant but still deployed |
| Induction Studio | https://studio.induction.systems | `~/dev/kindscript/targets/induction-studio/` | Netlify | ✅ Active |

---

## CI/CD Pipeline

### Working Pipelines

#### 1. KindScript Website (PRIMARY)

```yaml
# kindscript-website/.github/workflows/deploy.yml
Trigger: Push to main OR workflow_dispatch OR external trigger
Steps:
  1. Checkout website repo
  2. Clone abstractions-as-types docs (sparse checkout)
  3. Clone kindscript-agent docs (private, requires REPO_ACCESS_TOKEN)
  4. npm ci
  5. vercel build --prod
  6. vercel deploy --prod
Result: kindscript.ai updated
```

#### 2. Auto-Rebuild Triggers

```yaml
# ~/dev/kindscript/.github/workflows/trigger-website-rebuild.yml
Trigger: Push to docs/ or src/types/index.ts
Action: Dispatch workflow to samuelgleeson/kindscript-website repo
Token: WEBSITE_DEPLOY_TOKEN (GitHub PAT)
Note: Local remote is garrick0/kindscript but dispatches to samuelgleeson org
```

```yaml
# ~/dev/ks-agent/.github/workflows/
Status: ❌ NO TRIGGER WORKFLOW EXISTS
Previous doc was incorrect
```

#### 3. Induction Studio (SEPARATE)

```yaml
# targets/induction-studio/.github/workflows/deploy.yml
Trigger: Push to main
Steps:
  1. Checkout code
  2. npm ci
  3. npm run build:storybook
  4. Deploy to Netlify
Platform: Netlify (NOT Vercel)
```

### Broken/Redundant Pipelines

#### 1. Old Website Deploy (STILL ACTIVE)

```yaml
# ~/dev/kindscript/.github/workflows/deploy-website.yml
Purpose: Deploys website/ subdirectory to Vercel
Status: ⚠️ STILL ACTIVE - deploys redundant website
Working Directory: website/
Deploys To: https://website-five-theta-38.vercel.app
Action: Should deprecate and remove
```

---

## Vercel Configuration

### Active Configurations

#### 1. kindscript-website/vercel.json (PRIMARY)

```json
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

**Purpose:** CORS headers for WebContainer (SharedArrayBuffer requirement)
**Status:** ✅ Active and necessary
**Vercel Project ID:** `prj_aTDCrSV2cR0IKpiqNvLDFmgz2z4O`

#### 2. ~/dev/kindscript/website/vercel.json (REDUNDANT)

```json
{
  "regions": ["iad1"],
  "headers": [ /* CORS headers for WebContainer */ ]
}
```

**Purpose:** Same as kindscript-website/vercel.json (duplicate)
**Status:** ⚠️ Redundant - website moved to separate repo but still deployed
**Action:** Can be removed when website/ directory is cleaned up

### Unused Configurations (3 files)

#### 3. ~/dev/kindscript/targets/induction-studio/vercel.json (NOT USED)
#### 4. ~/dev/kindscript/targets/induction-studio/apps/platform/vercel.json (NOT USED)
#### 5. ~/dev/kindscript/targets/induction-studio/apps/studio/vercel.json (NOT USED)

```json
{
  "ignoreCommand": "npx turbo-ignore",
  "headers": [ /* security headers */ ]
}
```

**Purpose:** Would configure Vercel deployment
**Status:** ❌ Not used - **all** induction-studio apps deploy to Netlify
**Action:** Remove all 3 files (misleading)

---

## Current Issues & Redundancies

### 🔴 Critical Issues

**1. GitHub Organization Mismatch**
- **Problem:** Local repos use `garrick0` org, but workflows reference `samuelgleeson` org
- **Impact:** Confusing setup, unclear which is canonical
- **Locations:**
  - Local remotes: `garrick0/kindscript`, `garrick0/kindscript-website`
  - Trigger workflow dispatches to: `samuelgleeson/kindscript-website`
  - fetch-docs.sh clones from: `samuelgleeson/abstractions-as-types`, `samuelgleeson/kindscript-agent`
- **Action Required:** Clarify which org is canonical and update accordingly

**2. Old Website Still Deployed**
- **Problem:** `~/dev/kindscript/website/` is redundant but still actively deployed
- **Impact:** Two websites exist, wastes resources, confusing
- **Evidence:** deploy-website.yml workflow is still active (not deprecated)
- **Size:** Full Next.js app with dependencies + ~4800 lines of deployment docs

### 🟡 Redundancies

**1. Duplicate Website Code**
- **Location 1:** `~/dev/kindscript/website/` (old, still deployed)
- **Location 2:** `~/dev/kindscript-website/` (current, canonical)
- **Status:** Same content in two places
- **Action:** Remove old website directory after verifying new site is live

**2. Active Old Deploy Workflow**
- **File:** `~/dev/kindscript/.github/workflows/deploy-website.yml`
- **Purpose:** Deploys old website/ directory to Vercel
- **Status:** ⚠️ STILL ACTIVE (not deprecated)
- **Deploys To:** https://website-five-theta-38.vercel.app
- **Action:** Deprecate and remove

**3. Three Unused Vercel Configs in Induction Studio**
- **Files:**
  - `targets/induction-studio/vercel.json`
  - `targets/induction-studio/apps/platform/vercel.json`
  - `targets/induction-studio/apps/studio/vercel.json`
- **Purpose:** Would configure Vercel deployment
- **Actual:** All induction-studio apps deploy to Netlify
- **Action:** Remove all 3 files (misleading)

**4. Duplicate Vercel Config in Old Website**
- **File:** `~/dev/kindscript/website/vercel.json`
- **Purpose:** CORS headers for WebContainer
- **Status:** Duplicate of kindscript-website/vercel.json
- **Action:** Remove when website/ directory is cleaned up

### 🟢 Minor Issues

**1. Incorrect Documentation About Notebook Trigger**
- **Problem:** Previous doc claimed notebook repo has trigger workflow
- **Reality:** No trigger workflow exists in `~/dev/ks-agent/` (ontology-notebooks)
- **Action:** Already corrected in this updated version

**2. Multiple Deployment Docs in Old Website**
- **Location:** `~/dev/kindscript/website/*.md`
- **Files:** 19 .md files totaling ~4800 lines
- **Examples:** DEPLOYMENT.md, STATUS.md, VERIFICATION_*.md, PLAYWRIGHT_*.md
- **Status:** Documentation for old website
- **Action:** Remove when cleaning up website/

**3. Repo Name Mismatch**
- **Local Dir:** `~/dev/ks-agent`
- **Actual Repo:** `ontology-notebooks` (Abstractions Notebook)
- **Impact:** Minor confusion when referencing
- **Action:** Consider renaming local dir to match repo name

---

## Recommendations

### Phase 0: Resolve GitHub Organization Mismatch (FIRST)

**Decision Required:** Which GitHub organization is canonical?
- **Option A:** Use `garrick0` org (matches local remotes)
- **Option B:** Use `samuelgleeson` org (matches workflows/fetch scripts)

**If Option A (garrick0):**
```bash
# Update trigger workflow in ~/dev/kindscript
cd ~/dev/kindscript
# Edit .github/workflows/trigger-website-rebuild.yml
# Change owner from 'samuelgleeson' to 'garrick0'

# Update fetch script in ~/dev/kindscript-website
cd ~/dev/kindscript-website
# Edit scripts/fetch-docs.sh
# Change all 'samuelgleeson' URLs to 'garrick0'
```

**If Option B (samuelgleeson):**
```bash
# Update all local git remotes
cd ~/dev/kindscript
git remote set-url origin https://github.com/samuelgleeson/kindscript.git

cd ~/dev/kindscript-website
git remote set-url origin https://github.com/samuelgleeson/kindscript-website.git

cd ~/dev/ks-agent
git remote set-url origin https://github.com/samuelgleeson/ontology-notebooks.git
```

---

### Phase 1: Immediate Cleanup (30 minutes)

**1.1 Remove 3 Unused Vercel Configs**
```bash
cd ~/dev/kindscript

# Induction Studio uses Netlify, not Vercel - remove all 3 configs
rm targets/induction-studio/vercel.json
rm targets/induction-studio/apps/platform/vercel.json
rm targets/induction-studio/apps/studio/vercel.json

git add targets/induction-studio/
git commit -m "chore: remove 3 unused vercel.json files (all apps deploy to Netlify)"
```

**1.2 Disable Old Website Deploy Workflow**
```bash
cd ~/dev/kindscript

# Disable the old deploy workflow (it's still active)
cat > .github/workflows/deploy-website.yml << 'EOF'
# DEPRECATED: This workflow is no longer used
#
# The KindScript website has been moved to a separate repository.
# The old website/ directory is redundant and should be removed.
#
# Canonical website:
# - Repository: https://github.com/[org]/kindscript-website
# - Local: ~/dev/kindscript-website
# - Deploy URL: https://kindscript.ai
#
# This file is kept for reference only.
# Deprecated: 2026-02-12

name: Deploy Website (DEPRECATED)

on:
  workflow_dispatch:

jobs:
  deprecated:
    runs-on: ubuntu-latest
    steps:
      - name: Deprecation Notice
        run: |
          echo "::error::This workflow is deprecated. Website now deploys from separate kindscript-website repo"
          exit 1
EOF

git add .github/workflows/deploy-website.yml
git commit -m "chore: disable old deploy-website workflow (website moved to separate repo)"
```

### Phase 2: Handle Notebook Docs (Decision Required)

**Current State:**
- Notebook repo (`~/dev/ks-agent` → ontology-notebooks) has NO trigger workflow
- Notebook docs are NOT integrated into kindscript-website
- No action needed unless you want to integrate them

**Option A: Integrate Notebook Docs into Website**

```bash
# Edit ~/dev/kindscript-website/scripts/fetch-docs.sh
# Add after KindScript OSS docs section:

# Fetch Notebook docs (public repo)
echo "📚 Cloning Abstractions Notebook documentation..."
if [ -d "/tmp/notebook" ]; then
  rm -rf /tmp/notebook
fi

git clone --depth 1 --sparse \
  https://github.com/[org]/ontology-notebooks.git \
  /tmp/notebook

cd /tmp/notebook
git sparse-checkout set docs

echo "📝 Copying Notebook docs..."
cp -r docs/ "${GITHUB_WORKSPACE:-$(pwd)}/content/notebook-docs/" || \
  cp -r docs/ "$OLDPWD/content/notebook-docs/"
```

Then update website to display notebook docs at `/notebook` route.

**Option B: Keep Notebook Docs Separate (CURRENT STATE)**

No action needed - docs remain in the notebook repo only.

**Recommendation:** **Option B** unless you want notebook docs on kindscript.ai

### Phase 3: Remove Old Website Directory (After Verification)

**Prerequisites:**
- [ ] Verify kindscript.ai is live and working
- [ ] Verify all docs are accessible
- [ ] Verify tutorial works (WebContainer + Monaco)
- [ ] Verify auto-rebuild triggers work

**Then:**

```bash
cd ~/dev/kindscript

# Remove entire old website directory
rm -rf website/

# Update .gitignore if needed
# (remove website-specific ignores)

# Commit removal
git add website/
git commit -m "chore: remove old website directory (moved to kindscript-website repo)"
git push
```

**Size Savings:** ~1400+ files, significant repo size reduction

### Phase 4: Update Documentation References

**4.1 Update CLAUDE.md**
- Already correct - references kindscript-website repo
- No changes needed

**4.2 Update README.md**
- Verify links point to kindscript.ai
- Remove references to local website/ directory

**4.3 Update Website CLAUDE.md**
```bash
cd ~/dev/kindscript-website
# Verify CLAUDE.md exists and is accurate
# (appears to be comprehensive based on investigation)
```

### Phase 5: Consolidate Deployment Documentation (Optional)

**Current State:**
- Main repo: Minimal deployment docs (good)
- Website repo: Comprehensive docs (START_HERE.md, SETUP.md, etc.)
- Old website: Redundant docs (will be removed with website/)

**No action needed** - documentation is already in the right place.

---

## Summary Matrix

### Content Locations

| Content Type | Source Location | Published To | Integration Method |
|--------------|-----------------|--------------|-------------------|
| **KindScript docs** | `~/dev/kindscript/docs/` | kindscript.ai/docs | Sparse clone at build time from samuelgleeson org |
| **KindScript API types** | `~/dev/kindscript/src/types/` | kindscript.ai/docs | Copied at build time from samuelgleeson org |
| **Tutorial lessons** | `~/dev/kindscript-website/src/content/` | kindscript.ai/tutorial | Direct (in website repo) |
| **Interactive tutorial** | `~/dev/kindscript-website/src/app/tutorial/` | kindscript.ai/tutorial | Direct (in website repo) |
| **Agent product page** | `~/dev/kindscript-website/src/app/agent/` | kindscript.ai/agent | Direct (in website repo) |
| **Agent docs** | Private: samuelgleeson/kindscript-agent | kindscript.ai/agent | Sparse clone at build time (requires REPO_ACCESS_TOKEN) |
| **Notebook docs** | `~/dev/ks-agent/docs/` (ontology-notebooks) | ❌ Not published | Not integrated |
| **Induction Studio** | `~/dev/kindscript/targets/induction-studio/` | studio.induction.systems | Netlify (separate product) |

### Redundancies to Remove

| Item | Location | Status | Action |
|------|----------|--------|--------|
| Old website directory | `~/dev/kindscript/website/` | ⚠️ Redundant but still deployed | Remove after verification |
| Old deploy workflow | `~/dev/kindscript/.github/workflows/deploy-website.yml` | ⚠️ Still active | Disable immediately |
| 3 unused Vercel configs | `~/dev/kindscript/targets/induction-studio/**/*.json` | ❌ Not used (Netlify) | Remove immediately |
| Duplicate Vercel config | `~/dev/kindscript/website/vercel.json` | ⚠️ Duplicate | Remove with website/ dir |
| Old website docs | `~/dev/kindscript/website/*.md` (19 files) | ⚠️ Redundant | Remove with website/ dir |

### Deployment Matrix

| Site | Local Path | Remote Repo | Platform | URL | Status |
|------|-----------|-------------|----------|-----|--------|
| **KindScript Website** | `~/dev/kindscript-website` | garrick0/kindscript-website | Vercel | kindscript.ai (or preview) | ✅ Primary site |
| **Old Website** | `~/dev/kindscript/website/` | N/A (subdirectory) | Vercel | website-five-theta-38.vercel.app | ⚠️ Redundant, still deployed |
| **Induction Studio** | `~/dev/kindscript/targets/induction-studio/` | garrick0/kindscript | Netlify | studio.induction.systems | ✅ Active (separate product) |

**Note:** Workflows reference `samuelgleeson` org but local remotes point to `garrick0` org.

---

## Quick Action Checklist

**Phase 0 (Decision Required - FIRST):**
- [ ] **Decide:** Use `garrick0` or `samuelgleeson` GitHub organization as canonical
- [ ] Update either local remotes OR workflow URLs to match chosen org

**Phase 1 (Immediate - Zero Risk):**
- [ ] Remove 3 unused vercel.json files in `targets/induction-studio/`
- [ ] Disable `deploy-website.yml` workflow (add deprecation notice)
- [ ] Commit changes

**Phase 2 (Optional):**
- [ ] Decide: Integrate notebook docs into website or keep separate
- [ ] If integrating: Update fetch-docs.sh and website routes

**Phase 3 (After Website Verification - Low Risk):**
- [ ] Verify kindscript.ai is live and working
- [ ] Verify all docs are accessible
- [ ] Verify tutorial works (WebContainer + Monaco)
- [ ] Remove `~/dev/kindscript/website/` directory (saves ~1400+ files)
- [ ] Update any stale references in README/docs

**Phase 4 (Optional - Nice to Have):**
- [ ] Rename `~/dev/ks-agent` to `~/dev/ontology-notebooks` (matches repo name)
- [ ] Add diagram to main README showing repo relationships
- [ ] Document the garrick0 vs samuelgleeson org decision

---

---

## Key Findings Summary

### ✅ What's Working

1. **Trigger workflow** correctly dispatches to kindscript-website on docs changes
2. **fetch-docs.sh** correctly clones KindScript docs and Agent docs at build time
3. **Induction Studio** correctly deploys to Netlify (not Vercel)
4. **Primary website** (kindscript-website) is set up correctly

### ⚠️ Issues Found

1. **GitHub org mismatch:** Local uses `garrick0`, workflows use `samuelgleeson`
2. **Old website still deployed:** `website/` directory redundant but deploy-website.yml is still active
3. **3 unused Vercel configs:** All in targets/induction-studio, misleading
4. **Doc inaccuracy:** Previous version claimed notebook has trigger workflow (it doesn't)

### 📊 Statistics

- **Redundant files to remove:** ~1400+ files (entire website/ directory)
- **Redundant docs to remove:** 19 .md files, ~4800 lines
- **Unused configs to remove:** 4 vercel.json files (3 in targets, 1 in website)
- **Workflows to disable:** 1 (deploy-website.yml)

---

---

## ✅ CONSOLIDATION COMPLETED (2026-02-12)

**The websites have been consolidated!**

- ✅ **Kept:** `~/dev/kindscript/website/` (canonical, has all 21 lessons + tests)
- ❌ **Removed:** `~/dev/kindscript-website/` (was a redundant copy)
- ✅ **Updated:** Deploy workflow now triggers on push to `website/`, `docs/`, or `src/types/`
- ✅ **Updated:** CLAUDE.md to reflect single-repo structure
- ✅ **Removed:** Cross-repo trigger workflow (no longer needed)

**Website now lives at:** `~/dev/kindscript/website/`
- All 21 tutorial lessons included
- Full test suite (76 tests, all passing)
- Working Tailwind CSS
- No fetch-docs.sh needed (docs in same repo)

**Deployment:** `.github/workflows/deploy-website.yml` deploys to Vercel automatically

---

**Document Version:** 3.0 (POST-CONSOLIDATION)
**Last Updated:** 2026-02-12
**Investigation Date:** 2026-02-12
**Consolidation Date:** 2026-02-12
**Status:** ✅ Consolidation Complete
**Maintained By:** Development Team

