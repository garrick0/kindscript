/**
 * ModuleTypeViewer Storybook Stories
 * 
 * Visual documentation and testing for the Module Type Viewer component.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ModuleTypeViewer } from './ModuleTypeViewer';
import { defaultModuleTypes } from '../data/default-module-types';

const meta = {
  title: 'Pages/MigrationsPage/ModuleTypeViewer',
  component: ModuleTypeViewer,
  parameters: {
    layout: 'fullscreen',
    vitest: {
      testLevel: 'component'
    },
    docs: {
      description: {
        component: 'Interface for viewing and understanding module type definitions including patterns, structure, and assertions.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    },
    moduleTypes: {
      control: false,
      description: 'Array of module types to display'
    }
  }
} as Meta<typeof ModuleTypeViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default view showing all available module types
 */
export const Default: Story = {
  args: {
    className: 'h-screen'
  }
};

/**
 * With custom module types
 */
export const CustomTypes: Story = {
  args: {
    className: 'h-screen',
    moduleTypes: [
      {
        id: 'custom-component',
        name: 'Custom Component',
        description: 'A custom component type for demonstration',
        version: '2.0.0',
        discovery: {
          basePattern: 'src/custom',
          instancePattern: '*/v*',
          filePatterns: {
            required: ['Component.tsx'],
            optional: ['Component.test.tsx', 'Component.stories.tsx'],
            forbidden: ['*.backup']
          }
        },
        structure: {
          folders: [
            {
              path: 'hooks',
              required: false,
              description: 'Custom hooks'
            }
          ],
          files: [
            {
              path: 'Component.tsx',
              required: true,
              validation: {
                schema: 'react-component'
              }
            }
          ],
          dependencies: []
        },
        assertions: [
          {
            id: 'custom-lint',
            name: 'Custom Linting',
            description: 'Custom linting rules',
            type: 'eslint',
            config: {
              eslint: {
                rules: {
                  'custom-rule': 'error'
                }
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
          author: 'demo',
          createdAt: '2025-01-15T00:00:00Z',
          updatedAt: '2025-01-15T00:00:00Z',
          tags: ['custom', 'demo', 'component'],
          documentation: '/docs/custom-components'
        }
      }
    ]
  }
};

/**
 * Empty state when no module types are available
 */
export const EmptyState: Story = {
  args: {
    className: 'h-screen',
    moduleTypes: []
  }
};

/**
 * With many module types for testing search and filtering
 */
export const ManyTypes: Story = {
  args: {
    className: 'h-screen',
    moduleTypes: [
      ...defaultModuleTypes,
      // Add some additional types for variety
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `extra-type-${i}`,
        name: `Extra Type ${i + 1}`,
        description: `Additional module type ${i + 1} for testing purposes`,
        version: '1.0.0',
        discovery: {
          basePattern: `src/extra-${i}`,
          instancePattern: '*/v*',
          filePatterns: {
            required: [`Type${i}.tsx`],
            optional: [`Type${i}.test.tsx`],
            forbidden: []
          }
        },
        structure: {
          folders: [],
          files: [{
            path: `Type${i}.tsx`,
            required: true
          }],
          dependencies: []
        },
        assertions: [{
          id: `extra-assertion-${i}`,
          name: `Extra Assertion ${i}`,
          description: `Test assertion ${i}`,
          type: 'eslint',
          config: {
            eslint: {
              rules: {}
            }
          },
          execution: {
            runOn: 'manual',
            timeout: 5000,
            cache: true,
            parallel: true
          },
          severity: 'info'
        }],
        metadata: {
          author: 'system',
          createdAt: '2025-01-15T00:00:00Z',
          updatedAt: '2025-01-15T00:00:00Z',
          tags: ['extra', 'testing', i % 2 === 0 ? 'even' : 'odd'],
          documentation: `/docs/extra-type-${i}`
        }
      }))
    ]
  }
};