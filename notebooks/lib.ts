/**
 * Shared utilities for KindScript Jupyter notebooks.
 *
 * Usage (in any notebook cell):
 *   import { ksc, tree, copyFixture, writeFile, readFile, cleanup } from './lib.ts';
 */

// ─── Path resolution ───
// The Deno Jupyter kernel's cwd may be notebooks/ or the project root.
export const PROJECT_ROOT = Deno.cwd().replace(/\/notebooks$/, "");
export const KSC = PROJECT_ROOT + "/dist/apps/cli/main.js";

// ─── CLI helper ───

/** Run `ksc` as a subprocess. Prints combined output + exit code, returns both. */
export async function ksc(
  ...args: string[]
): Promise<{ code: number; output: string }> {
  const cmd = new Deno.Command("node", {
    args: [KSC, ...args],
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stdout, stderr } = await cmd.output();
  const output = (
    new TextDecoder().decode(stdout) + new TextDecoder().decode(stderr)
  ).trim();
  if (output) console.log(output);
  console.log(`\nExit code: ${code}`);
  return { code, output };
}

// ─── Filesystem helpers ───

/** List files in a directory (like the `tree` command). Excludes node_modules/ and dist/. */
export async function tree(dir: string): Promise<void> {
  const cmd = new Deno.Command("find", {
    args: [dir, "-type", "f", "-not", "-path", "*/node_modules/*", "-not", "-path", "*/dist/*"],
    stdout: "piped",
  });
  const { stdout } = await cmd.output();
  const files = new TextDecoder()
    .decode(stdout)
    .trim()
    .split("\n")
    .map((f) => f.replace(dir + "/", ""))
    .sort();
  console.log(files.join("\n"));
}

/** Copy a directory recursively. */
export function copyDir(src: string, dest: string): void {
  Deno.mkdirSync(dest, { recursive: true });
  for (const entry of Deno.readDirSync(src)) {
    const s = `${src}/${entry.name}`;
    const d = `${dest}/${entry.name}`;
    if (entry.isDirectory) {
      copyDir(s, d);
    } else {
      Deno.copyFileSync(s, d);
    }
  }
}

/**
 * Copy a fixture from `notebooks/examples/<name>/` into a temp directory.
 *
 * Automatically:
 * - Creates the temp dir
 * - Copies all fixture files
 * - Creates `node_modules/kindscript` symlink so `import type { ... } from 'kindscript'` works
 *
 * Returns the temp directory path.
 */
export function copyFixture(name: string): string {
  const fixtureSrc = `${PROJECT_ROOT}/notebooks/examples/${name}`;
  const tmp = Deno.makeTempDirSync({ prefix: `ksc-${name}-` });

  copyDir(fixtureSrc, tmp);

  // Symlink so `import type { ... } from 'kindscript'` resolves
  Deno.mkdirSync(`${tmp}/node_modules`, { recursive: true });
  Deno.symlinkSync(PROJECT_ROOT, `${tmp}/node_modules/kindscript`);

  return tmp;
}

/** Write a file, creating parent directories as needed. Content is trimStart()'d. */
export function writeFile(base: string, relativePath: string, content: string): void {
  const fullPath = `${base}/${relativePath}`;
  const dir = fullPath.replace(/\/[^/]+$/, "");
  Deno.mkdirSync(dir, { recursive: true });
  Deno.writeTextFileSync(fullPath, content.trimStart());
}

/** Read a file and return its contents. */
export function readFile(base: string, relativePath: string): string {
  return Deno.readTextFileSync(`${base}/${relativePath}`);
}

/** Remove a directory recursively. */
export function cleanup(dir: string): void {
  Deno.removeSync(dir, { recursive: true });
}

// ─── Target codebase loading ───

const TARGET_REPO = "git@github.com:inductionAI/studio.git";
const TARGET_SHA = "fd8a0ebc8a167f93abf61bfd3483129b07c61245";
const TARGET_DIR = PROJECT_ROOT + "/targets/induction-studio";
const STORYBOOK_SRC = TARGET_DIR + "/apps/storybook/src";

/**
 * Ensure the target codebase is cloned at the pinned SHA.
 * Idempotent: skips clone if already present and at the correct SHA.
 */
export async function ensureTarget(): Promise<void> {
  try {
    Deno.statSync(TARGET_DIR + "/.git");
    // Verify we're at the right SHA
    const rev = new Deno.Command("git", {
      args: ["-C", TARGET_DIR, "rev-parse", "HEAD"],
      stdout: "piped", stderr: "piped",
    });
    const { stdout } = await rev.output();
    const sha = new TextDecoder().decode(stdout).trim();
    if (sha === TARGET_SHA) return;
    // Wrong SHA — re-checkout
    const checkout = new Deno.Command("git", {
      args: ["-C", TARGET_DIR, "checkout", TARGET_SHA],
      stdout: "piped", stderr: "piped",
    });
    await checkout.output();
    return;
  } catch { /* not cloned yet */ }

  console.log("Cloning target codebase (one-time setup)...");
  Deno.mkdirSync(TARGET_DIR, { recursive: true });
  const clone = new Deno.Command("git", {
    args: ["clone", "--no-checkout", TARGET_REPO, TARGET_DIR],
    stdout: "piped", stderr: "piped",
  });
  const cloneResult = await clone.output();
  if (cloneResult.code !== 0) {
    const err = new TextDecoder().decode(cloneResult.stderr);
    throw new Error(`git clone failed: ${err}`);
  }
  const checkout = new Deno.Command("git", {
    args: ["-C", TARGET_DIR, "checkout", TARGET_SHA],
    stdout: "piped", stderr: "piped",
  });
  const checkoutResult = await checkout.output();
  if (checkoutResult.code !== 0) {
    const err = new TextDecoder().decode(checkoutResult.stderr);
    throw new Error(`git checkout failed: ${err}`);
  }
  console.log("Target codebase ready.");
}

/**
 * Copy the storybook src/ into a fresh temp directory for a notebook run.
 * Adds node_modules/kindscript symlink and a minimal tsconfig.json.
 * Returns the temp directory path (the "project root" for ksc check).
 */
export async function loadStorybook(): Promise<string> {
  await ensureTarget();

  const tmp = Deno.makeTempDirSync({ prefix: "ksc-storybook-" });
  copyDir(STORYBOOK_SRC, tmp + "/src");

  // tsconfig.json — minimal config so TypeScript can resolve imports
  writeFile(tmp, "tsconfig.json", `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/utils/*": ["src/utils/*"],
      "@/styles/*": ["src/styles/*"]
    }
  },
  "include": ["src"]
}
`);

  // Symlink so `import type { ... } from 'kindscript'` resolves
  Deno.mkdirSync(`${tmp}/node_modules`, { recursive: true });
  Deno.symlinkSync(PROJECT_ROOT, `${tmp}/node_modules/kindscript`);

  return tmp;
}
