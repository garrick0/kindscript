import { describe, test, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync, symlinkSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { lessons } from '@/lib/lessons';
import type { LessonFile } from '@/lib/lessons/types';

// Path to KindScript CLI from parent directory
const KSC_CLI = join(__dirname, '../../../dist/apps/cli/main.js');
const PARENT_NODE_MODULES = join(__dirname, '../../../node_modules');

// Shared temp directory for all tests
const SHARED_TEMP_DIR = join(tmpdir(), `ksc-test-shared-${Date.now()}`);

// Setup shared node_modules symlink once for all tests
beforeAll(() => {
  mkdirSync(SHARED_TEMP_DIR, { recursive: true });

  // Create symlink to parent node_modules
  const nodeModulesLink = join(SHARED_TEMP_DIR, 'node_modules');
  if (!existsSync(nodeModulesLink)) {
    symlinkSync(PARENT_NODE_MODULES, nodeModulesLink, 'dir');
  }
});

/**
 * Normalize temp directory paths for stable snapshots
 */
function normalizePaths(output: string, tempDir: string): string {
  // Replace the full temp directory path with a stable placeholder
  return output.replace(new RegExp(tempDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '/test-dir');
}

/**
 * Helper to run KindScript check on a set of lesson files
 */
function runKindScriptCheck(files: LessonFile[], testId: string): string {
  const tempDir = join(SHARED_TEMP_DIR, `test-${testId}`);

  try {
    // Write all lesson files to temp directory
    files.forEach(file => {
      const fullPath = join(tempDir, file.path);
      mkdirSync(dirname(fullPath), { recursive: true });
      writeFileSync(fullPath, file.contents, 'utf-8');
    });

    // Write minimal package.json
    writeFileSync(
      join(tempDir, 'package.json'),
      JSON.stringify({
        name: 'test-lesson',
        type: 'module',
        dependencies: {
          kindscript: '*',
        },
      }),
      'utf-8'
    );

    // Write minimal tsconfig.json
    writeFileSync(
      join(tempDir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          module: 'ESNext',
          moduleResolution: 'bundler',
          strict: true,
          skipLibCheck: true,
        },
        include: ['src/**/*'],
      }),
      'utf-8'
    );

    // Symlink to shared node_modules
    const nodeModulesLink = join(tempDir, 'node_modules');
    if (!existsSync(nodeModulesLink)) {
      symlinkSync(join(SHARED_TEMP_DIR, 'node_modules'), nodeModulesLink, 'dir');
    }

    // Run ksc check
    const output = execSync(`node ${KSC_CLI} check .`, {
      cwd: tempDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Normalize temp directory paths for stable snapshots
    return normalizePaths(output.trim(), tempDir);
  } catch (error: any) {
    // execSync throws on non-zero exit code, but we still want the output
    const output = error.stdout?.trim() || error.message;
    return normalizePaths(output, tempDir);
  } finally {
    // Cleanup temp directory
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

describe('Lesson CLI Output Snapshots', () => {
  describe('Part 1: noDependency', () => {
    test('Lesson 1-1 (hello-kindscript): starter - clean', () => {
      const lesson = lessons.find(l => l.slug === '1-1-hello-kindscript')!;
      const output = runKindScriptCheck(lesson.files, '1-1-starter');

      expect(output).toContain('All architectural contracts satisfied');
      expect(output).toMatchSnapshot();
    });

    test('Lesson 1-1 (hello-kindscript): solution - clean', () => {
      const lesson = lessons.find(l => l.slug === '1-1-hello-kindscript')!;
      const output = runKindScriptCheck(lesson.solution, '1-1-solution');

      expect(output).toContain('All architectural contracts satisfied');
      expect(output).toMatchSnapshot();
    });

    test('Lesson 1-2 (catching-violations): starter - violation', () => {
      const lesson = lessons.find(l => l.slug === '1-2-catching-violations')!;
      const output = runKindScriptCheck(lesson.files, '1-2-starter');

      expect(output).toContain('KS70001'); // noDependency violation
      expect(output).toContain('1 architectural violation');
      expect(output).toMatchSnapshot();
    });

    test('Lesson 1-2 (catching-violations): solution - clean', () => {
      const lesson = lessons.find(l => l.slug === '1-2-catching-violations')!;
      const output = runKindScriptCheck(lesson.solution, '1-2-solution');

      expect(output).toContain('All architectural contracts satisfied');
      expect(output).toMatchSnapshot();
    });

    test('Lesson 1-3 (fix-the-violation): starter - violation', () => {
      const lesson = lessons.find(l => l.slug === '1-3-fix-the-violation')!;
      const output = runKindScriptCheck(lesson.files, '1-3-starter');

      expect(output).toContain('KS70001');
      expect(output).toMatchSnapshot();
    });

    test('Lesson 1-3 (fix-the-violation): solution - clean', () => {
      const lesson = lessons.find(l => l.slug === '1-3-fix-the-violation')!;
      const output = runKindScriptCheck(lesson.solution, '1-3-solution');

      expect(output).toContain('All architectural contracts satisfied');
      expect(output).toMatchSnapshot();
    });
  });

  describe('Part 2: purity', () => {
    test('Lesson 2-1 (pure-layers): starter - violation', () => {
      const lesson = lessons.find(l => l.slug === '2-1-pure-layers')!;
      const output = runKindScriptCheck(lesson.files, '2-1-starter');

      expect(output).toContain('KS70003'); // purity violation (intrinsic)
      expect(output).toMatchSnapshot();
    });

    test('Lesson 2-1 (pure-layers): solution - clean', () => {
      const lesson = lessons.find(l => l.slug === '2-1-pure-layers')!;
      const output = runKindScriptCheck(lesson.solution, '2-1-solution');

      // Solution fixes the violation using dependency injection
      expect(output).toContain('All architectural contracts satisfied');
      expect(output).toMatchSnapshot();
    });

    test('Lesson 2-2 (fix-purity): starter - violation', () => {
      const lesson = lessons.find(l => l.slug === '2-2-fix-purity')!;
      const output = runKindScriptCheck(lesson.files, '2-2-starter');

      expect(output).toContain('KS70003'); // purity violation
      expect(output).toMatchSnapshot();
    });

    test('Lesson 2-2 (fix-purity): solution - clean', () => {
      const lesson = lessons.find(l => l.slug === '2-2-fix-purity')!;
      const output = runKindScriptCheck(lesson.solution, '2-2-solution');

      expect(output).toContain('All architectural contracts satisfied');
      expect(output).toMatchSnapshot();
    });
  });

  describe('Part 3: noCycles', () => {
    test('Lesson 3-1 (detecting-cycles): starter - violation', () => {
      const lesson = lessons.find(l => l.slug === '3-1-detecting-cycles')!;
      const output = runKindScriptCheck(lesson.files, '3-1-starter');

      expect(output).toContain('KS70004'); // noCycles violation (intrinsic)
      expect(output).toMatchSnapshot();
    });

    test('Lesson 3-1 (detecting-cycles): solution - clean', () => {
      const lesson = lessons.find(l => l.slug === '3-1-detecting-cycles')!;
      const output = runKindScriptCheck(lesson.solution, '3-1-solution');

      // Solution breaks the cycle
      expect(output).toContain('All architectural contracts satisfied');
      expect(output).toMatchSnapshot();
    });

    test('Lesson 3-2 (break-the-cycle): starter - violation', () => {
      const lesson = lessons.find(l => l.slug === '3-2-break-the-cycle')!;
      const output = runKindScriptCheck(lesson.files, '3-2-starter');

      expect(output).toContain('KS70004'); // noCycles violation
      expect(output).toMatchSnapshot();
    });

    test('Lesson 3-2 (break-the-cycle): solution - clean', () => {
      const lesson = lessons.find(l => l.slug === '3-2-break-the-cycle')!;
      const output = runKindScriptCheck(lesson.solution, '3-2-solution');

      expect(output).toContain('All architectural contracts satisfied');
      expect(output).toMatchSnapshot();
    });
  });

  describe('Part 4: Design System (Atoms)', () => {
    test('Lesson 4-1 (atom-source): starter - no contracts', () => {
      const lesson = lessons.find(l => l.slug === '4-1-atom-source')!;
      const output = runKindScriptCheck(lesson.files, '4-1-starter');

      // Teaching Kind syntax, no constraints yet
      expect(output).toContain('No contracts found');
      expect(output).toMatchSnapshot();
    });

    test('Lesson 4-1 (atom-source): solution - no contracts', () => {
      const lesson = lessons.find(l => l.slug === '4-1-atom-source')!;
      const output = runKindScriptCheck(lesson.solution, '4-1-solution');

      expect(output).toContain('No contracts found');
      expect(output).toMatchSnapshot();
    });

    test('Lesson 4-2 (atom-story): starter - clean', () => {
      const lesson = lessons.find(l => l.slug === '4-2-atom-story')!;
      const output = runKindScriptCheck(lesson.files, '4-2-starter');

      // Has auto-generated contracts (overlap/exhaustiveness)
      expect(output).toContain('All architectural contracts satisfied');
      expect(output).toMatchSnapshot();
    });

    test('Lesson 4-2 (atom-story): solution - clean', () => {
      const lesson = lessons.find(l => l.slug === '4-2-atom-story')!;
      const output = runKindScriptCheck(lesson.solution, '4-2-solution');

      expect(output).toContain('All architectural contracts satisfied');
      expect(output).toMatchSnapshot();
    });

    test('Lesson 4-3 (atom-version): starter - clean', () => {
      const lesson = lessons.find(l => l.slug === '4-3-atom-version')!;
      const output = runKindScriptCheck(lesson.files, '4-3-starter');

      expect(output).toContain('All architectural contracts satisfied');
      expect(output).toMatchSnapshot();
    });

    test('Lesson 4-3 (atom-version): solution - clean', () => {
      const lesson = lessons.find(l => l.slug === '4-3-atom-version')!;
      const output = runKindScriptCheck(lesson.solution, '4-3-solution');

      expect(output).toContain('All architectural contracts satisfied');
      expect(output).toMatchSnapshot();
    });

    test('Lesson 4-4 (full-atom): starter - no contracts', () => {
      const lesson = lessons.find(l => l.slug === '4-4-full-atom')!;
      const output = runKindScriptCheck(lesson.files, '4-4-starter');

      expect(output).toContain('No contracts found');
      expect(output).toMatchSnapshot();
    });

    test('Lesson 4-4 (full-atom): solution - no contracts', () => {
      const lesson = lessons.find(l => l.slug === '4-4-full-atom')!;
      const output = runKindScriptCheck(lesson.solution, '4-4-solution');

      expect(output).toContain('No contracts found');
      expect(output).toMatchSnapshot();
    });
  });

  describe('Part 5: Design System (Molecules)', () => {
    test('Lesson 5-1 (molecule-source): starter - no contracts', () => {
      const lesson = lessons.find(l => l.slug === '5-1-molecule-source')!;
      const output = runKindScriptCheck(lesson.files, '5-1-starter');

      expect(output).toContain('No contracts found');
      expect(output).toMatchSnapshot();
    });

    test('Lesson 5-1 (molecule-source): solution - no contracts', () => {
      const lesson = lessons.find(l => l.slug === '5-1-molecule-source')!;
      const output = runKindScriptCheck(lesson.solution, '5-1-solution');

      expect(output).toContain('No contracts found');
      expect(output).toMatchSnapshot();
    });

    test('Lesson 5-2 (molecule-story): starter - clean', () => {
      const lesson = lessons.find(l => l.slug === '5-2-molecule-story')!;
      const output = runKindScriptCheck(lesson.files, '5-2-starter');

      expect(output).toContain('All architectural contracts satisfied');
      expect(output).toMatchSnapshot();
    });

    test('Lesson 5-2 (molecule-story): solution - clean', () => {
      const lesson = lessons.find(l => l.slug === '5-2-molecule-story')!;
      const output = runKindScriptCheck(lesson.solution, '5-2-solution');

      expect(output).toContain('All architectural contracts satisfied');
      expect(output).toMatchSnapshot();
    });

    test('Lesson 5-3 (molecule-version): starter - clean', () => {
      const lesson = lessons.find(l => l.slug === '5-3-molecule-version')!;
      const output = runKindScriptCheck(lesson.files, '5-3-starter');

      expect(output).toContain('All architectural contracts satisfied');
      expect(output).toMatchSnapshot();
    });

    test('Lesson 5-3 (molecule-version): solution - clean', () => {
      const lesson = lessons.find(l => l.slug === '5-3-molecule-version')!;
      const output = runKindScriptCheck(lesson.solution, '5-3-solution');

      expect(output).toContain('All architectural contracts satisfied');
      expect(output).toMatchSnapshot();
    });

    test('Lesson 5-4 (full-molecule): starter - no contracts', () => {
      const lesson = lessons.find(l => l.slug === '5-4-full-molecule')!;
      const output = runKindScriptCheck(lesson.files, '5-4-starter');

      expect(output).toContain('No contracts found');
      expect(output).toMatchSnapshot();
    });

    test('Lesson 5-4 (full-molecule): solution - no contracts', () => {
      const lesson = lessons.find(l => l.slug === '5-4-full-molecule')!;
      const output = runKindScriptCheck(lesson.solution, '5-4-solution');

      expect(output).toContain('No contracts found');
      expect(output).toMatchSnapshot();
    });
  });

  describe('Part 6: Wrapped Kinds', () => {
    test('Lesson 6-1 (wrapped-kinds): starter - clean', () => {
      const lesson = lessons.find(l => l.slug === '6-1-wrapped-kinds')!;
      const output = runKindScriptCheck(lesson.files, '6-1-starter');

      expect(output).toContain('All architectural contracts satisfied');
      expect(output).toMatchSnapshot();
    });

    test('Lesson 6-1 (wrapped-kinds): solution - clean', () => {
      const lesson = lessons.find(l => l.slug === '6-1-wrapped-kinds')!;
      const output = runKindScriptCheck(lesson.solution, '6-1-solution');

      expect(output).toContain('All architectural contracts satisfied');
      expect(output).toMatchSnapshot();
    });

    test('Lesson 6-2 (tagged-purity): starter - violation', () => {
      const lesson = lessons.find(l => l.slug === '6-2-tagged-purity')!;
      const output = runKindScriptCheck(lesson.files, '6-2-starter');

      expect(output).toContain('KS70003'); // purity violation on tagged export
      expect(output).toMatchSnapshot();
    });

    test('Lesson 6-2 (tagged-purity): solution - clean', () => {
      const lesson = lessons.find(l => l.slug === '6-2-tagged-purity')!;
      const output = runKindScriptCheck(lesson.solution, '6-2-solution');

      expect(output).toContain('All architectural contracts satisfied');
      expect(output).toMatchSnapshot();
    });

    test('Lesson 6-3 (tagged-boundaries): starter - violation', () => {
      const lesson = lessons.find(l => l.slug === '6-3-tagged-boundaries')!;
      const output = runKindScriptCheck(lesson.files, '6-3-starter');

      expect(output).toContain('KS70001'); // noDependency violation between tagged exports
      expect(output).toMatchSnapshot();
    });

    test('Lesson 6-3 (tagged-boundaries): solution - clean', () => {
      const lesson = lessons.find(l => l.slug === '6-3-tagged-boundaries')!;
      const output = runKindScriptCheck(lesson.solution, '6-3-solution');

      expect(output).toContain('All architectural contracts satisfied');
      expect(output).toMatchSnapshot();
    });
  });

  describe('Part 7: Scaling Your Architecture', () => {
    test('Lesson 7-1 (bounded-contexts): starter - violation', () => {
      const lesson = lessons.find(l => l.slug === '7-1-bounded-contexts')!;
      const output = runKindScriptCheck(lesson.files, '7-1-starter');

      expect(output).toContain('KS70001'); // noDependency violation in billing context
      expect(output).toMatchSnapshot();
    });

    test('Lesson 7-1 (bounded-contexts): solution - clean', () => {
      const lesson = lessons.find(l => l.slug === '7-1-bounded-contexts')!;
      const output = runKindScriptCheck(lesson.solution, '7-1-solution');

      expect(output).toContain('All architectural contracts satisfied');
      expect(output).toMatchSnapshot();
    });

    test('Lesson 7-2 (exhaustive-enforcement): starter - violation', () => {
      const lesson = lessons.find(l => l.slug === '7-2-exhaustive-enforcement')!;
      const output = runKindScriptCheck(lesson.files, '7-2-starter');

      expect(output).toContain('KS70007'); // exhaustiveness violation
      expect(output).toMatchSnapshot();
    });

    test('Lesson 7-2 (exhaustive-enforcement): solution - clean', () => {
      const lesson = lessons.find(l => l.slug === '7-2-exhaustive-enforcement')!;
      const output = runKindScriptCheck(lesson.solution, '7-2-solution');

      expect(output).toContain('All architectural contracts satisfied');
      expect(output).toMatchSnapshot();
    });
  });

  describe('Part 8: Real-World Capstone', () => {
    test('Lesson 8-1 (full-stack-architecture): starter - violations', () => {
      const lesson = lessons.find(l => l.slug === '8-1-full-stack-architecture')!;
      const output = runKindScriptCheck(lesson.files, '8-1-starter');

      expect(output).toContain('KS70001'); // noDependency violation
      expect(output).toContain('KS70003'); // purity violation on tagged export
      expect(output).toMatchSnapshot();
    });

    test('Lesson 8-1 (full-stack-architecture): solution - clean', () => {
      const lesson = lessons.find(l => l.slug === '8-1-full-stack-architecture')!;
      const output = runKindScriptCheck(lesson.solution, '8-1-solution');

      expect(output).toContain('All architectural contracts satisfied');
      expect(output).toMatchSnapshot();
    });
  });
});
