'use client';

import { Lesson } from '@/lib/lessons/types';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface LessonContentProps {
  lesson: Lesson;
}

// Custom component for callouts (:::tip, :::info, etc.)
function parseCallouts(content: string): string {
  return content.replace(
    /:::(\w+)\n([\s\S]*?)\n:::/g,
    (_, type, text) => {
      // Return markdown blockquote format that react-markdown can handle
      return `> **${type.toUpperCase()}**\n>\n> ${text.trim().replace(/\n/g, '\n> ')}`;
    }
  );
}

export function LessonContent({ lesson }: LessonContentProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/lessons/${lesson.slug}.mdx`)
      .then((res) => res.text())
      .then((text) => {
        const processed = parseCallouts(text);
        setContent(processed);
        setLoading(false);
      })
      .catch(() => {
        setContent(`# ${lesson.title}\n\nContent loading failed.`);
        setLoading(false);
      });
  }, [lesson.slug, lesson.title]);

  return (
    <div style={{ padding: '2rem', maxWidth: '700px', color: '#1e293b' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
          Lesson {lesson.partNumber}.{lesson.lessonNumber}
        </div>
        <h1 style={{ margin: 0, fontSize: '2rem', lineHeight: 1.2, color: '#0f172a' }}>{lesson.title}</h1>
      </div>
      {loading ? (
        <div style={{ color: '#64748b' }}>Loading...</div>
      ) : (
        <div className="lesson-content" style={{ lineHeight: '1.75', fontSize: '1rem', color: '#334155' }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              code: ({ inline, className, children, ...props }: any) => {
                if (inline) {
                  return (
                    <code
                      style={{
                        background: '#f1f5f9',
                        padding: '0.2em 0.4em',
                        borderRadius: '3px',
                        fontSize: '0.9em',
                        fontWeight: 500,
                        color: '#dc2626',
                      }}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              pre: ({ children, ...props }: any) => (
                <pre
                  style={{
                    background: '#1e293b',
                    padding: '1rem',
                    borderRadius: '6px',
                    overflow: 'auto',
                    fontSize: '0.875rem',
                    lineHeight: '1.7',
                  }}
                  {...props}
                >
                  {children}
                </pre>
              ),
              a: ({ children, ...props }: any) => (
                <a style={{ color: '#3b82f6', textDecoration: 'underline' }} {...props}>
                  {children}
                </a>
              ),
              p: ({ children, ...props }: any) => (
                <p style={{ marginBottom: '1rem', color: '#334155', fontSize: '1rem', lineHeight: '1.7' }} {...props}>
                  {children}
                </p>
              ),
              h2: ({ children, ...props }: any) => (
                <h2 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.5rem', color: '#0f172a', fontWeight: 600 }} {...props}>
                  {children}
                </h2>
              ),
              h3: ({ children, ...props }: any) => (
                <h3 style={{ marginTop: '1.5rem', marginBottom: '0.75rem', fontSize: '1.25rem', color: '#1e293b', fontWeight: 600 }} {...props}>
                  {children}
                </h3>
              ),
              ul: ({ children, ...props }: any) => (
                <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem', color: '#334155' }} {...props}>
                  {children}
                </ul>
              ),
              ol: ({ children, ...props }: any) => (
                <ol style={{ marginLeft: '1.5rem', marginBottom: '1rem', color: '#334155' }} {...props}>
                  {children}
                </ol>
              ),
              li: ({ children, ...props }: any) => (
                <li style={{ marginBottom: '0.5rem', color: '#334155', lineHeight: '1.6' }} {...props}>
                  {children}
                </li>
              ),
              blockquote: ({ children, ...props }: any) => (
                <blockquote
                  style={{
                    borderLeft: '4px solid #10b981',
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '1rem',
                    margin: '1rem 0',
                    borderRadius: '4px',
                    color: '#0f172a',
                  }}
                  {...props}
                >
                  {children}
                </blockquote>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
