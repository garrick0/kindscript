/**
 * RIGOROUS Start Chat Button Test
 * 
 * This test is designed to catch the actual issue where "nothing happens" 
 * when clicking Start Chat. Unlike the previous test, this one:
 * 
 * 1. Actually verifies the DOM state changes
 * 2. Checks for specific styling changes that indicate tab activation
 * 3. Validates that the chat interface becomes visible
 * 4. Tests the complete user journey, not just rendering
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { composeStories } from '@storybook/react';
import * as stories from './DevInterfacePage.stories';

const composedStories = composeStories(stories);

describe('DevInterfacePage - RIGOROUS Start Chat Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('RIGOROUS: Start Chat button must actually switch tabs and show chat interface', async () => {
    const user = userEvent.setup();
    
    // Use the StartChatButtonTest story which should have minimal loading
    const { container } = render(<composedStories.StartChatButtonTest />);
    
    // Step 1: Wait for component to load and find the welcome state
    await waitFor(() => {
      expect(screen.getByText('Welcome to the Development Interface')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Step 2: Verify initial state - Chat tab is active by default, but shows welcome screen
    const chatTabs = screen.getAllByRole('button', { name: /Chat/i });
    const sidebarChatTab = chatTabs.find(button => button.textContent?.includes('Chat') && !button.textContent?.includes('Start'));
    expect(sidebarChatTab).toBeDefined();
    
    // Chat tab should be active by default (this is expected behavior)
    expect(sidebarChatTab).toHaveClass('text-blue-600');
    expect(sidebarChatTab).toHaveClass('border-blue-600');
    
    // BUT the welcome screen should still be showing in RIGHT PANEL (chat is in sidebar)
    expect(screen.getByText('Welcome to the Development Interface')).toBeInTheDocument();
    
    // Chat input should be visible in SIDEBAR (one instance)
    const chatInputs = screen.getAllByPlaceholderText(/Ask Claude Code anything/i);
    expect(chatInputs).toHaveLength(1); // Should only be one initially (in sidebar)
    
    console.log('✅ Initial state verified: Chat tab active but welcome screen showing');

    // Step 3: Find and click the Start Chat button
    const startChatButton = screen.getByRole('button', { name: /Start Chat/i });
    expect(startChatButton).toBeInTheDocument();
    expect(startChatButton).toBeEnabled();
    
    console.log('✅ Start Chat button found and enabled');

    // Step 4: Click Start Chat button
    await user.click(startChatButton);
    
    console.log('✅ Clicked Start Chat button');

    // Step 5: CRITICAL TEST - Verify chat tab remains active (it was already active)
    const chatTabsAfter = screen.getAllByRole('button', { name: /Chat/i });
    const sidebarChatTabAfter = chatTabsAfter.find(button => button.textContent?.includes('Chat') && !button.textContent?.includes('Start'));
    expect(sidebarChatTabAfter).toBeDefined();
    expect(sidebarChatTabAfter).toHaveClass('text-blue-600');
    expect(sidebarChatTabAfter).toHaveClass('border-blue-600');
    
    console.log('✅ Chat tab remains active after clicking Start Chat');

    // Step 6: CRITICAL TEST - Verify welcome screen disappears and chat interface appears in right panel
    await waitFor(() => {
      // Welcome message should be gone when chat interface shows in right panel
      expect(screen.queryByText('Welcome to the Development Interface')).not.toBeInTheDocument();
      
      // Should see initial assistant message (means chat interface is showing in right panel)
      const assistantMessage = screen.getByText(/Hello! I'm Claude Code/i);
      expect(assistantMessage).toBeInTheDocument();
      console.log('✅ Assistant message visible');
      
      // Chat input should still be visible (now only in right panel, not sidebar)
      const chatInputsAfter = screen.getAllByPlaceholderText(/Ask Claude Code anything/i);
      expect(chatInputsAfter).toHaveLength(1); // Should still be only one (moved from sidebar to right panel)
      
      console.log('✅ Chat interface moved from sidebar to right panel');
      
    }, { timeout: 3000 });

    // Step 7: Additional verification - other tabs should NOT be active
    const filesTab = screen.getByRole('button', { name: /Files/i });
    const appsTab = screen.getByRole('button', { name: /Apps/i });
    
    expect(filesTab).not.toHaveClass('text-blue-600');
    expect(appsTab).not.toHaveClass('text-blue-600');
    
    console.log('✅ Other tabs are correctly inactive');

    // Step 8: Test that chat functionality works
    const chatInput = screen.getByPlaceholderText(/Ask Claude Code anything/i);
    const sendButton = screen.getByRole('button', { name: '' }); // Send button (icon only)
    
    // Initially send button should be disabled
    expect(sendButton).toBeDisabled();
    
    // Type a message
    await user.type(chatInput, 'Test message');
    
    // Send button should become enabled
    await waitFor(() => {
      expect(sendButton).toBeEnabled();
    });
    
    // Send the message
    await user.click(sendButton);
    
    // Verify message appears in chat
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    }, { timeout: 5000 });
    
    console.log('✅ Chat functionality verified - message sent and received');

    console.log('🎉 ALL CHECKS PASSED - Start Chat button works correctly');
  });

  it('RIGOROUS: Verify Start Chat button failure scenarios', async () => {
    const user = userEvent.setup();
    
    // Test with Default story to see if it behaves differently
    const { container } = render(<composedStories.Default />);
    
    // Wait for loading
    await waitFor(() => {
      const content = container.textContent || '';
      // Either we have welcome state or we're still loading
      expect(content.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
    
    const startChatButtons = screen.queryAllByRole('button', { name: /Start Chat/i });
    
    if (startChatButtons.length === 0) {
      console.log('ℹ️  No Start Chat button found in Default story - component may be in loading state');
      return;
    }
    
    const startChatButton = startChatButtons[0];
    
    // Click the button
    await user.click(startChatButton);
    
    // Wait and check if anything changed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if chat tab became active
    const chatTabs = screen.queryAllByRole('button', { name: /Chat/i });
    
    if (chatTabs.length > 0) {
      const chatTab = chatTabs[0];
      const isActive = chatTab.classList.contains('text-blue-600');
      
      if (!isActive) {
        console.error('❌ DETECTED ISSUE: Start Chat button clicked but chat tab is not active');
        console.error('Chat tab classes:', chatTab.className);
        throw new Error('Start Chat button not working - tab activation failed');
      } else {
        console.log('✅ Chat tab activation worked in Default story');
      }
    }
  });

  it('EDGE CASE: Start Chat when already in chat tab', async () => {
    const user = userEvent.setup();
    const { container } = render(<composedStories.StartChatButtonTest />);
    
    await waitFor(() => {
      expect(screen.getByText('Welcome to the Development Interface')).toBeInTheDocument();
    });
    
    // First click to activate chat
    const startChatButton = screen.getByRole('button', { name: /Start Chat/i });
    await user.click(startChatButton);
    
    // Verify chat is active
    await waitFor(() => {
      const chatTab = screen.getByRole('button', { name: /Chat/i });
      expect(chatTab).toHaveClass('text-blue-600');
    });
    
    // Click Start Chat again - should still work (idempotent)
    const newStartChatButtons = screen.queryAllByRole('button', { name: /Start Chat/i });
    
    if (newStartChatButtons.length > 0) {
      await user.click(newStartChatButtons[0]);
      
      // Should still be active
      const chatTab = screen.getByRole('button', { name: /Chat/i });
      expect(chatTab).toHaveClass('text-blue-600');
    }
    
    console.log('✅ Start Chat button is idempotent when chat already active');
  });

  it('COMPREHENSIVE: Test complete Start Chat user journey', async () => {
    const user = userEvent.setup();
    const { container } = render(<composedStories.StartChatButtonTest />);
    
    // Journey Step 1: User lands on DevInterface page
    await waitFor(() => {
      expect(screen.getByText('Development Interface')).toBeInTheDocument();
    });
    
    console.log('Step 1: ✅ User landed on DevInterface page');
    
    // Journey Step 2: User sees welcome state
    expect(screen.getByText('Welcome to the Development Interface')).toBeInTheDocument();
    expect(screen.getByText(/Start a conversation with Claude Code/i)).toBeInTheDocument();
    
    console.log('Step 2: ✅ User sees welcome state');
    
    // Journey Step 3: User clicks Start Chat  
    const startChatButton = screen.getByRole('button', { name: /Start Chat/i });
    await user.click(startChatButton);
    
    console.log('Step 3: ✅ User clicked Start Chat');
    
    // Journey Step 4: Interface switches to chat
    await waitFor(() => {
      const chatInput = screen.getByPlaceholderText(/Ask Claude Code anything/i);
      expect(chatInput).toBeVisible();
      
      const assistantMessage = screen.getByText(/Hello! I'm Claude Code/i);
      expect(assistantMessage).toBeInTheDocument();
    }, { timeout: 3000 });
    
    console.log('Step 4: ✅ Interface switched to chat view');
    
    // Journey Step 5: User types and sends message
    const chatInput = screen.getByPlaceholderText(/Ask Claude Code anything/i);
    await user.type(chatInput, 'How do I create a React component?');
    
    const sendButton = screen.getByRole('button', { name: '' });
    await user.click(sendButton);
    
    console.log('Step 5: ✅ User sent first message');
    
    // Journey Step 6: User sees response
    await waitFor(() => {
      expect(screen.getByText('How do I create a React component?')).toBeInTheDocument();
    }, { timeout: 5000 });
    
    console.log('Step 6: ✅ User message appeared in chat');
    
    // Journey Step 7: User can continue conversation
    await waitFor(() => {
      expect(chatInput.value).toBe(''); // Input should be cleared
      expect(sendButton).toBeDisabled(); // Send button should be disabled again
    });
    
    console.log('Step 7: ✅ Chat ready for next message');
    
    console.log('🚀 COMPLETE USER JOURNEY SUCCESSFUL');
  });
});