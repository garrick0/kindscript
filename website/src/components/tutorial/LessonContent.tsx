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
      const colors: Record<string, string> = {
        tip: '#10b981',
        info: '#3b82f6',
        warning: '#f59e0b',
        danger: '#ef4444',
      };
      const color = colors[type] || '#64748b';
      return `<div style="border-left: 4px solid ${color}; background: rgba(0,0,0,0.05); padding: 1rem; margin: 1rem 0; border-radius: 4px;">
<div style="font-weight: 600; color: ${color}; margin-bottom: 0.5rem; text-transform: uppercase; font-size: 0.875rem;">${type}</div>
${text}
</div>`;
    }
  );
}

export function LessonContent({ lesson }: LessonContentProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/content/lessons/${lesson.slug}.mdx`)
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
    <div style={{ padding: '2rem', maxWidth: '700px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
          Lesson {lesson.partNumber}.{lesson.lessonNumber}
        </div>
        <h1 style={{ margin: 0, fontSize: '2rem', lineHeight: 1.2 }}>{lesson.title}</h1>
      </div>
      {loading ? (
        <div style={{ color: '#64748b' }}>Loading...</div>
      ) : (
        <div className="lesson-content" style={{ lineHeight: '1.75' }}>
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
                        color: '#e11d48',
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
              h2: ({ children, ...props }: any) => (
                <h2 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.5rem' }} {...props}>
                  {children}
                </h2>
              ),
              h3: ({ children, ...props }: any) => (
                <h3 style={{ marginTop: '1.5rem', marginBottom: '0.75rem', fontSize: '1.25rem' }} {...props}>
                  {children}
                </h3>
              ),
              ul: ({ children, ...props }: any) => (
                <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }} {...props}>
                  {children}
                </ul>
              ),
              ol: ({ children, ...props }: any) => (
                <ol style={{ marginLeft: '1.5rem', marginBottom: '1rem' }} {...props}>
                  {children}
                </ol>
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
