'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Lesson, LessonFile } from '@/lib/lessons/types';
import { LessonContent } from './LessonContent';
import { LessonNav } from './LessonNav';
import { FileTree } from './FileTree';
import { LoadingOverlay } from './LoadingOverlay';
import type { WebContainerHandle } from './WebContainerProvider';

const CodeEditor = dynamic(() => import('./CodeEditor').then((mod) => mod.CodeEditor), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc' }}>
      Loading editor...
    </div>
  ),
});

const Terminal = dynamic(() => import('./Terminal').then((mod) => ({ default: mod.Terminal })), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc' }}>
      Loading terminal...
    </div>
  ),
});

const WebContainerProvider = dynamic(() => import('./WebContainerProvider').then((mod) => mod.WebContainerProvider), {
  ssr: false,
});

interface TutorialLayoutProps {
  lesson: Lesson;
}

export function TutorialLayout({ lesson }: TutorialLayoutProps) {
  const [currentFiles, setCurrentFiles] = useState<LessonFile[]>(lesson.files);
  const [activeFile, setActiveFile] = useState<string>(lesson.focus);
  const [showSolution, setShowSolution] = useState(false);
  const [containerState, setContainerState] = useState<'idle' | 'booting' | 'installing' | 'ready' | 'error'>('idle');
  const [terminal, setTerminal] = useState<any>(null);
  const webcontainerRef = useRef<WebContainerHandle>(null);

  const handleTerminalReady = (term: any) => {
    console.log('Terminal ready callback received');
    setTerminal(term);
  };

  // Reset when lesson changes
  useEffect(() => {
    setCurrentFiles(lesson.files);
    setActiveFile(lesson.focus);
    setShowSolution(false);
  }, [lesson.slug, lesson.files, lesson.focus]);

  const currentFileContent = currentFiles.find((f) => f.path === activeFile)?.contents || '';

  const handleShowSolution = () => {
    setCurrentFiles(lesson.solution);
    setShowSolution(true);
  };

  const handleReset = () => {
    setCurrentFiles(lesson.files);
    setActiveFile(lesson.focus);
    setShowSolution(false);
  };

  const handleFileChange = (value: string | undefined) => {
    if (value === undefined) return;

    // Update local state
    setCurrentFiles((files) =>
      files.map((file) => (file.path === activeFile ? { ...file, contents: value } : file))
    );

    // Sync to WebContainer
    webcontainerRef.current?.writeFile(activeFile, value);
  };

  const handleRunCheck = () => {
    webcontainerRef.current?.runCommand('npm', ['run', 'check']);
  };

  const getLanguage = (path: string) => {
    if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript';
    if (path.endsWith('.js') || path.endsWith('.jsx')) return 'javascript';
    if (path.endsWith('.json')) return 'json';
    if (path.endsWith('.md')) return 'markdown';
    return 'plaintext';
  };

  const isReady = containerState === 'ready';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top nav bar */}
      <div
        style={{
          background: '#1e293b',
          color: 'white',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <a
            href="/tutorial"
            style={{ color: 'white', textDecoration: 'none', fontSize: '1.125rem', fontWeight: 600 }}
          >
            ← Lessons
          </a>
          <div style={{ color: '#94a3b8' }}>|</div>
          <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{lesson.partTitle}</div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Status indicator */}
          {containerState === 'booting' && (
            <span style={{ fontSize: '0.875rem', color: '#fbbf24' }}>⏳ Booting...</span>
          )}
          {containerState === 'installing' && (
            <span style={{ fontSize: '0.875rem', color: '#fbbf24' }}>📦 Installing...</span>
          )}
          {containerState === 'ready' && (
            <span style={{ fontSize: '0.875rem', color: '#10b981' }}>✓ Ready</span>
          )}
          {containerState === 'error' && (
            <span style={{ fontSize: '0.875rem', color: '#ef4444' }}>✗ Error</span>
          )}

          {/* Run button */}
          <button
            onClick={handleRunCheck}
            disabled={!isReady}
            style={{
              background: isReady ? '#10b981' : '#64748b',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: isReady ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            ▶ Run Check
          </button>

          {/* Solution toggle */}
          {!showSolution && (
            <button
              onClick={handleShowSolution}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Show Solution
            </button>
          )}
          {showSolution && (
            <button
              onClick={handleReset}
              style={{
                background: '#64748b',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left panel: Lesson content */}
        <div
          style={{
            width: '30%',
            borderRight: '1px solid #e5e7eb',
            overflow: 'auto',
            background: 'white',
          }}
        >
          <LessonContent lesson={lesson} />
        </div>

        {/* Middle-left: File tree */}
        <div style={{ width: '180px', borderRight: '1px solid #3e3e42' }}>
          <FileTree files={currentFiles} activeFile={activeFile} onFileSelect={setActiveFile} />
        </div>

        {/* Right side: Editor + Terminal */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Code editor (60%) */}
          <div style={{ height: '60%', display: 'flex', flexDirection: 'column', background: '#1e1e1e' }}>
            <div
              style={{
                background: '#2d2d30',
                color: '#ccc',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                borderBottom: '1px solid #3e3e42',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>{activeFile}</span>
              {showSolution && <span style={{ color: '#10b981', fontSize: '0.75rem' }}>✓ Solution</span>}
            </div>
            <div style={{ flex: 1 }}>
              <CodeEditor
                value={currentFileContent}
                language={getLanguage(activeFile)}
                onChange={handleFileChange}
                path={activeFile}
              />
            </div>
          </div>

          {/* Terminal (40%) */}
          <div style={{ height: '40%', display: 'flex', flexDirection: 'column', borderTop: '1px solid #3e3e42' }}>
            <div
              style={{
                background: '#2d2d30',
                color: '#ccc',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                borderBottom: '1px solid #3e3e42',
              }}
            >
              Terminal
            </div>
            <div style={{ flex: 1, background: '#1e1e1e' }}>
              <Terminal onTerminalReady={handleTerminalReady} isWebContainerReady={isReady} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <LessonNav lesson={lesson} />

      {/* WebContainer provider (headless) */}
      <WebContainerProvider
        ref={webcontainerRef}
        files={currentFiles}
        terminal={terminal}
        onStateChange={setContainerState}
      />

      {/* Loading overlay */}
      <LoadingOverlay state={containerState} />
    </div>
  );
}
