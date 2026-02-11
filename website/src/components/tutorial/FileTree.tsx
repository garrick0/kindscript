'use client';

import { LessonFile } from '@/lib/lessons/types';

interface FileTreeProps {
  files: LessonFile[];
  activeFile: string;
  onFileSelect: (path: string) => void;
}

export function FileTree({ files, activeFile, onFileSelect }: FileTreeProps) {
  // Group files by directory
  const tree: Record<string, string[]> = {};

  files.forEach((file) => {
    const parts = file.path.split('/');
    if (parts.length === 1) {
      if (!tree['_root']) tree['_root'] = [];
      tree['_root'].push(file.path);
    } else {
      const dir = parts.slice(0, -1).join('/');
      if (!tree[dir]) tree[dir] = [];
      tree[dir].push(file.path);
    }
  });

  return (
    <div style={{ background: '#252526', color: '#cccccc', height: '100%', overflow: 'auto' }}>
      <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#888' }}>
        Files
      </div>
      <div>
        {files.map((file) => {
          const isActive = file.path === activeFile;
          const fileName = file.path.split('/').pop();
          const indent = (file.path.split('/').length - 1) * 12;

          return (
            <div
              key={file.path}
              onClick={() => onFileSelect(file.path)}
              style={{
                padding: '0.375rem 0.75rem',
                paddingLeft: `${0.75 + indent / 16}rem`,
                cursor: 'pointer',
                background: isActive ? '#37373d' : 'transparent',
                color: isActive ? 'white' : '#cccccc',
                fontSize: '0.875rem',
                borderLeft: isActive ? '2px solid #007acc' : '2px solid transparent',
              }}
            >
              <span style={{ marginRight: '0.5rem', opacity: 0.5 }}>📄</span>
              {fileName}
            </div>
          );
        })}
      </div>
    </div>
  );
}
