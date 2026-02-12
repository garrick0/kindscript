#!/usr/bin/env node

/**
 * Sync agent docs from ks-agent repository for local development.
 *
 * In CI, this happens via multi-repo checkout in the deploy workflow.
 * For local dev, run this script to fetch the latest agent docs.
 *
 * Usage:
 *   npm run sync:agent-docs
 *   # or directly:
 *   node scripts/sync-agent-docs-local.mjs
 */

import { mkdir, writeFile, readdir, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEBSITE_ROOT = join(__dirname, '..');
const AGENT_DOCS_DIR = join(WEBSITE_ROOT, 'content', 'agent-docs');

const GITHUB_API = 'https://api.github.com';
const GITHUB_RAW = 'https://raw.githubusercontent.com';
const REPO = 'garrick0/ontology-notebooks';
const BRANCH = 'main';
const DOCS_PATH = 'docs';

function getAuthHeaders() {
  // Try to get GitHub token from environment or gh CLI
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) {
    return { Authorization: `token ${token}` };
  }
  return {};
}

async function fetchGitHubFile(path) {
  const url = `${GITHUB_RAW}/${REPO}/${BRANCH}/${path}`;
  const response = await fetch(url, { headers: getAuthHeaders() });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
  }

  return response.text();
}

async function fetchGitHubTree(path = '') {
  const url = `${GITHUB_API}/repos/${REPO}/contents/${DOCS_PATH}${path ? '/' + path : ''}?ref=${BRANCH}`;
  const response = await fetch(url, { headers: getAuthHeaders() });

  if (!response.ok) {
    throw new Error(`Failed to fetch tree for ${path}: ${response.statusText}`);
  }

  return response.json();
}

async function syncDirectory(sourcePath = '', targetPath = AGENT_DOCS_DIR) {
  console.log(`📂 Syncing ${sourcePath || 'root'}...`);

  const items = await fetchGitHubTree(sourcePath);

  // Ensure target directory exists
  await mkdir(targetPath, { recursive: true });

  for (const item of items) {
    const itemSourcePath = sourcePath ? `${sourcePath}/${item.name}` : item.name;
    const itemTargetPath = join(targetPath, item.name);

    if (item.type === 'dir') {
      // Recursively sync subdirectories
      await syncDirectory(itemSourcePath, itemTargetPath);
    } else if (item.type === 'file') {
      // Download and write file
      console.log(`  📄 ${itemSourcePath}`);
      const content = await fetchGitHubFile(`${DOCS_PATH}/${itemSourcePath}`);
      await writeFile(itemTargetPath, content, 'utf-8');
    }
  }
}

async function cleanAgentDocs() {
  console.log('🧹 Cleaning old agent docs...');
  try {
    await rm(AGENT_DOCS_DIR, { recursive: true, force: true });
  } catch (error) {
    // Directory might not exist, that's fine
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

async function main() {
  try {
    console.log('🔄 Syncing agent docs from ks-agent repository...\n');

    await cleanAgentDocs();
    await syncDirectory();

    console.log('\n✅ Agent docs synced successfully!');
    console.log(`📍 Location: ${AGENT_DOCS_DIR}`);
  } catch (error) {
    console.error('❌ Error syncing agent docs:', error.message);
    process.exit(1);
  }
}

main();
