import { FileSystemTree } from '@webcontainer/api';

export const templateFiles: FileSystemTree = {
  'package.json': {
    file: {
      contents: JSON.stringify(
        {
          name: 'kindscript-lesson',
          version: '1.0.0',
          type: 'module',
          scripts: {
            check: 'ksc check .',
          },
          dependencies: {},
        },
        null,
        2
      ),
    },
  },
  'tsconfig.json': {
    file: {
      contents: JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2020',
            module: 'NodeNext',
            lib: ['ES2020'],
            moduleResolution: 'nodenext',
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
          },
          include: ['src/**/*'],
        },
        null,
        2
      ),
    },
  },
  'node_modules': {
    directory: {
      'kindscript': {
        directory: {
          'package.json': {
            file: {
              contents: JSON.stringify(
                {
                  name: 'kindscript',
                  version: '2.0.1',
                  type: 'module',
                  types: './index.d.ts',
                  exports: {
                    '.': {
                      types: './index.d.ts',
                    },
                  },
                },
                null,
                2
              ),
            },
          },
          'index.d.ts': {
            file: {
              contents: `/**
 * KindScript — Architectural enforcement for TypeScript.
 * Type-only exports for writing architectural definitions.
 */

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
`,
            },
          },
        },
      },
    },
  },
};
