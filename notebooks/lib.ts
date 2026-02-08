/**
 * Shared utilities for KindScript Jupyter notebooks.
 *
 * Usage (in any notebook cell):
 *   import { ksc, tree, copyFixture, writeFile, readFile, cleanup } from './lib.ts';
 */

// ─── Path resolution ───
// The Deno Jupyter kernel's cwd may be notebooks/ or the project root.
export const PROJECT_ROOT = Deno.cwd().replace(/\/notebooks$/, "");
export const KSC = PROJECT_ROOT + "/dist/infrastructure/cli/main.js";

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
 * Definition files are auto-discovered by `.k.ts` extension — no `kindscript.json` needed.
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
