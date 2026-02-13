import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { DevInterfacePage } from './ui/DevInterfacePage';
import { setupServer } from 'msw/node';
import { http, HttpResponse, delay } from 'msw';
import type { AppInfo, CodeFile } from './ui/DevInterfacePage';

// Mock server for API integration testing
const mockApps: AppInfo[] = [
  {
    id: 'platform',
    name: 'Platform (Next.js)',
    description: 'Main Next.js application server',
    status: 'running',
    port: 3000,
    pid: 12345,
    uptime: 7200,
    lastRestart: new Date('2025-01-01T10:00:00Z')
  },
  {
    id: 'storybook',
    name: 'Storybook',
    description: 'Component development environment',
    status: 'stopped',
    port: 6006
  },
  {
    id: 'studio',
    name: 'Studio (Artifact Viewer)',
    description: 'Release artifact viewer and explorer',
    status: 'error',
    port: 6007
  }
];

const mockFiles: CodeFile[] = [
  {
    id: 'apps',
    name: 'apps',
    path: '/apps',
    type: 'folder',
    children: [
      {
        id: 'platform',
        name: 'platform',
        path: '/apps/platform',
        type: 'folder',
        children: [
          {
            id: 'package_json',
            name: 'package.json',
            path: '/apps/platform/package.json',
            type: 'file'
          }
        ]
      }
    ]
  },
  {
    id: 'readme',
    name: 'README.md',
    path: '/README.md',
    type: 'file'
  }
];

let appStates = { ...mockApps.reduce((acc, app) => ({ ...acc, [app.id]: app }), {}) };

const server = setupServer(
  // Apps API
  http.get('/api/dev-interface/apps', () => {
    return HttpResponse.json({ 
      apps: Object.values(appStates),
      timestamp: new Date().toISOString()
    });
  }),

  http.post('/api/dev-interface/apps/:id/start', async ({ params }) => {
    await delay(100); // Simulate API delay
    const appId = params.id as string;
    
    if (!appStates[appId]) {
      return new HttpResponse(null, { status: 404 });
    }

    appStates[appId] = {
      ...appStates[appId],
      status: 'running',
      pid: Math.floor(Math.random() * 10000) + 1000,
      uptime: 0,
      lastRestart: new Date()
    };

    return HttpResponse.json({
      app: appStates[appId],
      message: `Started ${appStates[appId].name} successfully`
    });
  }),

  http.post('/api/dev-interface/apps/:id/stop', async ({ params }) => {
    await delay(100);
    const appId = params.id as string;
    
    if (!appStates[appId]) {
      return new HttpResponse(null, { status: 404 });
    }

    appStates[appId] = {
      ...appStates[appId],
      status: 'stopped',
      pid: undefined,
      uptime: undefined
    };

    return HttpResponse.json({
      app: appStates[appId],
      message: `Stopped ${appStates[appId].name} successfully`
    });
  }),

  http.post('/api/dev-interface/apps/:id/restart', async ({ params }) => {
    await delay(150); // Restart takes a bit longer
    const appId = params.id as string;
    
    if (!appStates[appId]) {
      return new HttpResponse(null, { status: 404 });
    }

    appStates[appId] = {
      ...appStates[appId],
      status: 'running',
      pid: Math.floor(Math.random() * 10000) + 1000,
      uptime: 0,
      lastRestart: new Date()
    };

    return HttpResponse.json({
      app: appStates[appId],
      message: `Restarted ${appStates[appId].name} successfully`
    });
  }),

  // Files API
  http.get('/api/dev-interface/files', () => {
    return HttpResponse.json({
      files: mockFiles,
      root: '/mock/project',
      timestamp: new Date().toISOString()
    });
  }),

  http.get('/api/dev-interface/files/search', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.toLowerCase() || '';
    
    const searchResults = mockFiles.filter(file => 
      file.name.toLowerCase().includes(query) ||
      file.path.toLowerCase().includes(query)
    );

    return HttpResponse.json({
      files: searchResults,
      query,
      count: searchResults.length,
      timestamp: new Date().toISOString()
    });
  }),

  http.get('/api/dev-interface/files/content', ({ request }) => {
    const url = new URL(request.url);
    const path = url.searchParams.get('path');
    
    let content = '// Mock file content\nconst example = "Hello World";';
    
    if (path?.endsWith('.json')) {
      content = '{\n  "name": "mock-package",\n  "version": "1.0.0"\n}';
    } else if (path?.endsWith('.md')) {
      content = '# Mock README\n\nThis is a mock README file.';
    }

    return HttpResponse.json({
      content,
      path,
      size: content.length,
      encoding: 'utf-8',
      timestamp: new Date().toISOString()
    });
  }),

  // Chat API
  http.post('/api/dev-interface/chat', async ({ request }) => {
    await delay(200);
    const body = await request.json() as { message: string; context: any[] };
    
    let response = "I'd be happy to help you with that! Based on your codebase structure, I can provide assistance with development tasks.";
    
    const message = body.message.toLowerCase();
    if (message.includes('debug')) {
      response = "I can help you debug that issue. Please share the specific error message or describe what's not working as expected.";
    } else if (message.includes('implement')) {
      response = "Let me help you implement that feature. Can you describe what you'd like to build?";
    }

    return HttpResponse.json({
      response,
      timestamp: new Date().toISOString()
    });
  })
);

