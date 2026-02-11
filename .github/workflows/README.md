# GitHub Actions Workflows

## Deploy Website to Vercel

Manual workflow to deploy the KindScript documentation website to Vercel.

### Setup (One-time)

#### 1. Get Vercel Credentials

The following credentials are already configured in `.vercel/project.json`:
- **VERCEL_ORG_ID:** `team_ejF7ixE5qEz0KpU23ezXlAsd`
- **VERCEL_PROJECT_ID:** `prj_aTDCrSV2cR0IKpiqNvLDFmgz2z4O`

You need to get a Vercel token:
1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Name it "GitHub Actions" (or similar)
4. Copy the token (starts with a long string)

#### 2. Add Secrets to GitHub

1. Go to: `https://github.com/<your-username>/kindscript/settings/secrets/actions`
2. Click "New repository secret" for each:

   **VERCEL_TOKEN**
   - Name: `VERCEL_TOKEN`
   - Value: Your Vercel token from step 1

   **VERCEL_ORG_ID**
   - Name: `VERCEL_ORG_ID`
   - Value: `team_ejF7ixE5qEz0KpU23ezXlAsd`

   **VERCEL_PROJECT_ID**
   - Name: `VERCEL_PROJECT_ID`
   - Value: `prj_aTDCrSV2cR0IKpiqNvLDFmgz2z4O`

### Usage

#### Deploy to Production

1. Go to Actions tab
2. Select "Deploy Website to Vercel" workflow
3. Click "Run workflow"
4. Select environment: `production` (default)
5. Click "Run workflow"

This will:
- ✅ Build the Next.js website
- ✅ Deploy to Vercel production
- ✅ Show deployment URL in workflow summary

#### Deploy to Preview

1. Go to Actions tab
2. Click "Run workflow"
3. Select environment: `preview`
4. Click "Run workflow"

This deploys to a preview URL (useful for testing before production).

### Troubleshooting

**Error: Deployment not found**
- Verify `VERCEL_PROJECT_ID` matches `.vercel/project.json`
- Check that the token has access to the organization

**Error: 401 Unauthorized**
- Verify `VERCEL_TOKEN` is set correctly
- Check token hasn't expired
- Ensure token has appropriate permissions

**Build fails on Vercel**
- Check the workflow logs for detailed error messages
- Ensure all dependencies are in `package.json`
- Test build locally: `cd website && npm run build`

---

## Publish to NPM

Manual workflow to publish KindScript to npm.

### Setup (One-time)

#### 1. Create NPM Access Token

```bash
# Login to npm
npm login

# Create automation token (recommended for CI/CD)
# Go to: https://www.npmjs.com/settings/<your-username>/tokens
# Click "Generate New Token" → "Automation"
# Copy the token (starts with npm_...)
```

Or via CLI:
```bash
npm token create --type automation
```

#### 2. Add Token to GitHub Secrets

1. Go to your repo: `https://github.com/garrick0/kindscript/settings/secrets/actions`
2. Click "New repository secret"
3. Name: `NPM_TOKEN`
4. Value: Paste your npm token
5. Click "Add secret"

### Usage

#### Option 1: Publish Current Version

1. Go to Actions tab: `https://github.com/garrick0/kindscript/actions`
2. Select "Publish to NPM" workflow
3. Click "Run workflow"
4. Leave "version" empty (uses current package.json version)
5. Set tag: `latest` (default)
6. Click "Run workflow"

This will:
- ✅ Run tests
- ✅ Run linter
- ✅ Build the project
- ✅ Publish to npm
- ✅ Create GitHub Release

#### Option 2: Bump Version and Publish

1. Go to Actions tab
2. Click "Run workflow"
3. Enter version: `1.0.1` (or `1.1.0`, `2.0.0`, etc.)
4. Set tag: `latest`
5. Click "Run workflow"

This will:
- ✅ Update package.json version
- ✅ Run tests
- ✅ Build
- ✅ Publish to npm
- ✅ Commit version bump
- ✅ Create git tag
- ✅ Push to GitHub
- ✅ Create GitHub Release

#### Option 3: Dry Run (Test Without Publishing)

1. Go to Actions tab
2. Click "Run workflow"
3. Check "Dry run" checkbox
4. Click "Run workflow"

This will:
- ✅ Run tests
- ✅ Build
- ✅ Show what would be published
- ❌ NOT publish to npm

### Publishing Beta/Next Versions

For pre-release versions:

```bash
# Locally bump to beta version
npm version 1.1.0-beta.0

# Commit and push
git push && git push --tags
```

Then in GitHub Actions:
- Version: (leave empty, uses 1.1.0-beta.0)
- Tag: `beta`

Users install with:
```bash
npm install kindscript@beta
```

### Workflow Inputs

| Input | Description | Default | Example |
|-------|-------------|---------|---------|
| `version` | Version to publish | (current) | `1.0.1`, `1.1.0`, `2.0.0-beta.1` |
| `tag` | NPM dist-tag | `latest` | `beta`, `next`, `canary` |
| `dry-run` | Test without publishing | `false` | `true` |

### NPM Dist Tags

| Tag | Purpose | Example |
|-----|---------|---------|
| `latest` | Stable releases | `1.0.0`, `1.0.1` |
| `beta` | Beta releases | `1.1.0-beta.0` |
| `next` | Next major version | `2.0.0-rc.1` |
| `canary` | Bleeding edge | `1.0.1-canary.abc123` |

### Troubleshooting

**Error: 401 Unauthorized**
- Check `NPM_TOKEN` secret is set correctly
- Verify token hasn't expired
- Ensure token has "Automation" or "Publish" permissions

**Error: Version already exists**
- NPM doesn't allow re-publishing the same version
- Bump the version number
- Or use `npm unpublish kindscript@<version>` (within 72 hours)

**Tests failing**
- Workflow stops before publishing if tests fail
- Fix tests locally, commit, push, then re-run workflow

**Workflow not appearing**
- Push the workflow file to `main` branch first
- Refresh the Actions tab

### Security: NPM Provenance

This workflow uses `--provenance` flag, which:
- Links npm package to GitHub commit
- Provides supply chain transparency
- Requires `id-token: write` permission
- See: https://docs.npmjs.com/generating-provenance-statements

### Manual Publishing (Without GitHub Actions)

If you prefer manual publishing:

```bash
# Run checks
npm test
npm run lint
npm run build

# Bump version
npm version patch  # or minor, major

# Publish
npm publish

# Push
git push && git push --tags
```

The GitHub Action is just a convenient, auditable way to do the same thing.
