'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { LessonFile } from '@/lib/lessons/types';
import { EditableFileTree } from './EditableFileTree';
import { LoadingOverlay } from './LoadingOverlay';
import { SaveMenu } from './SaveMenu';
import { SaveDialog } from './SaveDialog';
import { LoadDialog } from './LoadDialog';
import { ResumeBanner } from './ResumeBanner';
import { useToast } from './Toast';
import type { WebContainerHandle } from './WebContainerProvider';
import * as storage from '@/lib/tutorial/storage';
import { downloadAsZip, copyFileToClipboard } from '@/lib/tutorial/export';
import { SANDBOX_TEMPLATES, SandboxTemplate } from '@/lib/tutorial/sandbox-templates';

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

const SANDBOX_SLUG = 'sandbox';

export function SandboxLayout() {
  const [currentFiles, setCurrentFiles] = useState<LessonFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [containerState, setContainerState] = useState<'idle' | 'booting' | 'installing' | 'ready' | 'error'>('idle');
  const [terminal, setTerminal] = useState<any>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const webcontainerRef = useRef<WebContainerHandle>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { showToast, ToastContainer } = useToast();

  const handleTerminalReady = (term: any) => {
    console.log('Terminal ready callback received');
    setTerminal(term);
  };

  // Check for auto-save on mount
  useEffect(() => {
    const autoSave = storage.loadAutoSave(SANDBOX_SLUG);
    if (autoSave) {
      setShowResumeBanner(true);
    } else {
      // Load default template
      loadTemplate(SANDBOX_TEMPLATES[0]);
    }
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (!isDirty || currentFiles.length === 0) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      const fileToSave = activeFile || currentFiles[0].path;
      storage.autoSave(SANDBOX_SLUG, currentFiles, fileToSave);
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [currentFiles, activeFile, isDirty]);

  // Save on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isDirty && currentFiles.length > 0) {
        const fileToSave = activeFile || currentFiles[0].path;
        storage.autoSave(SANDBOX_SLUG, currentFiles, fileToSave);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, currentFiles, activeFile]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        setShowSaveDialog(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadTemplate = (template: SandboxTemplate) => {
    setCurrentFiles(template.files);
    setActiveFile(template.files[0]?.path || null);
    setIsDirty(false);
    showToast(`Loaded ${template.name} template`, 'info');
  };

  const currentFileContent = activeFile ? currentFiles.find((f) => f.path === activeFile)?.contents || '' : '';

  const handleReset = () => {
    setShowTemplateDialog(true);
  };

  const handleFileChange = (value: string | undefined) => {
    if (value === undefined || !activeFile) return;

    setCurrentFiles((files) =>
      files.map((file) => (file.path === activeFile ? { ...file, contents: value } : file))
    );

    setIsDirty(true);
    webcontainerRef.current?.writeFile(activeFile, value);
  };

  const handleCreateFile = useCallback((path: string) => {
    // Check if it's a folder placeholder
    if (path.endsWith('/.gitkeep')) {
      setCurrentFiles((files) => [...files, { path, contents: '' }]);
      setIsDirty(true);
      return;
    }

    const newFile: LessonFile = { path, contents: `// ${path}\n` };
    setCurrentFiles((files) => [...files, newFile]);
    setActiveFile(path);
    setIsDirty(true);
    webcontainerRef.current?.writeFile(path, newFile.contents);
    showToast(`Created ${path}`, 'success');
  }, [showToast]);

  const handleDeleteFile = useCallback((path: string) => {
    // If deleting a folder, delete all files inside it
    setCurrentFiles((files) => {
      const filtered = files.filter((f) => !f.path.startsWith(path));
      return filtered;
    });

    // If we deleted the active file, switch to another
    if (activeFile?.startsWith(path)) {
      setCurrentFiles((files) => {
        if (files.length > 0) {
          setActiveFile(files[0].path);
        } else {
          setActiveFile(null);
        }
        return files;
      });
    }

    setIsDirty(true);
    showToast(`Deleted ${path}`, 'info');
  }, [activeFile, showToast]);

  const handleRenameFile = useCallback((oldPath: string, newPath: string) => {
    setCurrentFiles((files) =>
      files.map((file) => {
        // Rename the file itself or any file inside a renamed folder
        if (file.path === oldPath || file.path.startsWith(oldPath + '/')) {
          const updated = file.path.replace(oldPath, newPath);
          return { ...file, path: updated };
        }
        return file;
      })
    );

    // Update active file if it was renamed
    if (activeFile === oldPath || activeFile?.startsWith(oldPath + '/')) {
      const newActive = activeFile.replace(oldPath, newPath);
      setActiveFile(newActive);
    }

    setIsDirty(true);
    showToast(`Renamed to ${newPath}`, 'success');
  }, [activeFile, showToast]);

  const handleSave = useCallback((name: string) => {
    try {
      const fileToSave = activeFile || currentFiles[0]?.path || '';
      storage.namedSave(SANDBOX_SLUG, name, currentFiles, fileToSave);
      showToast(`Saved as "${name}"`, 'success');
    } catch (error) {
      showToast('Failed to save: storage quota exceeded', 'error');
    }
  }, [currentFiles, activeFile, showToast]);

  const handleLoad = useCallback((save: storage.SavedLesson) => {
    setCurrentFiles(save.files);
    setActiveFile(save.activeFile);
    setIsDirty(false);
    const label = save.slotName === null ? 'Auto-save' : save.label || save.slotName;
    showToast(`Loaded "${label}"`, 'success');
  }, [showToast]);

  const handleDelete = useCallback((save: storage.SavedLesson) => {
    if (save.slotName === null) {
      storage.clearAutoSave(SANDBOX_SLUG);
    } else {
      storage.deleteNamedSave(SANDBOX_SLUG, save.slotName);
    }
    showToast('Save deleted', 'info');
  }, [showToast]);

  const handleExport = useCallback(async () => {
    try {
      await downloadAsZip(currentFiles, 'kindscript-sandbox');
      showToast('Downloaded ZIP file', 'success');
    } catch (error) {
      showToast('Failed to download ZIP', 'error');
    }
  }, [currentFiles, showToast]);

  const handleRestoreAutoSave = () => {
    const autoSave = storage.loadAutoSave(SANDBOX_SLUG);
    if (autoSave) {
      handleLoad(autoSave);
      setShowResumeBanner(false);
    }
  };

  const handleDismissResumeBanner = () => {
    setShowResumeBanner(false);
    storage.clearAutoSave(SANDBOX_SLUG);
    // Load default template
    loadTemplate(SANDBOX_TEMPLATES[0]);
  };

  const handleCopyFile = useCallback(async () => {
    const success = await copyFileToClipboard(currentFileContent);
    if (success) {
      showToast('Copied to clipboard', 'success');
    } else {
      showToast('Failed to copy', 'error');
    }
  }, [currentFileContent, showToast]);

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
  const namedSaves = storage.listNamedSaves(SANDBOX_SLUG);
  const autoSave = storage.loadAutoSave(SANDBOX_SLUG);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Resume banner */}
      {showResumeBanner && (
        <ResumeBanner onRestore={handleRestoreAutoSave} onDismiss={handleDismissResumeBanner} />
      )}

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
            ← Back to Lessons
          </a>
          <div style={{ color: '#94a3b8' }}>|</div>
          <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Sandbox Mode</div>
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

          {/* Template button */}
          <button
            onClick={() => setShowTemplateDialog(true)}
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
            📑 Templates
          </button>

          {/* Save/Load menu */}
          <SaveMenu
            onSave={() => setShowSaveDialog(true)}
            onLoad={() => setShowLoadDialog(true)}
            onExport={handleExport}
            onReset={handleReset}
            disabled={!isReady}
          />
        </div>
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left panel: Project info */}
        <div
          style={{
            width: '30%',
            borderRight: '1px solid #e5e7eb',
            overflow: 'auto',
            background: 'white',
            padding: '1.5rem',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#1e293b' }}>
            🧪 Sandbox Mode
          </h1>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            Experiment with KindScript beyond tutorial constraints. Create, modify, and delete files to prototype
            architectural patterns.
          </p>

          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>
              Quick Start
            </h2>
            <ul style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: '1.6', paddingLeft: '1.25rem' }}>
              <li>Right-click files/folders for context menu</li>
              <li>Use 📄+ / 📁+ buttons to create files/folders</li>
              <li>Click "Run Check" to validate architecture</li>
              <li>Save your work with Ctrl+S</li>
              <li>Export as ZIP to use in your projects</li>
            </ul>
          </div>

          <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e40af' }}>
              💡 Try These Templates
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
              {SANDBOX_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    loadTemplate(template);
                    setShowTemplateDialog(false);
                  }}
                  style={{
                    background: 'white',
                    border: '1px solid #dbeafe',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#1e40af', marginBottom: '0.25rem' }}>{template.name}</div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{template.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Middle-left: File tree */}
        <div style={{ width: '220px', borderRight: '1px solid #3e3e42' }}>
          <EditableFileTree
            files={currentFiles}
            activeFile={activeFile}
            onFileSelect={setActiveFile}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
            onRenameFile={handleRenameFile}
          />
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
              <span>{activeFile || 'No file selected'}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {activeFile && (
                  <button
                    onClick={handleCopyFile}
                    title="Copy file contents"
                    style={{
                      background: 'transparent',
                      color: '#ccc',
                      border: '1px solid #555',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#3e3e42';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    📋 Copy
                  </button>
                )}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              {activeFile ? (
                <CodeEditor
                  value={currentFileContent}
                  language={getLanguage(activeFile)}
                  onChange={handleFileChange}
                  path={activeFile}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
                  Select a file to edit
                </div>
              )}
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

      {/* WebContainer provider (headless) */}
      <WebContainerProvider
        ref={webcontainerRef}
        files={currentFiles}
        terminal={terminal}
        onStateChange={setContainerState}
      />

      {/* Loading overlay */}
      <LoadingOverlay state={containerState} />

      {/* Dialogs */}
      <SaveDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSave}
      />
      <LoadDialog
        isOpen={showLoadDialog}
        onClose={() => setShowLoadDialog(false)}
        onLoad={handleLoad}
        onDelete={handleDelete}
        saves={namedSaves}
        autoSave={autoSave}
      />

      {/* Template Dialog */}
      {showTemplateDialog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowTemplateDialog(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '1.5rem',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Choose a Template</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Starting a new project? Select an architectural template to get started.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {SANDBOX_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    loadTemplate(template);
                    setShowTemplateDialog(false);
                  }}
                  style={{
                    background: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '1rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem' }}>
                    {template.name}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.875rem' }}>{template.description}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                    {template.files.length} files
                  </div>
                </button>
              ))}
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
              <button
                onClick={() => setShowTemplateDialog(false)}
                style={{
                  background: '#64748b',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  width: '100%',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}
