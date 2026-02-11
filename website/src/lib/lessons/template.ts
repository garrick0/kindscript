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
          dependencies: {
            kindscript: 'latest',
            typescript: '~5.5.0',
          },
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
            module: 'ESNext',
            lib: ['ES2020'],
            moduleResolution: 'node',
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
};
