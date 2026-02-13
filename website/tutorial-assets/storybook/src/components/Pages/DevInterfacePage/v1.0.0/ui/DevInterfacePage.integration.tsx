import type { Meta, StoryObj } from '@storybook/react';
import { DevInterfacePage } from './DevInterfacePage';
import { vi, expect } from 'vitest';
import { within, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

/**
 * Integration Stories for DevInterfacePage
 * 
 * These stories are designed to test with a real backend API.
 * They will only work properly when Storybook is connected to a running backend.
 * 
 * To run these stories:
 * 1. Ensure the platform backend is running (http://localhost:3000)
 * 2. Select "Dev Backend" from the Data Source toolbar in Storybook
 * 3. These stories will then use real API calls instead of mocks
 */
const meta: Meta<typeof DevInterfacePage> = {
  title: 'Pages/DevInterfacePage/Integration',
  component: DevInterfacePage,
  parameters: {
    layout: 'fullscreen',
    // Disable MSW for these stories to allow real backend calls
    msw: {
      disabled: true
    },
    // Mark these as integration tests
    testLevel: 'integration',
    // Document the backend requirements
    docs: {
      description: {
        component: `
## Integration Tests

These stories test the DevInterfacePage with a real backend API.

### Prerequisites:
- Platform backend running on http://localhost:3000
- Valid API endpoints implemented
- Network connectivity

### How to Use:
1. Start the backend: \`pnpm platform\`
2. Select "Dev Backend" from the Data Source toolbar
3. Run these stories to test real integration
        `
      }
    }
  },
  tags: ['integration', 'backend-required'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Real-time Chat Integration
 * Tests actual Claude Code API interaction
 */
export const LiveChat: Story = {
  name: 'Live Chat with Backend',
  parameters: {
    docs: {
      description: {
        story: 'Tests real-time chat with the actual Claude Code API backend'
      }
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for the component to load
    await waitFor(() => {
      expect(canvas.getByText(/Chat/i)).toBeInTheDocument();
    });
    
    // Switch to chat tab
    const chatTab = canvas.getByRole('button', { name: /chat/i });
    await userEvent.click(chatTab);
    
    // Type a real message
    const input = canvas.getByPlaceholderText(/Type your message/i);
    await userEvent.type(input, 'Hello Claude, what files are in this project?');
    
    // Send the message
    const sendButton = canvas.getByRole('button', { name: /send/i });
    await userEvent.click(sendButton);
    
    // Wait for real response from backend
    await waitFor(
      () => {
        const messages = canvas.getAllByRole('article');
        expect(messages.length).toBeGreaterThan(0);
      },
      { timeout: 10000 } // Allow 10 seconds for real API response
    );
  }
};

/**
 * Live File System Browser
 * Tests actual file system API
 */
export const LiveFileSystem: Story = {
  name: 'Live File System Browser',
  parameters: {
    docs: {
      description: {
        story: 'Browse the actual file system through the backend API'
      }
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Switch to files tab
    const filesTab = canvas.getByRole('button', { name: /files/i });
    await userEvent.click(filesTab);
    
    // Wait for real files to load
    await waitFor(
      () => {
        // Look for actual project folders
        expect(canvas.getByText(/src/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
    
    // Try to expand a real folder
    const srcFolder = canvas.getByText(/src/i);
    await userEvent.click(srcFolder);
    
    // Wait for real subfolder content
    await waitFor(
      () => {
        expect(canvas.getByText(/components/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  }
};

/**
 * Live App Status Monitoring
 * Tests actual process monitoring
 */
export const LiveAppStatus: Story = {
  name: 'Live App Status',
  parameters: {
    docs: {
      description: {
        story: 'Monitor real application status from the backend'
      }
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Switch to apps tab
    const appsTab = canvas.getByRole('button', { name: /apps/i });
    await userEvent.click(appsTab);
    
    // Wait for real app status to load
    await waitFor(
      () => {
        // Check for real app entries
        const platformCard = canvas.getByText(/Platform/i);
        expect(platformCard).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
    
    // Check for real status indicators
    await waitFor(() => {
      // Should show actual running status
      const statusElements = canvas.getAllByText(/running|stopped/i);
      expect(statusElements.length).toBeGreaterThan(0);
    });
  }
};

/**
 * Live Resource Monitoring
 * Tests actual system resource monitoring
 */
export const LiveResourceMonitoring: Story = {
  name: 'Live System Resources',
  parameters: {
    docs: {
      description: {
        story: 'Monitor real system resources from the backend'
      }
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Switch to resources tab
    const resourcesTab = canvas.getByRole('button', { name: /resources/i });
    await userEvent.click(resourcesTab);
    
    // Wait for real resource data
    await waitFor(
      () => {
        // Check for CPU metric
        expect(canvas.getByText(/CPU/i)).toBeInTheDocument();
        // Check for Memory metric
        expect(canvas.getByText(/Memory/i)).toBeInTheDocument();
        // Check for Disk metric
        expect(canvas.getByText(/Disk/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
    
    // Refresh resources
    const refreshButton = canvas.getByRole('button', { name: /refresh/i });
    await userEvent.click(refreshButton);
    
    // Wait for updated data
    await waitFor(
      () => {
        // Check that process list is populated
        const processRows = canvas.getAllByRole('row');
        expect(processRows.length).toBeGreaterThan(1); // Header + at least one process
      },
      { timeout: 5000 }
    );
  }
};

/**
 * Full Integration Flow
 * Tests complete user journey with real backend
 */
export const FullIntegrationFlow: Story = {
  name: 'Complete Integration Flow',
  parameters: {
    docs: {
      description: {
        story: 'Tests a complete user workflow with real backend integration'
      }
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // 1. Start with file browsing
    const filesTab = canvas.getByRole('button', { name: /files/i });
    await userEvent.click(filesTab);
    
    await waitFor(() => {
      expect(canvas.getByText(/src/i)).toBeInTheDocument();
    });
    
    // 2. Check app status
    const appsTab = canvas.getByRole('button', { name: /apps/i });
    await userEvent.click(appsTab);
    
    await waitFor(() => {
      expect(canvas.getByText(/Platform/i)).toBeInTheDocument();
    });
    
    // 3. Monitor resources
    const resourcesTab = canvas.getByRole('button', { name: /resources/i });
    await userEvent.click(resourcesTab);
    
    await waitFor(() => {
      expect(canvas.getByText(/CPU/i)).toBeInTheDocument();
    });
    
    // 4. Chat interaction
    const chatTab = canvas.getByRole('button', { name: /chat/i });
    await userEvent.click(chatTab);
    
    const input = canvas.getByPlaceholderText(/Type your message/i);
    await userEvent.type(input, 'Show me the system status');
    
    const sendButton = canvas.getByRole('button', { name: /send/i });
    await userEvent.click(sendButton);
    
    // Wait for response
    await waitFor(
      () => {
        const messages = canvas.getAllByRole('article');
        expect(messages.length).toBeGreaterThan(0);
      },
      { timeout: 10000 }
    );
  }
};

/**
 * Error Handling with Real Backend
 * Tests error scenarios with actual API
 */
export const BackendErrorHandling: Story = {
  name: 'Backend Error Handling',
  parameters: {
    docs: {
      description: {
        story: 'Tests how the component handles real backend errors'
      }
    }
  },
  args: {
    // You could inject a bad endpoint here to test error handling
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Try to send a message that might fail
    const chatTab = canvas.getByRole('button', { name: /chat/i });
    await userEvent.click(chatTab);
    
    const input = canvas.getByPlaceholderText(/Type your message/i);
    // Send a very long message that might trigger an error
    const longMessage = 'x'.repeat(10000);
    await userEvent.type(input, longMessage);
    
    const sendButton = canvas.getByRole('button', { name: /send/i });
    await userEvent.click(sendButton);
    
    // Check if error is handled gracefully
    await waitFor(
      () => {
        // Should either show error message or handle it gracefully
        const errorMessage = canvas.queryByText(/error/i);
        const messages = canvas.getAllByRole('article');
        expect(errorMessage || messages.length > 0).toBeTruthy();
      },
      { timeout: 5000 }
    );
  }
};

/**
 * Performance Test with Real Data
 * Tests performance with actual backend data
 */
export const PerformanceWithRealData: Story = {
  name: 'Performance Test',
  parameters: {
    docs: {
      description: {
        story: 'Tests component performance with real backend data'
      }
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const startTime = performance.now();
    
    // Rapid tab switching with real data loading
    const tabs = ['files', 'apps', 'resources', 'chat'];
    
    for (const tab of tabs) {
      const tabButton = canvas.getByRole('button', { name: new RegExp(tab, 'i') });
      await userEvent.click(tabButton);
      
      // Wait for content to load
      await waitFor(
        () => {
          // Each tab should load within reasonable time
          const content = canvas.getByRole('tabpanel');
          expect(content).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    // All tabs should load within 10 seconds total
    expect(totalTime).toBeLessThan(10000);
    console.log(`Performance test completed in ${totalTime}ms`);
  }
};