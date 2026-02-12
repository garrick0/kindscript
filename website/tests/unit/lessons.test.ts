import { describe, test, expect } from 'vitest';
import { lessons, parts } from '@/lib/lessons';
import type { Lesson } from '@/lib/lessons/types';

describe('Lesson Data Validation', () => {
  describe('Required Fields', () => {
    test('All lessons have slug', () => {
      lessons.forEach(lesson => {
        expect(lesson.slug).toBeTruthy();
        expect(typeof lesson.slug).toBe('string');
      });
    });

    test('All lessons have title', () => {
      lessons.forEach(lesson => {
        expect(lesson.title).toBeTruthy();
        expect(typeof lesson.title).toBe('string');
      });
    });

    test('All lessons have partTitle', () => {
      lessons.forEach(lesson => {
        expect(lesson.partTitle).toBeTruthy();
        expect(typeof lesson.partTitle).toBe('string');
      });
    });

    test('All lessons have partNumber', () => {
      lessons.forEach(lesson => {
        expect(lesson.partNumber).toBeGreaterThan(0);
        expect(typeof lesson.partNumber).toBe('number');
      });
    });

    test('All lessons have lessonNumber', () => {
      lessons.forEach(lesson => {
        expect(lesson.lessonNumber).toBeGreaterThan(0);
        expect(typeof lesson.lessonNumber).toBe('number');
      });
    });

    test('All lessons have focus file', () => {
      lessons.forEach(lesson => {
        expect(lesson.focus).toBeTruthy();
        expect(typeof lesson.focus).toBe('string');
      });
    });

    test('All lessons have files array', () => {
      lessons.forEach(lesson => {
        expect(Array.isArray(lesson.files)).toBe(true);
        expect(lesson.files.length).toBeGreaterThan(0);
      });
    });

    test('All lessons have solution array', () => {
      lessons.forEach(lesson => {
        expect(Array.isArray(lesson.solution)).toBe(true);
        expect(lesson.solution.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Slug Format', () => {
    test('Slugs follow pattern: {part}-{lesson}-{name}', () => {
      lessons.forEach(lesson => {
        expect(lesson.slug).toMatch(/^\d+-\d+-[a-z-]+$/);
      });
    });

    test('No duplicate slugs', () => {
      const slugs = lessons.map(l => l.slug);
      const uniqueSlugs = new Set(slugs);
      expect(slugs.length).toBe(uniqueSlugs.size);
    });

    test('Slug matches part and lesson numbers', () => {
      lessons.forEach(lesson => {
        const [partNum, lessonNum] = lesson.slug.split('-').map(Number);
        expect(partNum).toBe(lesson.partNumber);
        expect(lessonNum).toBe(lesson.lessonNumber);
      });
    });
  });

  describe('File Paths', () => {
    test('All file paths start with src/', () => {
      lessons.forEach(lesson => {
        [...lesson.files, ...lesson.solution].forEach(file => {
          expect(file.path).toMatch(/^src\//);
        });
      });
    });

    test('All file paths have valid extensions', () => {
      const validExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];

      lessons.forEach(lesson => {
        [...lesson.files, ...lesson.solution].forEach(file => {
          const hasValidExt = validExtensions.some(ext => file.path.endsWith(ext));
          expect(hasValidExt).toBe(true);
        });
      });
    });

    test('No file paths contain ../', () => {
      lessons.forEach(lesson => {
        [...lesson.files, ...lesson.solution].forEach(file => {
          expect(file.path).not.toContain('../');
        });
      });
    });

    test('All files have contents', () => {
      lessons.forEach(lesson => {
        [...lesson.files, ...lesson.solution].forEach(file => {
          expect(file.contents).toBeTruthy();
          expect(typeof file.contents).toBe('string');
          expect(file.contents.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Focus File', () => {
    test('Focus file exists in files array', () => {
      lessons.forEach(lesson => {
        const focusExists = lesson.files.some(f => f.path === lesson.focus);
        expect(focusExists).toBe(true);
      });
    });
  });

  describe('Solution Completeness', () => {
    test('Solutions contain all files from starter', () => {
      lessons.forEach(lesson => {
        const starterPaths = lesson.files.map(f => f.path).sort();
        const solutionPaths = lesson.solution.map(f => f.path).sort();

        starterPaths.forEach(path => {
          expect(solutionPaths).toContain(path);
        });
      });
    });

    test('Solutions have same number of files as starter', () => {
      lessons.forEach(lesson => {
        expect(lesson.solution.length).toBe(lesson.files.length);
      });
    });
  });

  describe('Part Structure', () => {
    test('Parts array is correctly structured', () => {
      expect(parts.length).toBeGreaterThan(0);

      parts.forEach(part => {
        expect(part.number).toBeGreaterThan(0);
        expect(part.title).toBeTruthy();
        expect(Array.isArray(part.lessons)).toBe(true);
        expect(part.lessons.length).toBeGreaterThan(0);
      });
    });

    test('Part numbers are sequential', () => {
      const partNumbers = parts.map(p => p.number).sort((a, b) => a - b);

      partNumbers.forEach((num, index) => {
        expect(num).toBe(index + 1);
      });
    });

    test('All lessons belong to a part', () => {
      const lessonsInParts = parts.flatMap(p => p.lessons);

      expect(lessonsInParts.length).toBe(lessons.length);

      lessons.forEach(lesson => {
        const inPart = lessonsInParts.some(l => l.slug === lesson.slug);
        expect(inPart).toBe(true);
      });
    });
  });

  describe('Content Quality', () => {
    test('All lessons have context.ts file', () => {
      lessons.forEach(lesson => {
        const hasContext = lesson.files.some(f => f.path.endsWith('context.ts'));
        expect(hasContext).toBe(true);
      });
    });

    test('Context files contain Kind imports', () => {
      lessons.forEach(lesson => {
        const contextFile = lesson.files.find(f => f.path.endsWith('context.ts'));

        if (contextFile) {
          expect(contextFile.contents).toContain('import');
          expect(contextFile.contents).toContain('Kind');
        }
      });
    });

    test('Context files contain Instance', () => {
      lessons.forEach(lesson => {
        const contextFile = lesson.files.find(f => f.path.endsWith('context.ts'));

        if (contextFile) {
          expect(contextFile.contents).toContain('Instance');
        }
      });
    });
  });

  describe('Lesson Count', () => {
    test('Has expected number of lessons', () => {
      expect(lessons.length).toBe(21);
    });

    test('Has expected number of parts', () => {
      expect(parts.length).toBe(8);
    });

    test('Part 1 has 3 lessons (noDependency)', () => {
      const part1 = parts.find(p => p.number === 1);
      expect(part1?.lessons.length).toBe(3);
    });

    test('Part 2 has 2 lessons (purity)', () => {
      const part2 = parts.find(p => p.number === 2);
      expect(part2?.lessons.length).toBe(2);
    });

    test('Part 3 has 2 lessons (noCycles)', () => {
      const part3 = parts.find(p => p.number === 3);
      expect(part3?.lessons.length).toBe(2);
    });

    test('Part 4 has 4 lessons (Design System)', () => {
      const part4 = parts.find(p => p.number === 4);
      expect(part4?.lessons.length).toBe(4);
    });

    test('Part 5 has 4 lessons (Molecules)', () => {
      const part5 = parts.find(p => p.number === 5);
      expect(part5?.lessons.length).toBe(4);
    });

    test('Part 6 has 3 lessons (Wrapped Kinds)', () => {
      const part6 = parts.find(p => p.number === 6);
      expect(part6?.lessons.length).toBe(3);
    });

    test('Part 7 has 2 lessons (Scaling)', () => {
      const part7 = parts.find(p => p.number === 7);
      expect(part7?.lessons.length).toBe(2);
    });

    test('Part 8 has 1 lesson (Capstone)', () => {
      const part8 = parts.find(p => p.number === 8);
      expect(part8?.lessons.length).toBe(1);
    });
  });
});
