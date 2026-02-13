'use client'

import type { ChatMessage, CodeFile, AppInfo, AppStatus, ResourceData, ProcessInfo } from '../ui/DevInterfacePage';

export class DevInterfaceService {
  private static readonly API_BASE = '/api';

  private static getApiBase(): string {
    // Check if we should use real backend based on Storybook data source
    const dataSource = (window as any).__STORYBOOK_DATA_SOURCE__;
    const apiBaseUrl = (window as any).__API_BASE_URL__;
    
    if (dataSource && dataSource !== 'mock' && apiBaseUrl) {
      return apiBaseUrl;
    }
    return this.API_BASE;
  }

  private static shouldUseMock(): boolean {
    // Always use mocks in Storybook environment unless explicitly configured otherwise
    const dataSource = (window as any).__STORYBOOK_DATA_SOURCE__;
    return !dataSource || dataSource === 'mock' || typeof window !== 'undefined';
  }

  // New method to get authentication status
  static async getAuthStatus(): Promise<{
    service: string;
    configured: boolean;
    authMethod: string;
    availableMethods?: string[];
    status: string;
    recommendation?: string;
  } | null> {
    try {
      const response = await fetch(`${this.getApiBase()}/ai/claude`, {
        method: 'GET',
      });
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Failed to get auth status:', error);
      return null;
    }
  }

