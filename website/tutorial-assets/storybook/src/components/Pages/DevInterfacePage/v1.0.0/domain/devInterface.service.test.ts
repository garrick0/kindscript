import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DevInterfaceService } from './devInterface.service';
import type { ChatMessage, CodeFile, AppInfo } from '../ui/DevInterfacePage';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('DevInterfaceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Chat API', () => {
    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: 'Hello!',
        timestamp: new Date()
      },
      {
        id: '2',
        role: 'user',
        content: 'Hi there',
        timestamp: new Date()
      }
    ];

    it('sends message successfully', async () => {
      const mockResponse = 'Claude response';
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ response: mockResponse })
      });

      const result = await DevInterfaceService.sendMessage('Test message', mockMessages);

      expect(mockFetch).toHaveBeenCalledWith('/api/dev-interface/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Test message',
          context: mockMessages
        })
      });

      expect(result).toBe(mockResponse);
    });

    it('handles chat API error and returns mock response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await DevInterfaceService.sendMessage('Test message', mockMessages);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('returns debug-specific response for debug keywords', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await DevInterfaceService.sendMessage('help me debug this error', mockMessages);

      expect(result).toContain('debug');
      expect(result).toContain('error message');
    });

    it('returns implementation-specific response for implementation keywords', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await DevInterfaceService.sendMessage('help me implement a new feature', mockMessages);

      expect(result).toContain('implement');
      expect(result).toContain('feature');
    });

    it('returns explanation-specific response for explanation keywords', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await DevInterfaceService.sendMessage('explain how this works', mockMessages);

      expect(result).toContain('explain');
      expect(result).toContain('codebase structure');
    });
  });

  describe('File Management API', () => {
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

    it('loads files successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ files: mockFiles })
      });

      const result = await DevInterfaceService.loadFiles();

      expect(mockFetch).toHaveBeenCalledWith('/api/dev-interface/files');
      expect(result).toEqual(mockFiles);
    });

    it('returns mock files when API fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await DevInterfaceService.loadFiles();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('type');
    });

    it('searches files successfully', async () => {
      const searchResults = mockFiles.slice(0, 1); // Just first file
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ files: searchResults })
      });

      const result = await DevInterfaceService.searchFiles('src');

      expect(mockFetch).toHaveBeenCalledWith('/api/dev-interface/files/search?q=src');
      expect(result).toEqual(searchResults);
    });

    it('handles search API error with mock filtering', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await DevInterfaceService.searchFiles('apps');

      expect(Array.isArray(result)).toBe(true);
      // Should return filtered mock results
      const hasAppsRelatedFile = result.some(file => 
        file.name.toLowerCase().includes('apps') || 
        file.path.toLowerCase().includes('apps')
      );
      expect(hasAppsRelatedFile).toBe(true);
    });

    it('loads file content successfully', async () => {
      const fileContent = 'export * from "./components";';
      const mockFile: CodeFile = {
        id: '2',
        name: 'index.ts',
        path: '/src/index.ts',
        type: 'file'
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ content: fileContent })
      });

      const result = await DevInterfaceService.loadFileContent(mockFile);

      expect(mockFetch).toHaveBeenCalledWith('/api/dev-interface/files/content?path=%2Fsrc%2Findex.ts');
      expect(result).toEqual({
        ...mockFile,
        content: fileContent
      });
    });

    it('returns mock content when file content API fails', async () => {
      const mockFile: CodeFile = {
        id: '2',
        name: 'index.tsx',
        path: '/src/components/Button.tsx',
        type: 'file'
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await DevInterfaceService.loadFileContent(mockFile);

      expect(result.content).toContain('Button.tsx');
      expect(result.content).toContain('React');
    });

    it('generates appropriate mock content based on file extension', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500
      });

      // Test TypeScript file
      const tsFile: CodeFile = { id: '1', name: 'test.ts', path: '/test.ts', type: 'file' };
      const tsResult = await DevInterfaceService.loadFileContent(tsFile);
      expect(tsResult.content).toContain('export function');

      // Test JSON file
      const jsonFile: CodeFile = { id: '2', name: 'package.json', path: '/package.json', type: 'file' };
      const jsonResult = await DevInterfaceService.loadFileContent(jsonFile);
      expect(tsResult.content).toContain('{');

      // Test Markdown file
      const mdFile: CodeFile = { id: '3', name: 'README.md', path: '/README.md', type: 'file' };
      const mdResult = await DevInterfaceService.loadFileContent(mdFile);
      expect(mdResult.content).toContain('#');

      // Test unknown extension
      const unknownFile: CodeFile = { id: '4', name: 'unknown.xyz', path: '/unknown.xyz', type: 'file' };
      const unknownResult = await DevInterfaceService.loadFileContent(unknownFile);
      expect(unknownResult.content).toContain('//');
    });
  });

  describe('App Management API', () => {
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

    it('gets app status successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ apps: mockApps })
      });

      const result = await DevInterfaceService.getAppStatus();

      expect(mockFetch).toHaveBeenCalledWith('/api/dev-interface/apps');
      expect(result).toEqual(mockApps);
    });

    it('returns mock apps when status API fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await DevInterfaceService.getAppStatus();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3); // platform, storybook, studio
      expect(result[0].id).toBe('platform');
      expect(result[1].id).toBe('storybook');
      expect(result[2].id).toBe('studio');
    });

    it('starts app successfully', async () => {
      const startedApp = { ...mockApps[1], status: 'running' as const, pid: 54321 };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ app: startedApp })
      });

      const result = await DevInterfaceService.startApp('storybook');

      expect(mockFetch).toHaveBeenCalledWith('/api/dev-interface/apps/storybook/start', {
        method: 'POST'
      });
      expect(result).toEqual(startedApp);
    });

    it('returns mock started app when start API fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await DevInterfaceService.startApp('storybook');

      expect(result.id).toBe('storybook');
      expect(result.status).toBe('running');
      expect(result.pid).toBeTypeOf('number');
      expect(result.lastRestart).toBeInstanceOf(Date);
    });

    it('stops app successfully', async () => {
      const stoppedApp = { ...mockApps[0], status: 'stopped' as const, pid: undefined };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ app: stoppedApp })
      });

      const result = await DevInterfaceService.stopApp('platform');

      expect(mockFetch).toHaveBeenCalledWith('/api/dev-interface/apps/platform/stop', {
        method: 'POST'
      });
      expect(result).toEqual(stoppedApp);
    });

    it('returns mock stopped app when stop API fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await DevInterfaceService.stopApp('platform');

      expect(result.id).toBe('platform');
      expect(result.status).toBe('stopped');
      expect(result.pid).toBeUndefined();
      expect(result.uptime).toBeUndefined();
    });

    it('restarts app successfully', async () => {
      const restartedApp = { 
        ...mockApps[0], 
        status: 'running' as const, 
        pid: 99999,
        uptime: 0,
        lastRestart: new Date()
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ app: restartedApp })
      });

      const result = await DevInterfaceService.restartApp('platform');

      expect(mockFetch).toHaveBeenCalledWith('/api/dev-interface/apps/platform/restart', {
        method: 'POST'
      });
      expect(result).toEqual(restartedApp);
    });

    it('returns mock restarted app when restart API fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await DevInterfaceService.restartApp('platform');

      expect(result.id).toBe('platform');
      expect(result.status).toBe('running');
      expect(result.pid).toBeTypeOf('number');
      expect(result.uptime).toBe(0);
      expect(result.lastRestart).toBeInstanceOf(Date);
    });

    it('throws error for unknown app ID', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(DevInterfaceService.startApp('unknown')).rejects.toThrow();
      await expect(DevInterfaceService.stopApp('unknown')).rejects.toThrow();
      await expect(DevInterfaceService.restartApp('unknown')).rejects.toThrow();
    });
  });

  describe('Mock Data Generation', () => {
    it('generates appropriate mock files structure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await DevInterfaceService.loadFiles();

      expect(result).toHaveLength.greaterThan(0);
      
      // Should have apps folder
      const appsFolder = result.find(item => item.name === 'apps');
      expect(appsFolder).toBeDefined();
      expect(appsFolder?.type).toBe('folder');
      expect(appsFolder?.children).toBeDefined();

      // Should have package.json
      const packageJson = result.find(item => item.name === 'package.json');
      expect(packageJson).toBeDefined();
      expect(packageJson?.type).toBe('file');
    });

    it('filters files correctly in search', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await DevInterfaceService.searchFiles('storybook');

      // All returned files should contain 'storybook' in name or path
      result.forEach(file => {
        const matchesQuery = 
          file.name.toLowerCase().includes('storybook') ||
          file.path.toLowerCase().includes('storybook');
        expect(matchesQuery).toBe(true);
      });
    });

    it('generates consistent mock app data', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await DevInterfaceService.getAppStatus();

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Platform (Next.js)');
      expect(result[1].name).toBe('Storybook');
      expect(result[2].name).toBe('Studio (Artifact Viewer)');
      
      // Running apps should have expected properties
      const runningApps = result.filter(app => app.status === 'running');
      runningApps.forEach(app => {
        expect(app.pid).toBeTypeOf('number');
        expect(app.uptime).toBeTypeOf('number');
        expect(app.lastRestart).toBeInstanceOf(Date);
      });
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Should not throw, but return mock data
      const filesResult = await DevInterfaceService.loadFiles();
      expect(Array.isArray(filesResult)).toBe(true);

      const appsResult = await DevInterfaceService.getAppStatus();
      expect(Array.isArray(appsResult)).toBe(true);

      const chatResult = await DevInterfaceService.sendMessage('test', []);
      expect(typeof chatResult).toBe('string');
    });

    it('handles malformed API responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      const result = await DevInterfaceService.loadFiles();
      expect(Array.isArray(result)).toBe(true);
    });

    it('handles HTTP error status codes', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      // Should still return mock data, not throw
      const result = await DevInterfaceService.getAppStatus();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Resource Management API', () => {
    it('gets resource status successfully', async () => {
      const mockResourceData = {
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
          }
        ],
        issues: []
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResourceData)
      });

      const result = await DevInterfaceService.getResourceStatus();

      expect(mockFetch).toHaveBeenCalledWith('/api/dev-interface/resources');
      expect(result).toEqual(mockResourceData);
    });

    it('returns mock resource data when API fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await DevInterfaceService.getResourceStatus();

      expect(result).toHaveProperty('system');
      expect(result).toHaveProperty('processes');
      expect(result).toHaveProperty('issues');
      expect(Array.isArray(result.processes)).toBe(true);
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('kills process successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, pid: 12345 })
      });

      const result = await DevInterfaceService.killProcess(12345);

      expect(mockFetch).toHaveBeenCalledWith('/api/dev-interface/processes/12345/kill', {
        method: 'POST'
      });
      expect(result).toBe(true);
    });

    it('returns mock success when kill process API fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await DevInterfaceService.killProcess(12345);

      expect(result).toBe(true); // Mock always returns true
    });

    it('handles network errors gracefully for resource operations', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const resourceResult = await DevInterfaceService.getResourceStatus();
      expect(resourceResult).toHaveProperty('system');

      const killResult = await DevInterfaceService.killProcess(12345);
      expect(killResult).toBe(true);
    });
  });
});