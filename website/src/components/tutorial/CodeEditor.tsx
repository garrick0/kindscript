'use client';

import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  language: string;
  onChange?: (value: string | undefined) => void;
  path?: string;
}

export function CodeEditor({ value, language, onChange, path }: CodeEditorProps) {
  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      onChange={onChange}
      path={path}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        wordWrap: 'on',
        automaticLayout: true,
        scrollBeyondLastLine: false,
        readOnly: false,
        tabSize: 2,
        insertSpaces: true,
      }}
    />
  );
}
