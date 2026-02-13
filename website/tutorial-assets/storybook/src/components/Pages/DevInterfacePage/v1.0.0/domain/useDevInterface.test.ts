import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useDevInterface } from './useDevInterface';
import { DevInterfaceService } from './devInterface.service';
import type { ChatMessage, CodeFile, AppInfo, ResourceData } from '../ui/DevInterfacePage';

// Mock the DevInterfaceService
vi.mock('./devInterface.service');

const mockDevInterfaceService = vi.mocked(DevInterfaceService);

describe('useDevInterface', () => {
  const mockChatMessage: ChatMessage = {
    id: '2',
    role: 'user',
    content: 'Test message',
    timestamp: new Date()
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
          name: 'index.ts',
          path: '/src/index.ts',
          type: 'file'
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
      lastRestart: new Date()
    },
    {
      id: 'storybook',
      name: 'Storybook',
      description: 'Component development environment',
      status: 'stopped',
      port: 6006
    }
  ];

  const mockResources: ResourceData = {
    system: {
      cpuPercent: 45.2,
      memoryPercent: 67.8,
      memoryUsedGB: 10.8,
      memoryTotalGB: 16.0,
      diskPercent: 23.4,
      diskUsedGB: 468.7,
      diskTotalGB: 2000.0,
      uptime: 142800
    },
    processes: [
      {
        pid: 12345,
        name: 'node',
        command: 'node apps/platform/server.js',
        cpuPercent: 15.2,
        memoryMB: 245.6,
        type: 'app'
      },
      {
        pid: 12346,
        name: 'node',
        command: 'node node_modules/.bin/vitest run --worker=1',
        cpuPercent: 25.4,
        memoryMB: 512.8,
        type: 'test'
      }
    ],
    issues: [
      {
        type: 'warning',
        title: 'Too Many Test Workers',
        description: '7 test worker processes are running',
        suggestion: 'Consider reducing concurrent test workers'
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initialization', () => {
    it('initializes with default state', () => {
      const { result } = renderHook(() => useDevInterface());

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].role).toBe('assistant');
      expect(result.current.messages[0].content).toContain("Hello! I'm Claude Code");
      expect(result.current.files).toEqual([]);
      expect(result.current.apps).toEqual([]);
      expect(result.current.resources).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('initializes with provided files', () => {
      const { result } = renderHook(() => useDevInterface(mockFiles));

      expect(result.current.files).toEqual(mockFiles);
    });

    it('initializes with provided apps', () => {
      const { result } = renderHook(() => useDevInterface(undefined, mockApps));

      expect(result.current.apps).toEqual(mockApps);
    });

    it('initializes with provided resources', () => {
      const { result } = renderHook(() => useDevInterface(undefined, undefined, mockResources));

      expect(result.current.resources).toEqual(mockResources);
    });

    it('loads app status on mount when no initial apps provided', async () => {
      mockDevInterfaceService.getAppStatus.mockResolvedValue(mockApps);

      renderHook(() => useDevInterface());

      expect(mockDevInterfaceService.getAppStatus).toHaveBeenCalled();
    });

    it('does not load app status when initial apps are provided', () => {
      mockDevInterfaceService.getAppStatus.mockResolvedValue([]);

      renderHook(() => useDevInterface(undefined, mockApps));

      expect(mockDevInterfaceService.getAppStatus).not.toHaveBeenCalled();
    });
  });

  describe('Chat Functionality', () => {
    it('sends a message successfully', async () => {
      const mockResponse = 'Mock response from Claude';
      mockDevInterfaceService.sendMessage.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDevInterface());

      await act(async () => {
        await result.current.sendMessage('Test message');
      });

      expect(mockDevInterfaceService.sendMessage).toHaveBeenCalledWith(
        'Test message',
        expect.arrayContaining([
          expect.objectContaining({ role: 'assistant' })
        ])
      );

      // Should have added user message and assistant response
      expect(result.current.messages).toHaveLength(3);
      expect(result.current.messages[1].role).toBe('user');
      expect(result.current.messages[1].content).toBe('Test message');
      expect(result.current.messages[2].role).toBe('assistant');
      expect(result.current.messages[2].content).toBe(mockResponse);
    });

    it('handles chat error gracefully', async () => {
      const mockError = new Error('Chat API error');
      mockDevInterfaceService.sendMessage.mockRejectedValue(mockError);

      const { result } = renderHook(() => useDevInterface());

      await act(async () => {
        await result.current.sendMessage('Test message');
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.loading).toBe(false);

      // Should still add user message and error message
      expect(result.current.messages).toHaveLength(3);
      expect(result.current.messages[2].content).toContain('Sorry, I encountered an error');
    });

    it('sets loading state during message sending', async () => {
      let resolvePromise: (value: string) => void;
      const promise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });
      mockDevInterfaceService.sendMessage.mockReturnValue(promise);

      const { result } = renderHook(() => useDevInterface());

      act(() => {
        result.current.sendMessage('Test message');
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise!('Response');
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('File Management', () => {
    it('loads files successfully', async () => {
      mockDevInterfaceService.loadFiles.mockResolvedValue(mockFiles);

      const { result } = renderHook(() => useDevInterface());

      await act(async () => {
        await result.current.loadFiles();
      });

      expect(mockDevInterfaceService.loadFiles).toHaveBeenCalled();
      expect(result.current.files).toEqual(mockFiles);
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('handles file loading error', async () => {
      const mockError = new Error('Failed to load files');
      mockDevInterfaceService.loadFiles.mockRejectedValue(mockError);

      const { result } = renderHook(() => useDevInterface());

      await act(async () => {
        await result.current.loadFiles();
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.loading).toBe(false);
    });

    it('searches files successfully', async () => {
      const searchResults = [mockFiles[0].children![0]]; // Just the index.ts file
      mockDevInterfaceService.searchFiles.mockResolvedValue(searchResults);

      const { result } = renderHook(() => useDevInterface());

      await act(async () => {
        await result.current.searchFiles('index');
      });

      expect(mockDevInterfaceService.searchFiles).toHaveBeenCalledWith('index');
      expect(result.current.files).toEqual(searchResults);
    });

    it('does not search with empty query', async () => {
      const { result } = renderHook(() => useDevInterface());

      await act(async () => {
        await result.current.searchFiles('');
      });

      expect(mockDevInterfaceService.searchFiles).not.toHaveBeenCalled();
    });

    it('opens file and loads content', async () => {
      const file = mockFiles[0].children![0]; // index.ts without content
      const fileWithContent = { ...file, content: 'export * from "./components";' };
      
      mockDevInterfaceService.loadFileContent.mockResolvedValue(fileWithContent);

      const { result } = renderHook(() => useDevInterface(mockFiles));

      let returnedFile: CodeFile;
      await act(async () => {
        returnedFile = await result.current.openFile(file);
      });

      expect(mockDevInterfaceService.loadFileContent).toHaveBeenCalledWith(file);
      expect(returnedFile!).toEqual(fileWithContent);
      
      // Should update files state with loaded content
      expect(result.current.files[0].children![0].content).toBe('export * from "./components";');
    });

    it('returns file as-is if content already loaded', async () => {
      const fileWithContent = { 
        ...mockFiles[0].children![0], 
        content: 'Already loaded content' 
      };

      const { result } = renderHook(() => useDevInterface());

      let returnedFile: CodeFile;
      await act(async () => {
        returnedFile = await result.current.openFile(fileWithContent);
      });

      expect(mockDevInterfaceService.loadFileContent).not.toHaveBeenCalled();
      expect(returnedFile!).toEqual(fileWithContent);
    });
  });

  describe('App Management', () => {
    it('refreshes app status successfully', async () => {
      mockDevInterfaceService.getAppStatus.mockResolvedValue(mockApps);

      const { result } = renderHook(() => useDevInterface());

      await act(async () => {
        await result.current.refreshAppStatus();
      });

      expect(mockDevInterfaceService.getAppStatus).toHaveBeenCalled();
      expect(result.current.apps).toEqual(mockApps);
      expect(result.current.error).toBeNull();
    });

    it('starts app successfully', async () => {
      const updatedApp = { ...mockApps[1], status: 'running' as const, pid: 54321 };
      mockDevInterfaceService.startApp.mockResolvedValue(updatedApp);

      const { result } = renderHook(() => useDevInterface(undefined, mockApps));

      await act(async () => {
        await result.current.startApp('storybook');
      });

      expect(mockDevInterfaceService.startApp).toHaveBeenCalledWith('storybook');
      
      // Should update the app in the apps array
      const storybookApp = result.current.apps.find(app => app.id === 'storybook');
      expect(storybookApp?.status).toBe('running');
      expect(storybookApp?.pid).toBe(54321);
    });

    it('stops app successfully', async () => {
      const updatedApp = { ...mockApps[0], status: 'stopped' as const, pid: undefined };
      mockDevInterfaceService.stopApp.mockResolvedValue(updatedApp);

      const { result } = renderHook(() => useDevInterface(undefined, mockApps));

      await act(async () => {
        await result.current.stopApp('platform');
      });

      expect(mockDevInterfaceService.stopApp).toHaveBeenCalledWith('platform');
      
      const platformApp = result.current.apps.find(app => app.id === 'platform');
      expect(platformApp?.status).toBe('stopped');
      expect(platformApp?.pid).toBeUndefined();
    });

    it('restarts app successfully', async () => {
      const updatedApp = { 
        ...mockApps[0], 
        status: 'running' as const, 
        pid: 99999,
        lastRestart: new Date(),
        uptime: 0
      };
      mockDevInterfaceService.restartApp.mockResolvedValue(updatedApp);

      const { result } = renderHook(() => useDevInterface(undefined, mockApps));

      await act(async () => {
        await result.current.restartApp('platform');
      });

      expect(mockDevInterfaceService.restartApp).toHaveBeenCalledWith('platform');
      
      const platformApp = result.current.apps.find(app => app.id === 'platform');
      expect(platformApp?.pid).toBe(99999);
      expect(platformApp?.uptime).toBe(0);
    });

    it('handles app management errors', async () => {
      const mockError = new Error('Failed to start app');
      mockDevInterfaceService.startApp.mockRejectedValue(mockError);

      const { result } = renderHook(() => useDevInterface(undefined, mockApps));

      await act(async () => {
        await result.current.startApp('storybook');
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.loading).toBe(false);
    });

    it('sets loading state during app operations', async () => {
      let resolvePromise: (value: AppInfo) => void;
      const promise = new Promise<AppInfo>((resolve) => {
        resolvePromise = resolve;
      });
      mockDevInterfaceService.startApp.mockReturnValue(promise);

      const { result } = renderHook(() => useDevInterface(undefined, mockApps));

      act(() => {
        result.current.startApp('storybook');
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise!({ ...mockApps[1], status: 'running' });
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('clears error state before new operations', async () => {
      // First, create an error state
      const mockError = new Error('Initial error');
      mockDevInterfaceService.loadFiles.mockRejectedValue(mockError);

      const { result } = renderHook(() => useDevInterface());

      await act(async () => {
        await result.current.loadFiles();
      });

      expect(result.current.error).toEqual(mockError);

      // Now perform a successful operation
      mockDevInterfaceService.loadFiles.mockResolvedValue(mockFiles);

      await act(async () => {
        await result.current.loadFiles();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Hook Interface', () => {
    it('exposes all expected methods and properties', () => {
      const { result } = renderHook(() => useDevInterface());

      expect(result.current).toHaveProperty('messages');
      expect(result.current).toHaveProperty('files');
      expect(result.current).toHaveProperty('apps');
      expect(result.current).toHaveProperty('resources');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('sendMessage');
      expect(result.current).toHaveProperty('loadFiles');
      expect(result.current).toHaveProperty('searchFiles');
      expect(result.current).toHaveProperty('openFile');
      expect(result.current).toHaveProperty('startApp');
      expect(result.current).toHaveProperty('stopApp');
      expect(result.current).toHaveProperty('restartApp');
      expect(result.current).toHaveProperty('refreshAppStatus');
      expect(result.current).toHaveProperty('refreshResources');
      expect(result.current).toHaveProperty('killProcess');
    });

    it('maintains stable function references', () => {
      const { result, rerender } = renderHook(() => useDevInterface());

      const initialMethods = {
        sendMessage: result.current.sendMessage,
        loadFiles: result.current.loadFiles,
        searchFiles: result.current.searchFiles,
        openFile: result.current.openFile,
        startApp: result.current.startApp,
        stopApp: result.current.stopApp,
        restartApp: result.current.restartApp,
        refreshAppStatus: result.current.refreshAppStatus,
        refreshResources: result.current.refreshResources,
        killProcess: result.current.killProcess
      };

      rerender();

      expect(result.current.sendMessage).toBe(initialMethods.sendMessage);
      expect(result.current.loadFiles).toBe(initialMethods.loadFiles);
      expect(result.current.searchFiles).toBe(initialMethods.searchFiles);
      expect(result.current.openFile).toBe(initialMethods.openFile);
      expect(result.current.startApp).toBe(initialMethods.startApp);
      expect(result.current.stopApp).toBe(initialMethods.stopApp);
      expect(result.current.restartApp).toBe(initialMethods.restartApp);
      expect(result.current.refreshAppStatus).toBe(initialMethods.refreshAppStatus);
      expect(result.current.refreshResources).toBe(initialMethods.refreshResources);
      expect(result.current.killProcess).toBe(initialMethods.killProcess);
    });
  });

  describe('Resource Management', () => {
    it('refreshes resource status successfully', async () => {
      mockDevInterfaceService.getResourceStatus.mockResolvedValue(mockResources);

      const { result } = renderHook(() => useDevInterface());

      await act(async () => {
        await result.current.refreshResources();
      });

      expect(mockDevInterfaceService.getResourceStatus).toHaveBeenCalled();
      expect(result.current.resources).toEqual(mockResources);
      expect(result.current.error).toBeNull();
    });

    it('handles resource loading error', async () => {
      const mockError = new Error('Failed to load resources');
      mockDevInterfaceService.getResourceStatus.mockRejectedValue(mockError);

      const { result } = renderHook(() => useDevInterface());

      await act(async () => {
        await result.current.refreshResources();
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.loading).toBe(false);
    });

    it('kills process successfully', async () => {
      mockDevInterfaceService.killProcess.mockResolvedValue(true);

      const { result } = renderHook(() => useDevInterface(undefined, undefined, mockResources));

      await act(async () => {
        await result.current.killProcess(12346);
      });

      expect(mockDevInterfaceService.killProcess).toHaveBeenCalledWith(12346);
      
      // Should remove the killed process from resources
      expect(result.current.resources?.processes).toHaveLength(1);
      expect(result.current.resources?.processes[0].pid).toBe(12345);
    });

    it('handles process kill error', async () => {
      const mockError = new Error('Failed to kill process');
      mockDevInterfaceService.killProcess.mockRejectedValue(mockError);

      const { result } = renderHook(() => useDevInterface(undefined, undefined, mockResources));

      await act(async () => {
        await result.current.killProcess(12346);
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.loading).toBe(false);
    });

    it('sets loading state during resource operations', async () => {
      let resolvePromise: (value: ResourceData) => void;
      const promise = new Promise<ResourceData>((resolve) => {
        resolvePromise = resolve;
      });
      mockDevInterfaceService.getResourceStatus.mockReturnValue(promise);

      const { result } = renderHook(() => useDevInterface());

      act(() => {
        result.current.refreshResources();
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise!(mockResources);
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Side Effects', () => {
    it('calls refreshAppStatus on mount when no initial apps', async () => {
      mockDevInterfaceService.getAppStatus.mockResolvedValue(mockApps);

      renderHook(() => useDevInterface());

      // Wait for effect to run
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockDevInterfaceService.getAppStatus).toHaveBeenCalled();
    });

    it('does not call refreshAppStatus when initial apps provided', async () => {
      mockDevInterfaceService.getAppStatus.mockResolvedValue([]);

      renderHook(() => useDevInterface(undefined, mockApps));

      // Wait to ensure effect doesn't run
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockDevInterfaceService.getAppStatus).not.toHaveBeenCalled();
    });

    it('handles effect cleanup properly', () => {
      const { unmount } = renderHook(() => useDevInterface());
      
      // Should not throw when unmounting
      expect(() => unmount()).not.toThrow();
    });
  });
});