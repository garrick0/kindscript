#!/usr/bin/env bash
# sync-kindscript.sh
# Builds KindScript and copies dist/ into the tutorial template so that
# WebContainers can run `npx ksc check .` without network access.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TEMPLATE_PKG="$(cd "$(dirname "$0")/.." && pwd)/src/templates/default/kindscript"

echo "Building KindScript..."
(cd "$REPO_ROOT" && npm run build)

echo "Syncing dist/ into template..."
rm -rf "$TEMPLATE_PKG/dist"
mkdir -p "$TEMPLATE_PKG/dist"

# Copy compiled output, excluding source maps
rsync -a --exclude='*.map' "$REPO_ROOT/dist/" "$TEMPLATE_PKG/dist/"

# Create the kindscript package.json that the CLI resolves via
# require('../../../package.json') from dist/apps/cli/main.js
cat > "$TEMPLATE_PKG/package.json" <<'PKGJSON'
{
  "name": "kindscript",
  "version": "0.8.0-m8",
  "description": "Architectural enforcement for TypeScript",
  "main": "dist/types/index.js",
  "types": "dist/types/index.d.ts",
  "bin": {
    "ksc": "dist/apps/cli/main.js"
  }
}
PKGJSON

echo "Done. Template kindscript package ready at: $TEMPLATE_PKG"
