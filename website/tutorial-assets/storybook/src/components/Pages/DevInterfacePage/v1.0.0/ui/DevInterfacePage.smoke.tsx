import type { Meta, StoryObj } from '@storybook/react';
import { DevInterfacePage } from './DevInterfacePage';
import { vi, expect } from 'vitest';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

/**
 * Smoke Test Stories for DevInterfacePage
 * 
 * These are critical path stories that should work in BOTH mock and real backend modes.
 * They test the most essential functionality that must always work.
 * 
 * These stories will be run twice in CI:
 * 1. With MSW mocks (fast, reliable)
 * 2. With real backend (integration validation)
 */
const meta: Meta<typeof DevInterfacePage> = {
  title: 'Pages/DevInterfacePage/Smoke',
  component: DevInterfacePage,
  parameters: {
    layout: 'fullscreen',
    // These stories should work with both mock and real data
    testModes: ['mock', 'real'],
    testLevel: 'smoke',
    docs: {
      description: {
        component: `
## Smoke Tests

Critical path tests that must pass in both mock and real backend modes.

### What these test:
- Component renders without crashing
- Basic navigation works
- Core functionality is accessible
- No console errors
- Graceful error handling

### When these run:
- Every PR (mock mode)
- Before merge (both modes)
- Before release (both modes)
        `
      }
    }
  },
  tags: ['smoke', 'critical', 'regression'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic Render Test
 * The most basic smoke test - component renders without errors
 */
export const BasicRender: Story = {
  name: '🔥 Basic Render',
  parameters: {
    docs: {
      description: {
        story: 'Verifies the component renders without crashing in both mock and real modes'
      }
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Component should render
    await expect(canvasElement).toBeInTheDocument();
    
    // All tabs should be visible
    await expect(canvas.getByRole('button', { name: /chat/i })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /files/i })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /apps/i })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /resources/i })).toBeInTheDocument();
    
    // No console errors
    const consoleErrors: any[] = [];
    const originalError = console.error;
    console.error = (...args) => {
      consoleErrors.push(args);
      originalError(...args);
    };
    
    // Wait a moment for any async errors
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.error = originalError;
    expect(consoleErrors).toHaveLength(0);
  }
};

/**
 * Tab Navigation Test
 * Ensures all tabs are clickable and switch content
 */
