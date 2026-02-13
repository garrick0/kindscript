'use client';

import Editor, { BeforeMount } from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  language: string;
  onChange?: (value: string | undefined) => void;
  path?: string;
}

const KINDSCRIPT_TYPES = `declare module 'kindscript' {
  export type Constraints<Members = Record<string, never>> = {
    pure?: true;
    noDependency?: ReadonlyArray<readonly [keyof Members & string, keyof Members & string]>;
    noCycles?: ReadonlyArray<keyof Members & string>;
    exhaustive?: true;
  };

  export type KindConfig = {
    wraps?: unknown;
    scope?: 'folder' | 'file';
  };

  export type KindRef = { readonly __kindscript_ref?: string };

  export type Kind<
    N extends string = string,
    Members extends Record<string, KindRef | readonly [KindRef, string]> = {},
    _Constraints extends Constraints<Members> = {},
    _Config extends KindConfig = {},
  > = (_Config extends { wraps: infer T }
    ? T & { readonly __kindscript_brand?: N } & KindRef
    : {
      readonly kind: N;
      readonly location: string;
    } & Members & KindRef
  );

  export type MemberMap<T extends KindRef> = {
    [K in keyof T as K extends 'kind' | 'location' | '__kindscript_ref' | '__kindscript_brand' ? never : K]:
      T[K] extends readonly [infer K2 extends KindRef, string]
        ? MemberMap<K2> | Record<string, never>
        : T[K] extends KindRef
          ? MemberMap<T[K]> | Record<string, never>
          : never;
  };

  export type Instance<T extends KindRef, _Path extends string = string> = MemberMap<T>;
}
`;

const handleEditorWillMount: BeforeMount = (monaco) => {
  // Configure TypeScript compiler options
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
  });

  // Add kindscript type declarations
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    KINDSCRIPT_TYPES,
    'kindscript.d.ts'
  );
};

export function CodeEditor({ value, language, onChange, path }: CodeEditorProps) {
  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      onChange={onChange}
      path={path}
      theme="vs-dark"
      beforeMount={handleEditorWillMount}
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
