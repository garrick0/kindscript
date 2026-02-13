/**
 * Default Module Types
 * 
 * Pre-configured module types for common patterns in the codebase.
 */

import type { ModuleType } from '../types/module.types';

export const defaultModuleTypes: ModuleType[] = [
  {
    id: 'pages-v1',
    name: 'Pages (Versioned)',
    description: 'Self-contained page components with versioning support',
    version: '1.0.0',
    
    discovery: {
      basePattern: 'apps/storybook/src/components/Pages',
      instancePattern: '*/v[0-9]+.[0-9]+.[0-9]+',
      filePatterns: {
        required: [
          'ui/*.tsx',
          'metadata.json'
        ],
        optional: [
          'README.md',
          'domain/*.ts',
          'data/*.ts',
          'validation/*.ts',
          'types/*.ts',
          '*.test.tsx',
          '*.stories.tsx',
          'dependencies.json'
        ],
        forbidden: [
          '*.tmp',
          '*.backup',
          'node_modules'
        ]
      }
    },
    
    structure: {
      folders: [
        {
          path: 'ui',
          required: true,
          description: 'UI components and views'
        },
        {
          path: 'domain',
          required: false,
          description: 'Business logic and hooks'
        },
        {
          path: 'data',
          required: false,
          description: 'Data services and API calls'
        },
        {
          path: 'validation',
          required: false,
          description: 'Validation schemas using Zod'
        },
        {
          path: 'types',
          required: false,
          description: 'TypeScript type definitions'
        }
      ],
      files: [
        {
          path: 'metadata.json',
          required: true,
          validation: {
            schema: 'page-metadata-schema'
          }
        },
        {
          path: 'README.md',
          required: false
        }
      ],
      dependencies: []
    },
    
    assertions: [
      {
        id: 'page-eslint',
        name: 'ESLint Compliance',
        description: 'Check ESLint rules for all TypeScript/JavaScript files',
        type: 'eslint',
        config: {
          eslint: {
            rules: {
              'no-console': 'error',
              'no-unused-vars': 'error',
              '@typescript-eslint/no-explicit-any': 'warn'
            }
          }
        },
        execution: {
          runOn: 'manual',
          timeout: 30000,
          cache: true,
          parallel: true
        },
        severity: 'error',
        autoFix: true
      },
      {
        id: 'page-tests',
        name: 'Test Coverage',
        description: 'Ensure adequate test coverage',
        type: 'test',
        config: {
          test: {
            runner: 'vitest',
            pattern: '*.test.{ts,tsx}',
            coverage: {
              threshold: 70,
              type: 'lines'
            }
          }
        },
        execution: {
          runOn: 'manual',
          timeout: 60000,
          cache: false,
          parallel: false
        },
        severity: 'warning'
      },
      {
        id: 'page-structure',
        name: 'Folder Structure',
        description: 'Validate required folder structure',
        type: 'structure',
        config: {
          structure: {
            requiredFiles: ['metadata.json'],
            requiredFolders: ['ui'],
            namingConvention: 'PascalCase'
          }
        },
        execution: {
          runOn: 'manual',
          timeout: 5000,
          cache: true,
          parallel: true
        },
        severity: 'error'
      },
      {
        id: 'page-dependencies',
        name: 'Dependency Check',
        description: 'Validate dependencies are properly managed',
        type: 'dependency',
        config: {
          dependency: {
            allowed: ['react', 'react-dom', '@induction/shared', 'lucide-react'],
            forbidden: ['jquery', 'lodash'],
            maxCount: 20
          }
        },
        execution: {
          runOn: 'manual',
          timeout: 10000,
          cache: true,
          parallel: true
        },
        severity: 'warning'
      }
    ],
    
    template: {
      id: 'page-template-v1',
      name: 'Page Template',
      description: 'Template for creating new page modules',
      files: [
        {
          path: 'ui/{{name}}Page.tsx',
          template: 'page-component.template'
        },
        {
          path: 'domain/use{{name}}.ts',
          template: 'page-hook.template'
        },
        {
          path: 'data/{{name.lower}}.service.ts',
          template: 'page-service.template'
        },
        {
          path: 'types/{{name.lower}}.types.ts',
          template: 'page-types.template'
        },
        {
          path: 'metadata.json',
          template: 'page-metadata.template'
        },
        {
          path: 'README.md',
          template: 'page-readme.template'
        }
      ]
    },
    
    metadata: {
      author: 'system',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      tags: ['pages', 'ui', 'frontend', 'components'],
      documentation: '/docs/module-types/pages.md'
    }
  },
  
  {
    id: 'organisms-v1',
    name: 'Organisms (Versioned)',
    description: 'Complex UI components with business logic',
    version: '1.0.0',
    
    discovery: {
      basePattern: 'apps/storybook/src/components/organisms',
      instancePattern: '*/v[0-9]+.[0-9]+.[0-9]+',
      filePatterns: {
        required: [
          '*.tsx',
          '*.types.ts'
        ],
        optional: [
          '*.service.ts',
          '*.validation.ts',
          '*.test.tsx',
          '*.stories.tsx',
          'use*.ts'
        ],
        forbidden: [
          '*.tmp',
          '*.backup'
        ]
      }
    },
    
    structure: {
      folders: [],
      files: [
        {
          path: '{{name}}.tsx',
          required: true
        },
        {
          path: '{{name.lower}}.types.ts',
          required: true
        }
      ],
      dependencies: []
    },
    
    assertions: [
      {
        id: 'organism-eslint',
        name: 'ESLint Compliance',
        description: 'Check ESLint rules',
        type: 'eslint',
        config: {
          eslint: {
            rules: {
              'no-console': 'error',
              'react-hooks/rules-of-hooks': 'error',
              'react-hooks/exhaustive-deps': 'warn'
            }
          }
        },
        execution: {
          runOn: 'manual',
          timeout: 30000,
          cache: true,
          parallel: true
        },
        severity: 'error',
        autoFix: true
      },
      {
        id: 'organism-complexity',
        name: 'Complexity Check',
        description: 'Ensure components are not too complex',
        type: 'custom',
        config: {
          custom: {
            script: 'check-complexity',
            args: ['--max', '15'],
            expectedOutput: 'pass'
          }
        },
        execution: {
          runOn: 'manual',
          timeout: 10000,
          cache: true,
          parallel: true
        },
        severity: 'warning'
      }
    ],
    
    metadata: {
      author: 'system',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      tags: ['organisms', 'ui', 'frontend', 'components'],
      documentation: '/docs/module-types/organisms.md'
    }
  },
  
  {
    id: 'api-routes-v1',
    name: 'API Routes',
    description: 'Next.js API route handlers',
    version: '1.0.0',
    
    discovery: {
      basePattern: 'apps/platform/src/app/api',
      instancePattern: '*/route.ts',
      filePatterns: {
        required: [
          'route.ts'
        ],
        optional: [
          'route.test.ts',
          'types.ts',
          'validation.ts'
        ],
        forbidden: [
          '*.tmp'
        ]
      }
    },
    
    structure: {
      folders: [],
      files: [
        {
          path: 'route.ts',
          required: true,
          validation: {
            customValidator: 'api-route-validator'
          }
        }
      ],
      dependencies: []
    },
    
    assertions: [
      {
        id: 'api-eslint',
        name: 'ESLint Compliance',
        description: 'Check ESLint rules for API routes',
        type: 'eslint',
        config: {
          eslint: {
            rules: {
              'no-console': 'warn',
              '@typescript-eslint/no-explicit-any': 'error'
            }
          }
        },
        execution: {
          runOn: 'manual',
          timeout: 30000,
          cache: true,
          parallel: true
        },
        severity: 'error',
        autoFix: true
      },
      {
        id: 'api-validation',
        name: 'Input Validation',
        description: 'Ensure all routes validate input',
        type: 'custom',
        config: {
          custom: {
            script: 'check-api-validation',
            args: [],
            expectedOutput: 'valid'
          }
        },
        execution: {
          runOn: 'manual',
          timeout: 15000,
          cache: false,
          parallel: true
        },
        severity: 'error'
      },
      {
        id: 'api-auth',
        name: 'Authentication Check',
        description: 'Verify authentication is properly implemented',
        type: 'custom',
        config: {
          custom: {
            script: 'check-api-auth',
            args: [],
            expectedOutput: 'protected'
          }
        },
        execution: {
          runOn: 'manual',
          timeout: 10000,
          cache: true,
          parallel: true
        },
        severity: 'warning'
      }
    ],
    
    metadata: {
      author: 'system',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      tags: ['api', 'backend', 'routes', 'nextjs'],
      documentation: '/docs/module-types/api-routes.md'
    }
  },
  
  {
    id: 'services-v1',
    name: 'Backend Services',
    description: 'Business logic services in lib/api',
    version: '1.0.0',
    
    discovery: {
      basePattern: 'apps/platform/src/lib/api',
      instancePattern: '*/*.service.ts',
      filePatterns: {
        required: [
          '*.service.ts'
        ],
        optional: [
          '*.types.ts',
          '*.validation.ts',
          '*.test.ts',
          '*.utils.ts'
        ],
        forbidden: [
          '*.tmp',
          '*.backup'
        ]
      }
    },
    
    structure: {
      folders: [],
      files: [
        {
          path: '{{name}}.service.ts',
          required: true
        }
      ],
      dependencies: []
    },
    
    assertions: [
      {
        id: 'service-eslint',
        name: 'ESLint Compliance',
        description: 'Check ESLint rules for services',
        type: 'eslint',
        config: {
          eslint: {
            rules: {
              'no-console': 'error',
              '@typescript-eslint/no-explicit-any': 'error',
              'no-unused-vars': 'error'
            }
          }
        },
        execution: {
          runOn: 'manual',
          timeout: 30000,
          cache: true,
          parallel: true
        },
        severity: 'error',
        autoFix: true
      },
      {
        id: 'service-tests',
        name: 'Unit Tests',
        description: 'Ensure services have tests',
        type: 'test',
        config: {
          test: {
            runner: 'vitest',
            pattern: '*.test.ts',
            coverage: {
              threshold: 80,
              type: 'lines'
            }
          }
        },
        execution: {
          runOn: 'manual',
          timeout: 60000,
          cache: false,
          parallel: false
        },
        severity: 'error'
      }
    ],
    
    metadata: {
      author: 'system',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      tags: ['services', 'backend', 'business-logic'],
      documentation: '/docs/module-types/services.md'
    }
  }
];