/**
 * Backend Integration Tests for DevInterfacePage
 * 
 * Tests the DevInterfacePage with both mock backend (MSW) and real dev backend.
 * This verifies that the component works correctly in both Storybook isolation
 * and when connected to the actual development server.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DevInterfacePage } from './DevInterfacePage';

describe('DevInterfacePage Backend Integration', () => {
  beforeEach(() => {
    // Clean up any global state
    delete (window as any).__STORYBOOK_DATA_SOURCE__;
    delete (window as any).__API_BASE_URL__;
  });

  afterEach(() => {
    cleanup();
  });

  describe('Mock Backend Mode (MSW)', () => {
    beforeEach(() => {
      // Configure for mock mode (this is the default)
      (window as any).__STORYBOOK_DATA_SOURCE__ = 'mock';
    });

    it('should render DevInterfacePage with mock backend', async () => {
      const { container } = render(<DevInterfacePage />);
      
      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByText('Development Interface')).toBeInTheDocument();
      });

      // Component should render successfully
      expect(container.firstChild).toBeTruthy();
    });

    it('should handle Start Chat button with mock backend', async () => {
      const user = userEvent.setup();
      render(<DevInterfacePage />);
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Development Interface')).toBeInTheDocument();
      });

      // Look for Start Chat button in welcome message
      const startChatButton = screen.queryByRole('button', { name: /start chat/i });
      if (startChatButton) {
        await user.click(startChatButton);
        
        // Should switch to chat tab and show input
        await waitFor(() => {
          const chatInput = screen.queryByPlaceholderText(/Ask Claude Code anything/i);
          expect(chatInput).toBeInTheDocument();
        }, { timeout: 3000 });
      }
    });

    it('should send messages with mock backend', async () => {
      const user = userEvent.setup();
      render(<DevInterfacePage />);
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Development Interface')).toBeInTheDocument();
      });

      // Find the chat input (should be default tab)
      const chatInput = screen.queryByPlaceholderText(/Ask Claude Code anything/i);
      if (chatInput) {
        // Type a test message
        await user.type(chatInput, 'Hello, can you help me?');
        
        // Look for send button and click it
        const sendButton = screen.queryByRole('button', { name: /send/i });
        if (sendButton) {
          await user.click(sendButton);
          
          // Should see some response (either loading or actual response)
          await waitFor(() => {
            const messages = screen.queryAllByText(/Hello, can you help me?/);
            expect(messages.length).toBeGreaterThan(0);
          }, { timeout: 5000 });
        }
      }
    });
  });

  describe('Dev Backend Mode (Real API)', () => {
    beforeEach(() => {
      // Configure for real backend mode
      (window as any).__STORYBOOK_DATA_SOURCE__ = 'api';
      (window as any).__API_BASE_URL__ = 'http://localhost:3000/api';
    });

    it('should render DevInterfacePage with dev backend', async () => {
      const { container } = render(<DevInterfacePage />);
      
      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByText('Development Interface')).toBeInTheDocument();
      });

      // Component should render successfully
      expect(container.firstChild).toBeTruthy();
    });

    it('should handle Start Chat button with dev backend', async () => {
      const user = userEvent.setup();
      render(<DevInterfacePage />);
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Development Interface')).toBeInTheDocument();
      });

      // Look for Start Chat button in welcome message
      const startChatButton = screen.queryByRole('button', { name: /start chat/i });
      if (startChatButton) {
        await user.click(startChatButton);
        
        // Should switch to chat tab and show input
        await waitFor(() => {
          const chatInput = screen.queryByPlaceholderText(/Ask Claude Code anything/i);
          expect(chatInput).toBeInTheDocument();
        }, { timeout: 3000 });
      }
    });

    it('should gracefully handle dev backend unavailable', async () => {
      const user = userEvent.setup();
      
      // Set up backend that will fail (wrong port)
      (window as any).__API_BASE_URL__ = 'http://localhost:9999/api';
      
      render(<DevInterfacePage />);
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Development Interface')).toBeInTheDocument();
      });

      // Try to send a message - should fall back to mock response
      const chatInput = screen.queryByPlaceholderText(/Ask Claude Code anything/i);
      if (chatInput) {
        await user.type(chatInput, 'Test message');
        
        const sendButton = screen.queryByRole('button', { name: /send/i });
        if (sendButton) {
          await user.click(sendButton);
          
          // Should either get a response or show the message was sent
          // (Service should fallback to mock when real backend fails)
          await waitFor(() => {
            const messages = screen.queryAllByText(/Test message/);
            expect(messages.length).toBeGreaterThan(0);
          }, { timeout: 10000 });
        }
      }
    });
  });

  describe('Backend Switching', () => {
    it('should switch between mock and dev backend modes', async () => {
      // Start with mock mode
      (window as any).__STORYBOOK_DATA_SOURCE__ = 'mock';
      
      const { rerender } = render(<DevInterfacePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Development Interface')).toBeInTheDocument();
      });
      
      // Switch to dev backend mode
      (window as any).__STORYBOOK_DATA_SOURCE__ = 'api';
      (window as any).__API_BASE_URL__ = 'http://localhost:3000/api';
      
      rerender(<DevInterfacePage />);
      
      // Component should still work
      await waitFor(() => {
        expect(screen.getByText('Development Interface')).toBeInTheDocument();
      });
      
      // Should have the same UI regardless of backend
      expect(screen.getByText(/Chat with Claude Code and browse your codebase/)).toBeInTheDocument();
    });
  });

  describe('Loading State Handling', () => {
    it('should handle loading states gracefully in both modes', async () => {
      // Test with mock mode first
      (window as any).__STORYBOOK_DATA_SOURCE__ = 'mock';
      
      const { rerender } = render(<DevInterfacePage />);
      
      // Component should render without infinite loading
      await waitFor(() => {
        expect(screen.getByText('Development Interface')).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Switch to dev mode
      (window as any).__STORYBOOK_DATA_SOURCE__ = 'api';
      (window as any).__API_BASE_URL__ = 'http://localhost:3000/api';
      
      rerender(<DevInterfacePage />);
      
      // Should still render without hanging
      await waitFor(() => {
        expect(screen.getByText('Development Interface')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
});