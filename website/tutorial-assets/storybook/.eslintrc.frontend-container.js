/**
 * ESLint Rules for Frontend Container Pattern
 * 
 * These rules enforce the architectural patterns we follow:
 * - Services, types, and validation must be colocated with components
 * - Hooks must be colocated with the components that use them
 * - No centralized business logic directories
 */

module.exports = {
  rules: {
    // Enforce colocation of files with components
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/services/*', '!./**.service', '!../**.service'],
            message: 'Services must be colocated with components. Import from the component directory instead.',
          },
          {
            group: ['**/types/*', '!./**.types', '!../**.types'],
            message: 'Types must be colocated with components. Import from the component directory instead.',
          },
          {
            group: ['**/validation/*', '!./**.validation', '!../**.validation', '!**/common/validation/*'],
            message: 'Validation must be colocated with components (except shared schemas in common/validation).',
          },
          {
            group: ['**/hooks/*', '!./use*', '!../use*', '!**/common/hooks/*', '!**/core/auth/*', '!**/core/routing/*'],
            message: 'Hooks must be colocated with components (except utilities in common/hooks or core infrastructure).',
          },
        ],
      },
    ],

    // Enforce file naming conventions
    'filename-rules/match': [
      'error',
      {
        '.service.ts': '**/components/**/*.service.ts',
        '.types.ts': '**/components/**/*.types.ts',
        '.validation.ts': '**/components/**/*.validation.ts|**/common/validation/*.validation.ts',
        'use*.ts': '**/components/**/use*.ts|**/common/hooks/use*.ts|**/core/**/use*.ts',
        '.stories.tsx': '**/components/**/*.stories.tsx',
        '.test.ts': '**/components/**/*.test.ts',
        '.test.tsx': '**/components/**/*.test.tsx',
      },
    ],

    // Prevent creating service/type directories outside components
    'no-restricted-modules': [
      'error',
      {
        paths: [
          {
            name: 'services',
            message: 'Do not create services directory. Services should be colocated with components.',
          },
          {
            name: 'types',
            message: 'Do not create types directory. Types should be colocated with components.',
          },
        ],
      },
    ],

    // Custom rule to check component structure
    'local-rules/component-structure': [
      'warn',
      {
        required: ['index.ts', '*.tsx'],
        recommended: ['*.service.ts', '*.types.ts', 'use*.ts', '*.stories.tsx', '*.test.ts'],
        component_dirs: ['atoms', 'molecules', 'organisms', 'Pages', 'templates'],
      },
    ],

    // Enforce imports from component index files
    'import/no-internal-modules': [
      'error',
      {
        allow: [
          '**/components/*/index',
          '**/components/*/*.service',
          '**/components/*/*.types',
          '**/components/*/use*',
          '**/*.css',
          '**/*.scss',
          'react-dom/client',
        ],
      },
    ],

    // Prevent direct imports from versioned directories
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/v[0-9]*/**', '**/latest/**'],
            message: 'Import from the component root instead of version directories.',
          },
        ],
      },
    ],
  },

  overrides: [
    {
      // Allow test files to import from anywhere for testing
      files: ['*.test.ts', '*.test.tsx', '*.spec.ts', '*.spec.tsx'],
      rules: {
        'no-restricted-imports': 'off',
        'import/no-internal-modules': 'off',
      },
    },
    {
      // Stories can import from component internals
      files: ['*.stories.tsx', '*.stories.ts'],
      rules: {
        'import/no-internal-modules': 'off',
      },
    },
  ],
};