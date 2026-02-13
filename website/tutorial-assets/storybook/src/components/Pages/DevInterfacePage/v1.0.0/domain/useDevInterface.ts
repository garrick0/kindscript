'use client'

import { useCallback, useEffect, useState } from 'react';
import type { ChatMessage, CodeFile, AppInfo, ResourceData } from '../ui/DevInterfacePage';
import { DevInterfaceService } from './devInterface.service';

export function useDevInterface(initialFiles?: CodeFile[], initialApps?: AppInfo[], initialResources?: ResourceData) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m Claude Code, your AI development assistant. I can help you understand your codebase, debug issues, implement features, and answer questions about your code. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  
  const [files, setFiles] = useState<CodeFile[]>(initialFiles || []);
  const [apps, setApps] = useState<AppInfo[]>(initialApps || []);
  const [resources, setResources] = useState<ResourceData | null>(initialResources || null);
  const [selectedFile, setSelectedFileState] = useState<CodeFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);


  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      const response = await DevInterfaceService.sendMessage(content, messages, selectedFile);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err as Error);
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [messages, selectedFile]);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const loadedFiles = await DevInterfaceService.loadFiles();
      setFiles(loadedFiles);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchFiles = useCallback(async (query: string) => {
    if (!query.trim()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchResults = await DevInterfaceService.searchFiles(query);
      setFiles(searchResults);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const openFile = useCallback(async (file: CodeFile): Promise<CodeFile> => {
    if (file.content) {
      return file;
    }

    setLoading(true);
    setError(null);

    try {
      const fileWithContent = await DevInterfaceService.loadFileContent(file);
      
      // Update the files state with the loaded content
      setFiles(prev => prev.map(f => 
        f.id === file.id ? fileWithContent : f
      ));
      
      return fileWithContent;
    } catch (err) {
      setError(err as Error);
      return file;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAppStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const appStatus = await DevInterfaceService.getAppStatus();
      setApps(appStatus);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const startApp = useCallback(async (appId: string) => {
    setLoading(true);
    setError(null);

    try {
      const updatedApp = await DevInterfaceService.startApp(appId);
      setApps(prev => prev.map(app => 
        app.id === appId ? updatedApp : app
      ));
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const stopApp = useCallback(async (appId: string) => {
    setLoading(true);
    setError(null);

    try {
      const updatedApp = await DevInterfaceService.stopApp(appId);
      setApps(prev => prev.map(app => 
        app.id === appId ? updatedApp : app
      ));
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const restartApp = useCallback(async (appId: string) => {
    setLoading(true);
    setError(null);

    try {
      const updatedApp = await DevInterfaceService.restartApp(appId);
      setApps(prev => prev.map(app => 
        app.id === appId ? updatedApp : app
      ));
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshResources = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const resourceData = await DevInterfaceService.getResourceStatus();
      setResources(resourceData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const killProcess = useCallback(async (pid: number) => {
    setLoading(true);
    setError(null);

    try {
      const success = await DevInterfaceService.killProcess(pid);
      if (success && resources) {
        // Remove the killed process from the resources
        setResources(prev => prev ? {
          ...prev,
          processes: prev.processes.filter(p => p.pid !== pid)
        } : null);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [resources]);

  // Load apps on mount if none provided
  useEffect(() => {
    if (!initialApps || initialApps.length === 0) {
      refreshAppStatus();
    }
  }, [initialApps, refreshAppStatus]);

  return {
    messages,
    files,
    apps,
    resources,
    selectedFile,
    loading,
    error,
    sendMessage,
    loadFiles,
    searchFiles,
    openFile,
    setSelectedFile: setSelectedFileState,
    startApp,
    stopApp,
    restartApp,
    refreshAppStatus,
    refreshResources,
    killProcess
  };
}