  static async sendMessage(content: string, previousMessages: ChatMessage[], selectedFile?: any): Promise<string> {
    // If using mock mode, return mock response immediately
    if (this.shouldUseMock()) {
      return this.getMockResponse(content);
    }

    try {
      // Prepare conversation context for Claude API
      const conversation = previousMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString()
      }));

      // Prepare context if file is selected
      const context = selectedFile ? {
        selectedFile: {
          name: selectedFile.name,
          path: selectedFile.path,
          content: selectedFile.content || ''
        }
      } : undefined;

      // Use real Claude backend
      const response = await fetch(`${this.getApiBase()}/ai/claude`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          conversation,
          context
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        // Include authentication status in error message for better user feedback
        let errorMessage = `Claude API Error: ${errorData.error || response.statusText}`;
        if (errorData.authStatus && errorData.recommendation) {
          errorMessage += `\n\nAuthentication Status: ${errorData.authStatus.authMethod}\n${errorData.recommendation}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Claude API returns message in the response
      return data.message || data.response || 'Sorry, I received an empty response.';
    } catch (error) {
      console.error('Claude API error:', error);
      
      // Smart fallback with error indication
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('Authentication')) {
        return "I'm having trouble connecting to Claude. Please make sure you're authenticated and try again.";
      } else if (errorMessage.includes('Rate limit')) {
        return "I'm currently rate limited. Please wait a moment and try again.";
      } else if (errorMessage.includes('not configured')) {
        return "Claude integration is not configured. Please check the backend configuration.";
      }
      
      // Fallback to mock response for demo
      return this.getMockResponse(content) + "\n\n*(Note: Using mock response due to API error)*";
    }
  }

  static async loadFiles(): Promise<CodeFile[]> {
    // If using mock mode, return mock data immediately
    if (this.shouldUseMock()) {
      return this.getMockFiles();
    }

    try {
      const response = await fetch(`${this.getApiBase()}/dev-interface/files`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.files;
    } catch (error) {
      console.error('Failed to load files from backend:', error);
      // Fallback to mock data for demo
      return this.getMockFiles();
    }
  }

  static async searchFiles(query: string): Promise<CodeFile[]> {
    try {
      const response = await fetch(`${this.API_BASE}/dev-interface/files/search?q=${encodeURIComponent(query)}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.files;
    } catch (error) {
      // Fallback to mock search results
      const mockFiles = this.getMockFiles();
      return this.filterFilesByQuery(mockFiles, query);
    }
  }

  static async loadFileContent(file: CodeFile): Promise<CodeFile> {
    try {
      const response = await fetch(`${this.API_BASE}/dev-interface/files/content?path=${encodeURIComponent(file.path)}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        ...file,
        content: data.content
      };
    } catch (error) {
      // Fallback to mock content
      return {
        ...file,
        content: this.getMockFileContent(file)
      };
    }
  }

  // Mock implementations for demo purposes
  private static getMockResponse(userMessage: string): string {
    const responses = [
      "I understand you're asking about your codebase. Let me help you with that. Could you be more specific about what you'd like to know?",
      "Based on your question, I can help you analyze your code structure. Would you like me to explain any particular component or pattern?",
      "That's a great question! I can see you're working with a React application. Let me break down what I see in your codebase.",
      "I'd be happy to help you with that. From what I can analyze in your project structure, here are some suggestions...",
      "Let me help you understand this better. Your codebase follows some interesting patterns that I can explain."
    ];

    // Simple keyword-based responses
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('debug') || lowerMessage.includes('error') || lowerMessage.includes('bug')) {
      return "I can help you debug that issue. Can you share the specific error message or describe what's not working as expected? I'll analyze your code to find potential solutions.";
    }
    
    if (lowerMessage.includes('implement') || lowerMessage.includes('create') || lowerMessage.includes('add')) {
      return "I'd be happy to help you implement that feature. Can you describe what you'd like to build? I can suggest the best approach and help you write the code.";
    }
    
    if (lowerMessage.includes('explain') || lowerMessage.includes('understand') || lowerMessage.includes('how')) {
      return "I'll explain that for you. Based on your codebase structure, I can walk you through how different components work together and the patterns being used.";
    }
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private static getMockFiles(): CodeFile[] {
    return [
      {
        id: '1',
        name: 'apps',
        path: '/apps',
        type: 'folder',
        children: [
          {
            id: '2',
            name: 'storybook',
            path: '/apps/storybook',
            type: 'folder',
            children: [
              {
                id: '3',
                name: 'src',
                path: '/apps/storybook/src',
                type: 'folder',
                children: [
                  {
                    id: '4',
                    name: 'components',
                    path: '/apps/storybook/src/components',
                    type: 'folder',
                    children: [
                      {
                        id: '5',
                        name: 'Pages',
                        path: '/apps/storybook/src/components/Pages',
                        type: 'folder',
                        children: [
                          {
                            id: '6',
                            name: 'DevInterfacePage',
                            path: '/apps/storybook/src/components/Pages/DevInterfacePage',
                            type: 'folder'
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            id: '7',
            name: 'platform',
            path: '/apps/platform',
            type: 'folder',
            children: [
              {
                id: '8',
                name: 'src',
                path: '/apps/platform/src',
                type: 'folder'
              }
            ]
          }
        ]
      },
      {
        id: '9',
        name: 'package.json',
        path: '/package.json',
        type: 'file'
      },
      {
        id: '10',
        name: 'README.md',
        path: '/README.md',
        type: 'file'
      },
      {
        id: '11',
        name: 'CLAUDE.md',
        path: '/CLAUDE.md',
        type: 'file'
      }
    ];
  }

  private static getMockFileContent(file: CodeFile): string {
    // Simple mock content based on file type
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'tsx':
      case 'jsx':
        return `// ${file.name}
import React from 'react';

export function ${file.name.replace('.tsx', '').replace('.jsx', '')}() {
  return (
    <div>
      {/* Component content */}
    </div>
  );
}`;

      case 'ts':
      case 'js':
        return `// ${file.name}

export function example() {
  // Function implementation
  console.log('Hello from ${file.name}');
}`;

      case 'json':
        return `{
  "name": "mock-file",
  "version": "1.0.0",
  "description": "Mock content for ${file.name}"
}`;

      case 'md':
        return `# ${file.name}

This is mock content for the ${file.name} file.

## Overview

This file contains documentation about the project.`;

      default:
        return `// ${file.name}
// This is mock content for demonstration purposes
// Real implementation would load actual file content from the filesystem`;
    }
  }

  private static filterFilesByQuery(files: CodeFile[], query: string): CodeFile[] {
    const lowerQuery = query.toLowerCase();
    
    const filterRecursive = (fileList: CodeFile[]): CodeFile[] => {
      return fileList.filter(file => {
        const matchesName = file.name.toLowerCase().includes(lowerQuery);
        const matchesPath = file.path.toLowerCase().includes(lowerQuery);
        
        if (file.type === 'folder' && file.children) {
          const filteredChildren = filterRecursive(file.children);
          if (filteredChildren.length > 0) {
            return true;
          }
        }
        
        return matchesName || matchesPath;
      }).map(file => {
        if (file.type === 'folder' && file.children) {
          return {
            ...file,
            children: filterRecursive(file.children)
          };
        }
        return file;
      });
    };
    
    return filterRecursive(files);
  }

  // App Management Methods
  static async getAppStatus(): Promise<AppInfo[]> {
    // If using mock mode, return mock data immediately
    if (this.shouldUseMock()) {
      return this.getMockApps();
    }

    try {
      const response = await fetch(`${this.getApiBase()}/dev-interface/apps`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.apps;
    } catch (error) {
      console.error('Failed to load apps from backend:', error);
      // Fallback to mock data for demo
      return this.getMockApps();
    }
  }

  static async startApp(appId: string): Promise<AppInfo> {
    try {
      const response = await fetch(`${this.API_BASE}/dev-interface/apps/${appId}/start`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.app;
    } catch (error) {
      // Mock successful start for demo
      const mockApps = this.getMockApps();
      const app = mockApps.find(a => a.id === appId);
      if (app) {
        return {
          ...app,
          status: 'running' as AppStatus,
          pid: Math.floor(Math.random() * 10000) + 1000,
          uptime: 0,
          lastRestart: new Date()
        };
      }
      throw error;
    }
  }

  static async stopApp(appId: string): Promise<AppInfo> {
    try {
      const response = await fetch(`${this.API_BASE}/dev-interface/apps/${appId}/stop`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.app;
    } catch (error) {
      // Mock successful stop for demo
      const mockApps = this.getMockApps();
      const app = mockApps.find(a => a.id === appId);
      if (app) {
        return {
          ...app,
          status: 'stopped' as AppStatus,
          pid: undefined,
          uptime: undefined
        };
      }
      throw error;
    }
  }

  static async restartApp(appId: string): Promise<AppInfo> {
    try {
      const response = await fetch(`${this.API_BASE}/dev-interface/apps/${appId}/restart`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.app;
    } catch (error) {
      // Mock successful restart for demo
      const mockApps = this.getMockApps();
      const app = mockApps.find(a => a.id === appId);
      if (app) {
        return {
          ...app,
          status: 'running' as AppStatus,
          pid: Math.floor(Math.random() * 10000) + 1000,
          uptime: 0,
          lastRestart: new Date()
        };
      }
      throw error;
    }
  }

  // Mock implementations for demo purposes
  private static getMockApps(): AppInfo[] {
    return [
      {
        id: 'platform',
        name: 'Platform (Next.js)',
        description: 'Main Next.js application server',
        status: 'running',
        port: 3000,
        pid: 12345,
        uptime: 7200, // 2 hours
        lastRestart: new Date(Date.now() - 7200000)
      },
      {
        id: 'storybook',
        name: 'Storybook',
        description: 'Component development environment',
        status: 'running',
        port: 6006,
        pid: 12346,
        uptime: 5400, // 1.5 hours
        lastRestart: new Date(Date.now() - 5400000)
      },
      {
        id: 'studio',
        name: 'Studio (Artifact Viewer)',
        description: 'Release artifact viewer and explorer',
        status: 'stopped',
        port: 6007
      }
    ];
  }

  // Resource Management Methods
  static async getResourceStatus(): Promise<ResourceData> {
    try {
      const response = await fetch(`${this.API_BASE}/dev-interface/resources`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Fallback to mock data for demo
      return this.getMockResourceData();
    }
  }

  static async killProcess(pid: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/dev-interface/processes/${pid}/kill`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      // Mock successful kill for demo
      return true;
    }
  }

  // Mock resource data for demo purposes
  private static getMockResourceData(): ResourceData {
    const mockProcesses: ProcessInfo[] = [
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
        command: 'node node_modules/.bin/storybook dev',
        cpuPercent: 8.7,
        memoryMB: 189.3,
        type: 'app'
      },
      {
        pid: 12347,
        name: 'node',
        command: 'node node_modules/.bin/vitest run --reporter=json',
        cpuPercent: 25.4,
        memoryMB: 512.8,
        type: 'test'
      },
      {
        pid: 12348,
        name: 'node',
        command: 'node node_modules/.bin/vitest run --worker=1',
        cpuPercent: 18.9,
        memoryMB: 298.4,
        type: 'test'
      },
      {
        pid: 12349,
        name: 'node',
        command: 'node node_modules/.bin/vitest run --worker=2',
        cpuPercent: 22.1,
        memoryMB: 387.2,
        type: 'test'
      },
      {
        pid: 12350,
        name: 'node',
        command: 'node node_modules/.bin/vitest run --worker=3',
        cpuPercent: 19.6,
        memoryMB: 345.7,
        type: 'test'
      },
      {
        pid: 12351,
        name: 'node',
        command: 'node node_modules/.bin/vitest run --worker=4',
        cpuPercent: 16.8,
        memoryMB: 312.1,
        type: 'test'
      },
      {
        pid: 12352,
        name: 'node',
        command: 'node node_modules/.bin/vitest run --worker=5',
        cpuPercent: 21.3,
        memoryMB: 298.9,
        type: 'test'
      },
      {
        pid: 12353,
        name: 'node',
        command: 'node node_modules/.bin/vitest run --worker=6',
        cpuPercent: 24.7,
        memoryMB: 356.4,
        type: 'test'
      }
    ];

    const testWorkers = mockProcesses.filter(p => p.type === 'test');
    const issues = [];

    // Detect too many test workers
    if (testWorkers.length > 5) {
      issues.push({
        type: 'warning' as const,
        title: 'Too Many Test Workers',
        description: `${testWorkers.length} test worker processes are running. This may cause resource contention.`,
        suggestion: 'Consider reducing concurrent test workers or killing excess processes.',
        processes: testWorkers
      });
    }

    // Detect high memory usage processes
    const highMemoryProcesses = mockProcesses.filter(p => p.memoryMB > 400);
    if (highMemoryProcesses.length > 0) {
      issues.push({
        type: 'info' as const,
        title: 'High Memory Usage',
        description: `${highMemoryProcesses.length} processes are using more than 400MB of memory.`,
        suggestion: 'Monitor these processes for memory leaks.',
        processes: highMemoryProcesses
      });
    }

    return {
      system: {
        cpuPercent: 45.2,
        memoryPercent: 67.8,
        memoryUsedGB: 10.8,
        memoryTotalGB: 16.0,
        diskPercent: 23.4,
        diskUsedGB: 468.7,
        diskTotalGB: 2000.0,
        uptime: 142800 // 39.67 hours
      },
      processes: mockProcesses.sort((a, b) => b.cpuPercent - a.cpuPercent),
      issues
    };
  }
}