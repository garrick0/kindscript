import { Lesson, Part } from './types';

import { lesson as lesson0 } from './1-1-hello-kindscript';
import { lesson as lesson1 } from './1-2-catching-violations';
import { lesson as lesson2 } from './1-3-fix-the-violation';
import { lesson as lesson3 } from './2-1-pure-layers';
import { lesson as lesson4 } from './2-2-fix-purity';
import { lesson as lesson5 } from './3-1-detecting-cycles';
import { lesson as lesson6 } from './3-2-break-the-cycle';
import { lesson as lesson7 } from './4-1-atom-source';
import { lesson as lesson8 } from './4-2-atom-story';
import { lesson as lesson9 } from './4-3-atom-version';
import { lesson as lesson10 } from './4-4-full-atom';
import { lesson as lesson11 } from './5-1-molecule-source';
import { lesson as lesson12 } from './5-2-molecule-story';
import { lesson as lesson13 } from './5-3-molecule-version';
import { lesson as lesson14 } from './5-4-full-molecule';

export const lessons: Lesson[] = [
  lesson0,
  lesson1,
  lesson2,
  lesson3,
  lesson4,
  lesson5,
  lesson6,
  lesson7,
  lesson8,
  lesson9,
  lesson10,
  lesson11,
  lesson12,
  lesson13,
  lesson14,
];

export const parts: Part[] = [
  {
    number: 1,
    title: 'noDependency — Forbidden Imports',
    lessons: [lesson0, lesson1, lesson2],
  },
  {
    number: 2,
    title: 'purity — No I/O in Pure Layers',
    lessons: [lesson3, lesson4],
  },
  {
    number: 3,
    title: 'noCycles — Break Circular Dependencies',
    lessons: [lesson5, lesson6],
  },
  {
    number: 4,
    title: 'Modeling a Design System',
    lessons: [lesson7, lesson8, lesson9, lesson10],
  },
  {
    number: 5,
    title: 'Modeling Molecules',
    lessons: [lesson11, lesson12, lesson13, lesson14],
  },
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