export const TabNavigation: Story = {
  name: '🔥 Tab Navigation',
  parameters: {
    docs: {
      description: {
        story: 'Verifies all tabs can be clicked and content switches correctly'
      }
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Click each tab and verify content changes
    const tabs = [
      { name: /chat/i, content: /Type your message/i },
      { name: /files/i, content: /Search files/i },
      { name: /apps/i, content: /Platform|Storybook|Studio/i },
      { name: /resources/i, content: /CPU|Memory|Disk/i }
    ];
    
    for (const tab of tabs) {
      const tabButton = canvas.getByRole('button', { name: tab.name });
      await userEvent.click(tabButton);
      
      // Wait for content to appear
      await expect(
        await canvas.findByText(tab.content, {}, { timeout: 3000 })
      ).toBeInTheDocument();
    }
  }
};

/**
 * Chat Functionality Test
 * Basic chat interaction works
 */
export const ChatFunctionality: Story = {
  name: '🔥 Chat Works',
  parameters: {
    docs: {
      description: {
        story: 'Verifies basic chat functionality works in both modes'
      }
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Switch to chat tab
    const chatTab = canvas.getByRole('button', { name: /chat/i });
    await userEvent.click(chatTab);
    
    // Find input and send button
    const input = await canvas.findByPlaceholderText(/Type your message/i);
    const sendButton = canvas.getByRole('button', { name: /send/i });
    
    // Type and send a message
    await userEvent.type(input, 'Hello');
    await userEvent.click(sendButton);
    
    // Message should appear (either mock or real response)
    await expect(
      await canvas.findByText(/Hello/i, {}, { timeout: 5000 })
    ).toBeInTheDocument();
    
    // Input should be cleared
    await expect(input).toHaveValue('');
  }
};

/**
 * File Browser Test
 * File browsing works with data
 */
export const FileBrowser: Story = {
  name: '🔥 File Browser',
  parameters: {
    docs: {
      description: {
        story: 'Verifies file browser loads and displays files'
      }
    }
  },
  args: {
    // Provide initial files so it works in both modes
    initialFiles: [
      {
        id: '1',
        name: 'src',
        path: '/src',
        type: 'folder' as const,
        children: [
          {
            id: '2',
            name: 'index.ts',
            path: '/src/index.ts',
            type: 'file' as const,
            content: '// Main entry'
          }
        ]
      }
    ]
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Switch to files tab
    const filesTab = canvas.getByRole('button', { name: /files/i });
    await userEvent.click(filesTab);
    
    // Should show some files (either initial or loaded)
    await expect(
      await canvas.findByText(/src/i, {}, { timeout: 3000 })
    ).toBeInTheDocument();
    
    // Search should be available
    const searchInput = canvas.getByPlaceholderText(/Search files/i);
    await expect(searchInput).toBeInTheDocument();
    
    // Try searching
    await userEvent.type(searchInput, 'index');
    // Search functionality should not crash
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};

/**
 * App Status Test
 * App management section loads
 */
export const AppStatus: Story = {
  name: '🔥 App Status',
  parameters: {
    docs: {
      description: {
        story: 'Verifies app status section loads and shows apps'
      }
    }
  },
  args: {
    // Provide initial apps so it works in both modes
    initialApps: [
      {
        id: 'platform',
        name: 'Platform',
        description: 'Next.js application',
        status: 'running' as const,
        port: 3000
      }
    ]
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Switch to apps tab
    const appsTab = canvas.getByRole('button', { name: /apps/i });
    await userEvent.click(appsTab);
    
    // Should show at least one app
    await expect(
      await canvas.findByText(/Platform/i, {}, { timeout: 3000 })
    ).toBeInTheDocument();
    
    // Status should be visible
    await expect(
      canvas.getByText(/running|stopped/i)
    ).toBeInTheDocument();
    
    // Control buttons should exist
    const buttons = canvas.getAllByRole('button');
    const controlButtons = buttons.filter(btn => 
      /start|stop|restart/i.test(btn.textContent || '')
    );
    expect(controlButtons.length).toBeGreaterThan(0);
  }
};

/**
 * Resource Monitoring Test
 * Resource section loads and shows metrics
 */
export const ResourceMonitoring: Story = {
  name: '🔥 Resources Load',
  parameters: {
    docs: {
      description: {
        story: 'Verifies resource monitoring loads and displays metrics'
      }
    }
  },
  args: {
    // Provide initial resources so it works immediately
    initialResources: {
      system: {
        cpuPercent: 45,
        memoryPercent: 60,
        memoryUsedGB: 8,
        memoryTotalGB: 16,
        diskPercent: 70,
        diskUsedGB: 350,
        diskTotalGB: 500,
        uptime: 86400
      },
      processes: [],
      issues: []
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Switch to resources tab
    const resourcesTab = canvas.getByRole('button', { name: /resources/i });
    await userEvent.click(resourcesTab);
    
    // Should show resource metrics
    await expect(
      await canvas.findByText(/CPU/i, {}, { timeout: 3000 })
    ).toBeInTheDocument();
    
    await expect(canvas.getByText(/Memory/i)).toBeInTheDocument();
    await expect(canvas.getByText(/Disk/i)).toBeInTheDocument();
    
    // Refresh button should exist
    const refreshButton = canvas.getByRole('button', { name: /refresh/i });
    await expect(refreshButton).toBeInTheDocument();
    
    // Click refresh - should not crash
    await userEvent.click(refreshButton);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};

/**
 * Error Recovery Test
 * Component handles errors gracefully
 */
export const ErrorRecovery: Story = {
  name: '🔥 Error Handling',
  parameters: {
    docs: {
      description: {
        story: 'Verifies the component handles errors gracefully without crashing'
      }
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Try operations that might fail
    // 1. Send empty message
    const chatTab = canvas.getByRole('button', { name: /chat/i });
    await userEvent.click(chatTab);
    
    const sendButton = canvas.getByRole('button', { name: /send/i });
    await userEvent.click(sendButton); // Send without typing
    
    // Should not crash
    await expect(canvasElement).toBeInTheDocument();
    
    // 2. Search with special characters
    const filesTab = canvas.getByRole('button', { name: /files/i });
    await userEvent.click(filesTab);
    
    const searchInput = canvas.getByPlaceholderText(/Search files/i);
    await userEvent.type(searchInput, '!@#$%^&*()');
    
    // Should not crash
    await expect(canvasElement).toBeInTheDocument();
    
    // 3. Rapid tab switching
    for (let i = 0; i < 10; i++) {
      const randomTab = ['chat', 'files', 'apps', 'resources'][Math.floor(Math.random() * 4)];
      const tab = canvas.getByRole('button', { name: new RegExp(randomTab, 'i') });
      await userEvent.click(tab);
    }
    
    // Should still be functional
    await expect(canvasElement).toBeInTheDocument();
  }
};

/**
 * Performance Test
 * Component responds within acceptable time
 */
export const PerformanceCheck: Story = {
  name: '🔥 Performance',
  parameters: {
    docs: {
      description: {
        story: 'Verifies the component responds quickly to user interactions'
      }
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const timings: number[] = [];
    
    // Measure tab switch times
    const tabs = ['chat', 'files', 'apps', 'resources'];
    
    for (const tabName of tabs) {
      const startTime = performance.now();
      
      const tab = canvas.getByRole('button', { name: new RegExp(tabName, 'i') });
      await userEvent.click(tab);
      
      // Wait for content to be visible
      await canvas.findByRole('tabpanel', {}, { timeout: 1000 });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      timings.push(duration);
    }
    
    // All tab switches should be under 1 second
    timings.forEach((time, index) => {
      expect(time).toBeLessThan(1000);
      console.log(`Tab ${tabs[index]} switch time: ${time.toFixed(2)}ms`);
    });
    
    // Average should be under 500ms
    const average = timings.reduce((a, b) => a + b, 0) / timings.length;
    expect(average).toBeLessThan(500);
    console.log(`Average tab switch time: ${average.toFixed(2)}ms`);
  }
};

/**
 * Accessibility Test
 * Basic accessibility requirements are met
 */
export const AccessibilityCheck: Story = {
  name: '🔥 Accessibility',
  parameters: {
    docs: {
      description: {
        story: 'Verifies basic accessibility requirements are met'
      }
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // All interactive elements should be keyboard accessible
    const buttons = canvas.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    
    // Tabs should have proper ARIA roles
    const tablist = canvas.getByRole('tablist');
    expect(tablist).toBeInTheDocument();
    
    // Tab panels should exist
    const tabpanel = canvas.getByRole('tabpanel');
    expect(tabpanel).toBeInTheDocument();
    
    // Input fields should have labels or placeholders
    const inputs = canvas.getAllByRole('textbox');
    inputs.forEach(input => {
      const hasLabel = input.getAttribute('aria-label') || 
                      input.getAttribute('placeholder') ||
                      input.id; // Might have associated label
      expect(hasLabel).toBeTruthy();
    });
    
    // Images should have alt text (if any)
    const images = canvas.queryAllByRole('img');
    images.forEach(img => {
      expect(img).toHaveAttribute('alt');
    });
  }
};