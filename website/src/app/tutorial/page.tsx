'use client';

import Link from 'next/link';
import { parts } from '@/lib/lessons';

export default function TutorialIndex() {
  return (
    <div style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>Interactive Tutorial</h1>
      <p style={{ fontSize: '1.125rem', color: '#666', marginBottom: '3rem' }}>
        Learn KindScript by running real code in your browser. No installation required.
      </p>

      <div style={{ display: 'grid', gap: '2rem' }}>
        {parts.map((part) => (
          <div
            key={part.number}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1.5rem',
              background: '#fafafa',
            }}
          >
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem' }}>
              Part {part.number}: {part.title}
            </h2>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              {part.lessons.length} lesson{part.lessons.length !== 1 ? 's' : ''}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {part.lessons.map((lesson) => (
                <li key={lesson.slug} style={{ marginBottom: '0.5rem' }}>
                  <Link
                    href={`/tutorial/${lesson.slug}`}
                    style={{
                      display: 'block',
                      padding: '0.75rem 1rem',
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      color: '#111',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>
                      {lesson.partNumber}.{lesson.lessonNumber} {lesson.title}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
