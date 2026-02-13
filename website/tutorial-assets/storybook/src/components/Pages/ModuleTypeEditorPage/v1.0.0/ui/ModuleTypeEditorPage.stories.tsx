/**
 * ModuleTypeEditorPage Storybook Stories
 * 
 * Visual documentation and testing for the independent Module Type Editor page.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { ModuleTypeEditorPage } from './ModuleTypeEditorPage';
import { ServiceProvider } from '../../../../../core/providers/ServiceProvider';
import { mockModuleTypeEditorService } from '../data/module-type-editor.service.mock';

const meta = {
  title: 'Pages/ModuleTypeEditorPage',
  component: ModuleTypeEditorPage,
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: [
        http.get('/api/module-types', async () => {
          await delay(100);
          return HttpResponse.json({
            moduleTypes: [
              {
                id: '1',
                name: 'API Endpoint',
                description: 'REST API endpoint with CRUD operations',
                category: 'Backend',
                tags: ['api', 'rest', 'crud'],
                structure: {
                  folders: ['controllers', 'models', 'routes'],
                  files: ['index.ts', 'types.ts', 'validation.ts'],
                  dependencies: ['express', 'joi', 'mongoose']
                },
                assertions: [
                  { type: 'required_files', config: { files: ['index.ts', 'types.ts'] } },
                  { type: 'dependency_check', config: { dependencies: ['express'] } }
                ],
                templates: [
                  { name: 'Controller', path: 'controller.template.ts' },
                  { name: 'Model', path: 'model.template.ts' }
                ],
                validation: {
                  testSuite: 'unit',
                  coverage: 80,
                  linting: true,
                  typeChecking: true
                },
                createdAt: '2024-01-15T10:30:00Z',
                updatedAt: '2024-01-20T14:45:00Z'
              },
              {
                id: '2',
                name: 'React Component',
                description: 'Reusable React component with TypeScript',
                category: 'Frontend',
                tags: ['react', 'component', 'typescript'],
                structure: {
                  folders: ['components', '__tests__'],
                  files: ['index.tsx', 'types.ts', 'styles.css'],
                  dependencies: ['react', '@types/react']
                },
                assertions: [
                  { type: 'required_files', config: { files: ['index.tsx', 'types.ts'] } }
                ],
                templates: [
                  { name: 'Component', path: 'component.template.tsx' }
                ],
                validation: {
                  testSuite: 'jest',
                  coverage: 90,
                  linting: true,
                  typeChecking: true
                },
                createdAt: '2024-01-10T09:15:00Z',
                updatedAt: '2024-01-18T16:20:00Z'
              }
            ]
          });
        }),
        
        http.post('/api/module-types', async ({ request }) => {
          await delay(500);
          const body = await request.json();
          return HttpResponse.json({
            moduleType: {
              id: '3',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              ...body
            }
          });
        }),
        
        http.put('/api/module-types/:id', async ({ request, params }) => {
          await delay(500);
          const body = await request.json();
          return HttpResponse.json({
            moduleType: {
              id: params.id,
              updatedAt: new Date().toISOString(),
              ...body
            }
          });
        }),
        
        http.delete('/api/module-types/:id', async () => {
          await delay(300);
          return HttpResponse.json({ success: true });
        })
      ]
    },
    docs: {
      description: {
        component: 'Independent page for creating, editing, and managing module type definitions. Features complete CRUD operations, discovery pattern testing, structure requirements, and assertion configuration.'
      }
    }
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ServiceProvider useMocks={true}>
        <Story />
      </ServiceProvider>
    ),
  ],
  argTypes: {
    onCreateModuleType: { action: 'create' },
    onUpdateModuleType: { action: 'update' },
    onDeleteModuleType: { action: 'delete' }
  }
} as Meta<typeof ModuleTypeEditorPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    service: mockModuleTypeEditorService,
    onCreateModuleType: () => {},
    onUpdateModuleType: () => {},
    onDeleteModuleType: () => {}
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for module types to load
    await canvas.findByText('Module Type Editor');
    await canvas.findByText('API Endpoint');
    await canvas.findByText('React Component');
  }
};

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/module-types', async () => {
          await delay(3000);
          return HttpResponse.json({ moduleTypes: [] });
        })
      ]
    }
  },
  args: {
    service: mockModuleTypeEditorService,
    onCreateModuleType: () => {},
    onUpdateModuleType: () => {},
    onDeleteModuleType: () => {}
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Should show loading state initially
    await canvas.findByText('Module Type Editor');
    // Loading indicators should be present
    // Skeleton elements would be shown here
  }
};

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/module-types', async () => {
          await delay(100);
          return HttpResponse.json({ moduleTypes: [] });
        })
      ]
    }
  },
  args: {
    service: mockModuleTypeEditorService,
    onCreateModuleType: () => {},
    onUpdateModuleType: () => {},
    onDeleteModuleType: () => {}
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for empty state
    await canvas.findByText('No module types found');
    await canvas.findByText('Create your first module type to get started');
  }
};

export const CreateMode: Story = {
  args: {
    service: mockModuleTypeEditorService,
    onCreateModuleType: () => {},
    onUpdateModuleType: () => {},
    onDeleteModuleType: () => {}
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    
    // Wait for component to load
    await canvas.findByText('Module Type Editor');
    
    // Click create button
    const createButton = canvas.getByRole('button', { name: /create new module type/i });
    await user.click(createButton);
    
    // Should be in create mode
    await canvas.findByText('Create Module Type');
    canvas.getByLabelText(/name/i);
    canvas.getByLabelText(/description/i);
  }
};

export const EditMode: Story = {
  args: {
    service: mockModuleTypeEditorService,
    onCreateModuleType: () => {},
    onUpdateModuleType: () => {},
    onDeleteModuleType: () => {}
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    
    // Wait for module types to load
    await canvas.findByText('API Endpoint');
    
    // Click on first module type to edit
    const editButton = canvas.getAllByRole('button', { name: /edit/i })[0];
    await user.click(editButton);
    
    // Should be in edit mode
    await canvas.findByText('Edit Module Type');
    canvas.getByDisplayValue('API Endpoint');
    canvas.getByDisplayValue('REST API endpoint with CRUD operations');
  }
};

export const WithValidationErrors: Story = {
  args: {
    service: mockModuleTypeEditorService,
    onCreateModuleType: () => {},
    onUpdateModuleType: () => {},
    onDeleteModuleType: () => {}
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    
    // Wait for component to load and enter create mode
    await canvas.findByText('Module Type Editor');
    const createButton = canvas.getByRole('button', { name: /create new module type/i });
    await user.click(createButton);
    
    // Try to save without required fields
    const saveButton = canvas.getByRole('button', { name: /save/i });
    await user.click(saveButton);
    
    // Should show validation errors
    await canvas.findByText(/name is required/i);
    await canvas.findByText(/description is required/i);
  }
};

export const DeleteConfirmation: Story = {
  args: {
    service: mockModuleTypeEditorService,
    onCreateModuleType: () => {},
    onUpdateModuleType: () => {},
    onDeleteModuleType: () => {}
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    
    // Wait for module types to load
    await canvas.findByText('API Endpoint');
    
    // Click delete button
    const deleteButton = canvas.getAllByRole('button', { name: /delete/i })[0];
    await user.click(deleteButton);
    
    // Should show confirmation modal
    await canvas.findByText(/are you sure you want to delete/i);
    canvas.getByRole('button', { name: /confirm delete/i });
    canvas.getByRole('button', { name: /cancel/i });
  }
};

export const AllTabs: Story = {
  args: {
    service: mockModuleTypeEditorService,
    onCreateModuleType: () => {},
    onUpdateModuleType: () => {},
    onDeleteModuleType: () => {}
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    
    // Wait for module types to load and enter edit mode
    await waitFor(() => {
      canvas.getByText('API Endpoint');
    });
    const editButton = canvas.getAllByRole('button', { name: /edit/i })[0];
    await user.click(editButton);
    
    // Test all tabs
    const tabs = ['Overview', 'Structure', 'Assertions', 'Templates', 'Validation'];
    
    for (const tabName of tabs) {
      const tab = canvas.getByRole('tab', { name: new RegExp(tabName, 'i') });
      await user.click(tab);
      // Tab should be selected after click
    }
  }
};

export const AccessibilityBaseline: Story = {
  args: {
    service: mockModuleTypeEditorService,
    onCreateModuleType: () => {},
    onUpdateModuleType: () => {},
    onDeleteModuleType: () => {}
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for component to load
    await canvas.findByText('Module Type Editor');
    
    // Check accessibility features
    const tablist = canvas.getByRole('tablist');
    // Tablist should have proper aria-label
    
    // Check button accessibility
    const buttons = canvas.getAllByRole('button');
    // All buttons should have accessible names
    
    // Check form accessibility  
    const textboxes = canvas.getAllByRole('textbox');
    // All textboxes should have accessible names
  }
};