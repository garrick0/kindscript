#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tutorialRoot = path.join(__dirname, '../../tutorial/src/content/tutorial');
const outputDir = path.join(__dirname, '../src/lib/lessons');

const parts = [
  { number: 1, dir: '1-first-check', title: 'noDependency — Forbidden Imports' },
  { number: 2, dir: '2-purity', title: 'purity — No I/O in Pure Layers' },
  { number: 3, dir: '3-no-cycles', title: 'noCycles — Break Circular Dependencies' },
  { number: 4, dir: '4-design-system', title: 'Modeling a Design System' },
  { number: 5, dir: '5-molecules', title: 'Modeling Molecules' },
];

function readFilesRecursive(dir, baseDir = dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...readFilesRecursive(fullPath, baseDir));
    } else {
      const relativePath = path.relative(baseDir, fullPath);
      const contents = fs.readFileSync(fullPath, 'utf-8');
      files.push({ path: relativePath, contents });
    }
  }

  return files;
}

function parseContent(contentMd) {
  const lines = contentMd.split('\n');
  let inFrontmatter = false;
  let frontmatter = {};
  let content = [];

  for (const line of lines) {
    if (line === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
      } else {
        inFrontmatter = false;
      }
      continue;
    }

    if (inFrontmatter) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        frontmatter[match[1]] = match[2].replace(/^["']|["']$/g, '');
      }
    } else {
      content.push(line);
    }
  }

  return { frontmatter, content: content.join('\n').trim() };
}

const allLessons = [];

for (const part of parts) {
  const partDir = path.join(tutorialRoot, part.dir);
  const lessons = fs.readdirSync(partDir)
    .filter(name => !name.endsWith('.md') && fs.statSync(path.join(partDir, name)).isDirectory())
    .sort();

  for (const lessonDir of lessons) {
    const lessonPath = path.join(partDir, lessonDir);
    const contentPath = path.join(lessonPath, 'content.md');

    if (!fs.existsSync(contentPath)) continue;

    const contentMd = fs.readFileSync(contentPath, 'utf-8');
    const { frontmatter, content } = parseContent(contentMd);

    const filesDir = path.join(lessonPath, '_files');
    const solutionDir = path.join(lessonPath, '_solution');

    const files = fs.existsSync(filesDir) ? readFilesRecursive(filesDir) : [];
    const solution = fs.existsSync(solutionDir) ? readFilesRecursive(solutionDir) : [];

    const slug = `${part.number}-${lessons.indexOf(lessonDir) + 1}-${lessonDir.replace(/^\d+-/, '')}`;

    const lesson = {
      slug,
      title: frontmatter.title,
      partTitle: part.title,
      partNumber: part.number,
      lessonNumber: lessons.indexOf(lessonDir) + 1,
      focus: frontmatter.focus || 'src/context.ts',
      files,
      solution,
    };

    allLessons.push(lesson);

    // Write individual lesson file
    const lessonFileName = `${slug}.ts`;
    const lessonContent = `import { Lesson } from './types';

export const lesson: Lesson = ${JSON.stringify(lesson, null, 2)};
`;

    fs.writeFileSync(path.join(outputDir, lessonFileName), lessonContent);

    // Write content MDX file to public directory (served as static asset)
    const contentMdxDir = path.join(__dirname, '../public/lessons');
    fs.mkdirSync(contentMdxDir, { recursive: true });
    fs.writeFileSync(path.join(contentMdxDir, `${slug}.mdx`), content);

    console.log(`✓ Migrated ${slug}`);
  }
}

// Write index file
const indexContent = `import { Lesson, Part } from './types';

${allLessons.map((l, i) => `import { lesson as lesson${i} } from './${l.slug}';`).join('\n')}

export const lessons: Lesson[] = [
${allLessons.map((_, i) => `  lesson${i},`).join('\n')}
];

export const parts: Part[] = [
${parts.map(p => {
  const partLessons = allLessons.filter(l => l.partNumber === p.number);
  return `  {
    number: ${p.number},
    title: '${p.title}',
    lessons: [${partLessons.map(l => `lesson${allLessons.indexOf(l)}`).join(', ')}],
  },`;
}).join('\n')}
];

export function getLessonBySlug(slug: string): Lesson | undefined {
  return lessons.find(l => l.slug === slug);
}

export function getNextLesson(currentSlug: string): Lesson | undefined {
  const index = lessons.findIndex(l => l.slug === currentSlug);
  return index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : undefined;
}

export function getPrevLesson(currentSlug: string): Lesson | undefined {
  const index = lessons.findIndex(l => l.slug === currentSlug);
  return index > 0 ? lessons[index - 1] : undefined;
}
`;

fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent);

console.log(`\n✓ Generated index.ts with ${allLessons.length} lessons across ${parts.length} parts`);