describe('DevInterfacePage Integration Tests', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    // Reset app states before each test
    appStates = {
      platform: {
        id: 'platform',
        name: 'Platform (Next.js)',
        description: 'Main Next.js application server',
        status: 'running',
        port: 3000,
        pid: 12345,
        uptime: 7200,
        lastRestart: new Date('2025-01-01T10:00:00Z')
      },
      storybook: {
        id: 'storybook',
        name: 'Storybook',
        description: 'Component development environment',
        status: 'stopped',
        port: 6006
      },
      studio: {
        id: 'studio',
        name: 'Studio (Artifact Viewer)',
        description: 'Release artifact viewer and explorer',
        status: 'error',
        port: 6007
      }
    };
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('App Management Integration', () => {
    it('loads app status on mount and displays correctly', async () => {
      render(<DevInterfacePage initialApps={mockApps} initialFiles={mockFiles} />);

      const user = userEvent.setup();
      
      // Switch to Apps tab
      await user.click(screen.getByRole('button', { name: /apps/i }));

      // Wait for apps to load
      await waitFor(() => {
        expect(screen.getByText('Platform (Next.js)')).toBeInTheDocument();
        expect(screen.getByText('Storybook')).toBeInTheDocument();
        expect(screen.getByText('Studio (Artifact Viewer)')).toBeInTheDocument();
      });

      // Verify statuses are displayed
      expect(screen.getByText('running')).toBeInTheDocument();
      expect(screen.getByText('stopped')).toBeInTheDocument();
      expect(screen.getByText('error')).toBeInTheDocument();

      // Verify app details
      expect(screen.getByText('3000')).toBeInTheDocument(); // Platform port
      expect(screen.getByText('12345')).toBeInTheDocument(); // Platform PID
    });

    it('starts a stopped application successfully', async () => {
      render(<DevInterfacePage initialApps={mockApps} initialFiles={mockFiles} />);
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /apps/i }));
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Storybook')).toBeInTheDocument();
      });

      // Find the Start button for Storybook (stopped app)
      const storybookSection = screen.getByText('Storybook').closest('div');
      const startButton = within(storybookSection!).getByRole('button', { name: /start/i });

      expect(startButton).toBeInTheDocument();
      expect(startButton).not.toBeDisabled();

      // Click start button
      await user.click(startButton);

      // Button should become disabled during operation
      expect(startButton).toBeDisabled();

      // Wait for app to start and status to update
      await waitFor(() => {
        const runningBadges = screen.getAllByText('running');
        expect(runningBadges).toHaveLength(2); // Platform + newly started Storybook
      }, { timeout: 3000 });

      // Should show Stop and Restart buttons instead of Start
      await waitFor(() => {
        expect(within(storybookSection!).getByRole('button', { name: /stop/i })).toBeInTheDocument();
        expect(within(storybookSection!).getByRole('button', { name: /restart/i })).toBeInTheDocument();
        expect(within(storybookSection!).queryByRole('button', { name: /start/i })).not.toBeInTheDocument();
      });
    });

    it('stops a running application successfully', async () => {
      render(<DevInterfacePage initialApps={mockApps} initialFiles={mockFiles} />);
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /apps/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Platform (Next.js)')).toBeInTheDocument();
      });

      // Find the Stop button for Platform (running app)
      const platformSection = screen.getByText('Platform (Next.js)').closest('div');
      const stopButton = within(platformSection!).getByRole('button', { name: /stop/i });

      await user.click(stopButton);

      // Wait for app to stop
      await waitFor(() => {
        const runningBadges = screen.queryAllByText('running');
        expect(runningBadges).toHaveLength(0); // No apps should be running now
      }, { timeout: 3000 });

      // Should show Start button instead of Stop/Restart
      await waitFor(() => {
        expect(within(platformSection!).getByRole('button', { name: /start/i })).toBeInTheDocument();
        expect(within(platformSection!).queryByRole('button', { name: /stop/i })).not.toBeInTheDocument();
        expect(within(platformSection!).queryByRole('button', { name: /restart/i })).not.toBeInTheDocument();
      });
    });

    it('restarts a running application successfully', async () => {
      render(<DevInterfacePage initialApps={mockApps} initialFiles={mockFiles} />);
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /apps/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Platform (Next.js)')).toBeInTheDocument();
      });

      const platformSection = screen.getByText('Platform (Next.js)').closest('div');
      const restartButton = within(platformSection!).getByRole('button', { name: /restart/i });

      // Note the original PID
      expect(screen.getByText('12345')).toBeInTheDocument();

      await user.click(restartButton);

      // Wait for app to restart (should get new PID)
      await waitFor(() => {
        expect(screen.queryByText('12345')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Should still be running but with new process info
      expect(screen.getByText('running')).toBeInTheDocument();
    });

    it('refreshes app status when refresh button is clicked', async () => {
      render(<DevInterfacePage initialApps={mockApps} initialFiles={mockFiles} />);
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /apps/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Application Status')).toBeInTheDocument();
      });

      // Find refresh button (has no text, just icon)
      const refreshButtons = screen.getAllByRole('button');
      const refreshButton = refreshButtons.find(button => 
        button.querySelector('[data-testid="refresh-icon"]') || 
        (button.querySelector('svg') && !button.textContent?.trim())
      );

      if (refreshButton) {
        await user.click(refreshButton);
        
        // Verify apps are still displayed (refresh was successful)
        await waitFor(() => {
          expect(screen.getByText('Platform (Next.js)')).toBeInTheDocument();
        });
      }
    });

    it('handles app management errors gracefully', async () => {
      // Make the start API fail
      server.use(
        http.post('/api/dev-interface/apps/storybook/start', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      render(<DevInterfacePage initialApps={mockApps} initialFiles={mockFiles} />);
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /apps/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Storybook')).toBeInTheDocument();
      });

      const storybookSection = screen.getByText('Storybook').closest('div');
      const startButton = within(storybookSection!).getByRole('button', { name: /start/i });

      await user.click(startButton);

      // App should remain stopped (since API failed)
      await waitFor(() => {
        expect(screen.getByText('stopped')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('displays appropriate buttons based on app status', async () => {
      render(<DevInterfacePage initialApps={mockApps} initialFiles={mockFiles} />);
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /apps/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Platform (Next.js)')).toBeInTheDocument();
        expect(screen.getByText('Storybook')).toBeInTheDocument();
        expect(screen.getByText('Studio (Artifact Viewer)')).toBeInTheDocument();
      });

      // Running app (Platform) should have Stop and Restart buttons
      const platformSection = screen.getByText('Platform (Next.js)').closest('div');
      expect(within(platformSection!).getByRole('button', { name: /stop/i })).toBeInTheDocument();
      expect(within(platformSection!).getByRole('button', { name: /restart/i })).toBeInTheDocument();
      expect(within(platformSection!).queryByRole('button', { name: /start/i })).not.toBeInTheDocument();

      // Stopped app (Storybook) should have Start button only
      const storybookSection = screen.getByText('Storybook').closest('div');
      expect(within(storybookSection!).getByRole('button', { name: /start/i })).toBeInTheDocument();
      expect(within(storybookSection!).queryByRole('button', { name: /stop/i })).not.toBeInTheDocument();
      expect(within(storybookSection!).queryByRole('button', { name: /restart/i })).not.toBeInTheDocument();

      // Error app (Studio) should have Restart button only
      const studioSection = screen.getByText('Studio (Artifact Viewer)').closest('div');
      expect(within(studioSection!).getByRole('button', { name: /restart/i })).toBeInTheDocument();
      expect(within(studioSection!).queryByRole('button', { name: /start/i })).not.toBeInTheDocument();
      expect(within(studioSection!).queryByRole('button', { name: /stop/i })).not.toBeInTheDocument();
    });
  });

  describe('File Browser Integration', () => {
    it('loads and displays file tree', async () => {
      render(<DevInterfacePage initialApps={mockApps} initialFiles={mockFiles} />);
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /files/i }));

      await waitFor(() => {
        expect(screen.getByText('apps')).toBeInTheDocument();
        expect(screen.getByText('README.md')).toBeInTheDocument();
      });
    });

    it('searches files and filters results', async () => {
      render(<DevInterfacePage initialApps={mockApps} initialFiles={mockFiles} />);
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /files/i }));

      const searchInput = screen.getByPlaceholderText('Search files...');
      await user.type(searchInput, 'apps');

      await waitFor(() => {
        expect(screen.getByText('apps')).toBeInTheDocument();
        // README.md should not be shown in search results
        expect(screen.queryByText('README.md')).not.toBeInTheDocument();
      });
    });

    it('loads file content when file is selected', async () => {
      render(<DevInterfacePage initialApps={mockApps} initialFiles={mockFiles} />);
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /files/i }));

      await waitFor(() => {
        expect(screen.getByText('README.md')).toBeInTheDocument();
      });

      // Click on README.md file
      await user.click(screen.getByText('README.md'));

      // Wait for file content to be displayed in right panel
      await waitFor(() => {
        expect(screen.getByText('# Mock README')).toBeInTheDocument();
      });
    });
  });

  describe('Chat Integration', () => {
    it('sends and receives chat messages', async () => {
      render(<DevInterfacePage initialApps={mockApps} initialFiles={mockFiles} />);
      const user = userEvent.setup();

      // Chat tab is active by default
      const chatInput = screen.getByPlaceholderText('Ask Claude Code anything...');
      await user.type(chatInput, 'Help me debug an error');

      const sendButton = screen.getByRole('button', { name: '' }); // Send button (icon only)
      await user.click(sendButton);

      // Should show user message
      await waitFor(() => {
        expect(screen.getByText('Help me debug an error')).toBeInTheDocument();
      });

      // Should receive response
      await waitFor(() => {
        expect(screen.getByText(/I can help you debug that issue/)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Input should be cleared
      expect(chatInput).toHaveValue('');
    });

    it('handles different types of user queries', async () => {
      render(<DevInterfacePage initialApps={mockApps} initialFiles={mockFiles} />);
      const user = userEvent.setup();

      const chatInput = screen.getByPlaceholderText('Ask Claude Code anything...');
      
      // Test implementation query
      await user.type(chatInput, 'Help me implement a new feature');
      await user.click(screen.getByRole('button', { name: '' }));

      await waitFor(() => {
        expect(screen.getByText(/Let me help you implement that feature/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Cross-tab Interactions', () => {
    it('maintains state when switching between tabs', async () => {
      render(<DevInterfacePage initialApps={mockApps} initialFiles={mockFiles} />);
      const user = userEvent.setup();

      // Start in Chat, send a message
      const chatInput = screen.getByPlaceholderText('Ask Claude Code anything...');
      await user.type(chatInput, 'Test message');
      await user.click(screen.getByRole('button', { name: '' }));

      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });

      // Switch to Apps tab
      await user.click(screen.getByRole('button', { name: /apps/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Platform (Next.js)')).toBeInTheDocument();
      });

      // Switch back to Chat
      await user.click(screen.getByRole('button', { name: /chat/i }));

      // Message should still be there
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('loads data independently for each tab', async () => {
      render(<DevInterfacePage initialApps={mockApps} initialFiles={mockFiles} />);
      const user = userEvent.setup();

      // Switch to Files tab - should load files
      await user.click(screen.getByRole('button', { name: /files/i }));
      await waitFor(() => {
        expect(screen.getByText('apps')).toBeInTheDocument();
      });

      // Switch to Apps tab - should load apps
      await user.click(screen.getByRole('button', { name: /apps/i }));
      await waitFor(() => {
        expect(screen.getByText('Platform (Next.js)')).toBeInTheDocument();
      });

      // Both should be loaded and available when switching back
      await user.click(screen.getByRole('button', { name: /files/i }));
      expect(screen.getByText('apps')).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('recovers from API failures gracefully', async () => {
      // Make apps API fail initially
      server.use(
        http.get('/api/dev-interface/apps', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      render(<DevInterfacePage initialApps={mockApps} initialFiles={mockFiles} />);
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /apps/i }));

      // Should still show something (mock data fallback)
      await waitFor(() => {
        expect(screen.getByText('Platform (Next.js)')).toBeInTheDocument();
      });

      // Reset the API to work again
      server.resetHandlers();

      // Click refresh
      const refreshButtons = screen.getAllByRole('button');
      const refreshButton = refreshButtons.find(button => 
        button.querySelector('svg') && !button.textContent?.trim()
      );

      if (refreshButton) {
        await user.click(refreshButton);
        
        await waitFor(() => {
          expect(screen.getByText('Platform (Next.js)')).toBeInTheDocument();
        });
      }
    });
  });
});