#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storybookDir = path.join(__dirname, '../tutorial-assets/storybook');

// File extensions to include
const ALLOWED_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.md',
  '.html', '.yml', '.yaml', '.config.ts', '.config.js'
];

// Directories to exclude
const EXCLUDED_DIRS = [
  'node_modules',
  '.git',
  '.turbo',
  '.vercel',
  'storybook-static',
  'test-results',
  'backup',
  '.cache'
];

// Files to exclude
const EXCLUDED_FILES = [
  '.eslintcache',
  '.DS_Store'
];

/**
 * Recursively read all files from a directory
 */
function readFilesRecursively(dir, baseDir = dir) {
  const files = [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      // Skip excluded directories
      if (EXCLUDED_DIRS.includes(entry.name)) {
        continue;
      }

      // Recursively read subdirectory
      files.push(...readFilesRecursively(fullPath, baseDir));
    } else {
      // Skip excluded files
      if (EXCLUDED_FILES.includes(entry.name)) {
        continue;
      }

      // Check if file extension is allowed
      const ext = path.extname(entry.name);
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        continue;
      }

      // Read file contents
      try {
        const contents = fs.readFileSync(fullPath, 'utf-8');
        files.push({
          path: relativePath,
          contents: contents
        });
      } catch (err) {
        console.warn(`⚠️  Could not read ${relativePath}: ${err.message}`);
      }
    }
  }

  return files;
}

/**
 * Generate the files array for a lesson
 */
export function loadStorybookFiles() {
  console.log('📁 Reading storybook files from:', storybookDir);

  const files = readFilesRecursively(storybookDir);

  console.log(`✅ Loaded ${files.length} files`);

  // Group by directory for summary
  const byDir = files.reduce((acc, f) => {
    const dir = path.dirname(f.path);
    acc[dir] = (acc[dir] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📊 Files by directory:');
  Object.entries(byDir)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([dir, count]) => {
      console.log(`   ${dir}: ${count} files`);
    });

  return files;
}

// If run directly, output to JSON
if (import.meta.url === `file://${process.argv[1]}`) {
  const files = loadStorybookFiles();

  // Write to a JSON file for inspection
  const outputPath = path.join(__dirname, '../tutorial-assets/storybook-files.json');
  fs.writeFileSync(outputPath, JSON.stringify(files, null, 2), 'utf-8');

  console.log(`\n💾 Saved to: ${outputPath}`);
  console.log(`\n📦 Total size: ${(JSON.stringify(files).length / 1024 / 1024).toFixed(2)} MB`);
}
