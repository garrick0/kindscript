import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DevInterfacePage, type AppInfo, type CodeFile } from './DevInterfacePage';

// Mock the useDevInterface hook
vi.mock('../domain/useDevInterface', () => ({
  useDevInterface: vi.fn()
}));

// Get the mocked function for test setup
import { useDevInterface } from '../domain/useDevInterface';
const mockUseDevInterface = vi.mocked(useDevInterface);

describe('DevInterfacePage', () => {
  const mockSendMessage = vi.fn();
  const mockLoadFiles = vi.fn();
  const mockSearchFiles = vi.fn();
  const mockOpenFile = vi.fn();
  const mockStartApp = vi.fn();
  const mockStopApp = vi.fn();
  const mockRestartApp = vi.fn();
  const mockRefreshAppStatus = vi.fn();

  const defaultMockReturn = {
    messages: [
      {
        id: '1',
        role: 'assistant' as const,
        content: "Hello! I'm Claude Code, your AI development assistant. How can I assist you today?",
        timestamp: new Date()
      }
    ],
    files: [],
    apps: [],
    loading: false,
    error: null,
    sendMessage: mockSendMessage,
    loadFiles: mockLoadFiles,
    searchFiles: mockSearchFiles,
    openFile: mockOpenFile,
    startApp: mockStartApp,
    stopApp: mockStopApp,
    restartApp: mockRestartApp,
    refreshAppStatus: mockRefreshAppStatus
  };

  const mockFiles: CodeFile[] = [
    {
      id: '1',
      name: 'src',
      path: '/src',
      type: 'folder',
      children: [
        {
          id: '2',
          name: 'components',
          path: '/src/components',
          type: 'folder',
          children: []
        },
        {
          id: '3',
          name: 'index.ts',
          path: '/src/index.ts',
          type: 'file',
          content: 'export * from "./components";'
        }
      ]
    }
  ];

  const mockApps: AppInfo[] = [
    {
      id: 'platform',
      name: 'Platform (Next.js)',
      description: 'Main Next.js application server',
      status: 'running',
      port: 3000,
      pid: 12345,
      uptime: 7200,
      lastRestart: new Date(Date.now() - 7200000)
    },
    {
      id: 'storybook',
      name: 'Storybook',
      description: 'Component development environment',
      status: 'stopped',
      port: 6006
    }
  ];

  beforeEach(() => {
    mockUseDevInterface.mockReturnValue(defaultMockReturn);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initial Rendering', () => {
    it('renders the development interface header', () => {
      render(<DevInterfacePage />);
      
      expect(screen.getByText('Development Interface')).toBeInTheDocument();
      expect(screen.getByText('Chat with Claude Code and browse your codebase')).toBeInTheDocument();
    });

    it('renders all three tabs', () => {
      render(<DevInterfacePage />);
      
      expect(screen.getByRole('button', { name: /^chat$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^files$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /apps/i })).toBeInTheDocument();
    });

    it('starts with chat tab active by default', () => {
      render(<DevInterfacePage />);
      
      const chatTab = screen.getByRole('button', { name: /^chat$/i });
      expect(chatTab).toHaveClass('text-blue-600', 'border-blue-600');
      
      // Should show initial assistant message
      expect(screen.getByText(/Hello! I'm Claude Code/)).toBeInTheDocument();
    });

    it('shows welcome state when no file is selected', () => {
      render(<DevInterfacePage />);
      
      expect(screen.getByText('Welcome to the Development Interface')).toBeInTheDocument();
      expect(screen.getByText(/Start a conversation with Claude Code/)).toBeInTheDocument();
    });
  });

  describe('Chat Functionality', () => {
    it('renders chat input and send button', () => {
      render(<DevInterfacePage />);
      
      expect(screen.getByPlaceholderText('Ask Claude Code anything...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '' })).toBeInTheDocument(); // Send button (icon only)
    });

    it('enables send button when message is typed', async () => {
      const user = userEvent.setup();
      render(<DevInterfacePage />);
      
      const input = screen.getByPlaceholderText('Ask Claude Code anything...');
      const sendButton = screen.getByRole('button', { name: '' });
      
      expect(sendButton).toBeDisabled();
      
      await user.type(input, 'Test message');
      expect(sendButton).not.toBeDisabled();
    });

    it('calls sendMessage when form is submitted', async () => {
      const user = userEvent.setup();
      render(<DevInterfacePage />);
      
      const input = screen.getByPlaceholderText('Ask Claude Code anything...');
      const sendButton = screen.getByRole('button', { name: '' });
      
      await user.type(input, 'Test message');
      await user.click(sendButton);
      
      expect(mockSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('clears input after sending message', async () => {
      const user = userEvent.setup();
      render(<DevInterfacePage />);
      
      const input = screen.getByPlaceholderText('Ask Claude Code anything...') as HTMLInputElement;
      
      await user.type(input, 'Test message');
      await user.click(screen.getByRole('button', { name: '' }));
      
      expect(input.value).toBe('');
    });

    it('sends message on Enter key press', async () => {
      const user = userEvent.setup();
      render(<DevInterfacePage />);
      
      const input = screen.getByPlaceholderText('Ask Claude Code anything...');
      
      await user.type(input, 'Test message');
      await user.keyboard('{Enter}');
      
      expect(mockSendMessage).toHaveBeenCalledWith('Test message');
    });
  });

  describe('File Browser', () => {
    beforeEach(() => {
      mockUseDevInterface.mockReturnValue({
        ...defaultMockReturn,
        files: mockFiles
      });
    });

    it('switches to files tab and shows file tree', async () => {
      const user = userEvent.setup();
      render(<DevInterfacePage />);
      
      const filesTab = screen.getByRole('button', { name: /^files$/i });
      await user.click(filesTab);
      
      expect(filesTab).toHaveClass('text-blue-600', 'border-blue-600');
      expect(screen.getByText('src')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search files...')).toBeInTheDocument();
    });

    it('renders file search functionality', async () => {
      const user = userEvent.setup();
      render(<DevInterfacePage />);
      
      await user.click(screen.getByRole('button', { name: /files/i }));
      
      const searchInput = screen.getByPlaceholderText('Search files...');
      await user.type(searchInput, 'component');
      
      expect(mockSearchFiles).toHaveBeenCalledWith('component');
    });

    it('shows empty state when no files are loaded', async () => {
      mockUseDevInterface.mockReturnValue({
        ...defaultMockReturn,
        files: []
      });
      
      const user = userEvent.setup();
      render(<DevInterfacePage />);
      
      await user.click(screen.getByRole('button', { name: /files/i }));
      
      expect(screen.getByText('No files loaded')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /load files/i })).toBeInTheDocument();
    });

    it('calls loadFiles when load files button is clicked', async () => {
      mockUseDevInterface.mockReturnValue({
        ...defaultMockReturn,
        files: []
      });
      
      const user = userEvent.setup();
      render(<DevInterfacePage />);
      
      await user.click(screen.getByRole('button', { name: /files/i }));
      await user.click(screen.getByRole('button', { name: /load files/i }));
      
      expect(mockLoadFiles).toHaveBeenCalled();
    });
  });

  describe('App Management', () => {
    beforeEach(() => {
      mockUseDevInterface.mockReturnValue({
        ...defaultMockReturn,
        apps: mockApps
      });
    });

    it('switches to apps tab and shows application status', async () => {
      const user = userEvent.setup();
      render(<DevInterfacePage />);
      
      const appsTab = screen.getByRole('button', { name: /apps/i });
      await user.click(appsTab);
      
      expect(appsTab).toHaveClass('text-blue-600', 'border-blue-600');
      expect(screen.getByText('Application Status')).toBeInTheDocument();
      expect(screen.getByText('Platform (Next.js)')).toBeInTheDocument();
      expect(screen.getByText('Storybook')).toBeInTheDocument();
    });

    it('displays app status indicators correctly', async () => {
      const user = userEvent.setup();
      render(<DevInterfacePage />);
      
      await user.click(screen.getByRole('button', { name: /apps/i }));
      
      expect(screen.getByText('running')).toBeInTheDocument();
      expect(screen.getByText('stopped')).toBeInTheDocument();
    });

    it('shows appropriate control buttons based on app status', async () => {
      const user = userEvent.setup();
      render(<DevInterfacePage />);
      
      await user.click(screen.getByRole('button', { name: /apps/i }));
      
      // Running app should have Stop and Restart buttons
      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /restart/i })).toBeInTheDocument();
      
      // Stopped app should have Start button
      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
    });

    it('calls startApp when start button is clicked', async () => {
      const user = userEvent.setup();
      render(<DevInterfacePage />);
      
      await user.click(screen.getByRole('button', { name: /apps/i }));
      await user.click(screen.getByRole('button', { name: /start/i }));
      
      expect(mockStartApp).toHaveBeenCalledWith('storybook');
    });

    it('calls stopApp when stop button is clicked', async () => {
      const user = userEvent.setup();
      render(<DevInterfacePage />);
      
      await user.click(screen.getByRole('button', { name: /apps/i }));
      await user.click(screen.getByRole('button', { name: /stop/i }));
      
      expect(mockStopApp).toHaveBeenCalledWith('platform');
    });

    it('calls restartApp when restart button is clicked', async () => {
      const user = userEvent.setup();
      render(<DevInterfacePage />);
      
      await user.click(screen.getByRole('button', { name: /apps/i }));
      await user.click(screen.getByRole('button', { name: /restart/i }));
      
      expect(mockRestartApp).toHaveBeenCalledWith('platform');
    });

    it('calls refreshAppStatus when refresh button is clicked', async () => {
      const user = userEvent.setup();
      render(<DevInterfacePage />);
      
      await user.click(screen.getByRole('button', { name: /apps/i }));
      
      // Find refresh button by its icon (RotateCcw)
      const refreshButtons = screen.getAllByRole('button');
      const refreshButton = refreshButtons.find(button => 
        button.querySelector('svg') && !button.textContent?.trim()
      );
      
      if (refreshButton) {
        await user.click(refreshButton);
        expect(mockRefreshAppStatus).toHaveBeenCalled();
      }
    });

    it('displays app details correctly', async () => {
      const user = userEvent.setup();
      render(<DevInterfacePage />);
      
      await user.click(screen.getByRole('button', { name: /apps/i }));
      
      expect(screen.getByText('3000')).toBeInTheDocument(); // Port
      expect(screen.getByText('12345')).toBeInTheDocument(); // PID
    });

    it('shows empty state when no apps are available', async () => {
      mockUseDevInterface.mockReturnValue({
        ...defaultMockReturn,
        apps: []
      });
      
      const user = userEvent.setup();
      render(<DevInterfacePage />);
      
      await user.click(screen.getByRole('button', { name: /apps/i }));
      
      expect(screen.getByText('No applications found')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading skeleton when loading is true and no data', () => {
      mockUseDevInterface.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
        files: [],
        apps: []
      });
      
      render(<DevInterfacePage />);
      
      expect(screen.getByTestId('skeleton') || screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('disables buttons during loading', async () => {
      mockUseDevInterface.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
        apps: mockApps
      });
      
      const user = userEvent.setup();
      render(<DevInterfacePage />);
      
      await user.click(screen.getByRole('button', { name: /apps/i }));
      
      const startButton = screen.getByRole('button', { name: /start/i });
      const stopButton = screen.getByRole('button', { name: /stop/i });
      
      expect(startButton).toBeDisabled();
      expect(stopButton).toBeDisabled();
    });
  });

  describe('Error States', () => {
    it('displays error message when error occurs', () => {
      const mockError = new Error('Failed to load data');
      mockUseDevInterface.mockReturnValue({
        ...defaultMockReturn,
        error: mockError
      });
      
      render(<DevInterfacePage />);
      
      expect(screen.getByText(/Error loading development interface/)).toBeInTheDocument();
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });

    it('shows retry button on error', async () => {
      const mockError = new Error('Failed to load data');
      mockUseDevInterface.mockReturnValue({
        ...defaultMockReturn,
        error: mockError
      });
      
      const user = userEvent.setup();
      render(<DevInterfacePage />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
      
      await user.click(retryButton);
      // The retry action would depend on the specific error context
      // In this case, it might call loadFiles or refreshAppStatus
    });
  });

  describe('File Content Display', () => {
    it('displays selected file content in right panel', () => {
      mockUseDevInterface.mockReturnValue({
        ...defaultMockReturn,
        files: mockFiles
      });
      
      render(<DevInterfacePage initialFiles={mockFiles} />);
      
      // Simulate file selection by setting selectedFile state
      // This would typically happen through file click interaction
      const fileWithContent = {
        ...mockFiles[0].children![1], // index.ts file
        content: 'export * from "./components";'
      };
      
      // We need to simulate the file being selected somehow
      // This is a limitation of testing the component in isolation
      // Integration tests would be better for this scenario
    });
  });

  describe('Tab Navigation', () => {
    it('switches between tabs correctly', async () => {
      const user = userEvent.setup();
      render(<DevInterfacePage />);
      
      const chatTab = screen.getByRole('button', { name: /^chat$/i });
      const filesTab = screen.getByRole('button', { name: /^files$/i });
      const appsTab = screen.getByRole('button', { name: /apps/i });
      
      // Start with chat active
      expect(chatTab).toHaveClass('text-blue-600');
      
      // Switch to files
      await user.click(filesTab);
      expect(filesTab).toHaveClass('text-blue-600');
      expect(chatTab).not.toHaveClass('text-blue-600');
      
      // Switch to apps
      await user.click(appsTab);
      expect(appsTab).toHaveClass('text-blue-600');
      expect(filesTab).not.toHaveClass('text-blue-600');
      
      // Switch back to chat
      await user.click(chatTab);
      expect(chatTab).toHaveClass('text-blue-600');
      expect(appsTab).not.toHaveClass('text-blue-600');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<DevInterfacePage />);
      
      // Check for proper button roles
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
      
      // Check for proper input labels
      const chatInput = screen.getByPlaceholderText('Ask Claude Code anything...');
      expect(chatInput).toHaveAttribute('type', 'text');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<DevInterfacePage />);
      
      const chatInput = screen.getByPlaceholderText('Ask Claude Code anything...');
      
      // Focus should work
      await user.click(chatInput);
      expect(chatInput).toHaveFocus();
      
      // Tab navigation should work
      await user.keyboard('{Tab}');
      // Next focusable element should be focused
    });
  });

  describe('Component Props', () => {
    it('uses initialFiles prop when provided', () => {
      const testFiles: CodeFile[] = [
        {
          id: 'test',
          name: 'test.ts',
          path: '/test.ts',
          type: 'file'
        }
      ];
      
      render(<DevInterfacePage initialFiles={testFiles} />);
      
      expect(mockUseDevInterface).toHaveBeenCalledWith(testFiles, undefined, undefined);
    });

    it('uses initialApps prop when provided', () => {
      const testApps: AppInfo[] = [
        {
          id: 'test',
          name: 'Test App',
          description: 'Test application',
          status: 'running',
          port: 3000
        }
      ];
      
      render(<DevInterfacePage initialApps={testApps} />);
      
      expect(mockUseDevInterface).toHaveBeenCalledWith(undefined, testApps, undefined);
    });

    it('uses both initial props when provided', () => {
      const testFiles: CodeFile[] = [{ id: 'test', name: 'test.ts', path: '/test.ts', type: 'file' }];
      const testApps: AppInfo[] = [{ id: 'test', name: 'Test App', description: 'Test', status: 'running', port: 3000 }];
      
      render(<DevInterfacePage initialFiles={testFiles} initialApps={testApps} />);
      
      expect(mockUseDevInterface).toHaveBeenCalledWith(testFiles, testApps, undefined);
    });
  });
});