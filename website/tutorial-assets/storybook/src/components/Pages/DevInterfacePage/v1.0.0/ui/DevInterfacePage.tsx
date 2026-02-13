'use client'

import {
    Bot, Code, File, FileText, Folder, FolderOpen, MessageSquare, Search, Send, Settings, Terminal,
    Play, Square, RotateCcw, Activity, CheckCircle, XCircle, Clock, Monitor, Cpu, HardDrive, 
    MemoryStick, AlertTriangle, TrendingUp, Zap, Users
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Skeleton } from '../../../../atoms/Skeleton';
import { ErrorBoundary } from '../../../../molecules/ErrorBoundary';
import { useDevInterface } from '../domain/useDevInterface';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface CodeFile {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  children?: CodeFile[];
}

export type AppStatus = 'running' | 'stopped' | 'starting' | 'stopping' | 'error';

export interface AppInfo {
  id: string;
  name: string;
  description: string;
  status: AppStatus;
  port?: number;
  pid?: number;
  uptime?: number;
  lastRestart?: Date;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  command: string;
  cpuPercent: number;
  memoryMB: number;
  type: 'app' | 'test' | 'other';
}

export interface SystemResources {
  cpuPercent: number;
  memoryPercent: number;
  memoryUsedGB: number;
  memoryTotalGB: number;
  diskPercent: number;
  diskUsedGB: number;
  diskTotalGB: number;
  uptime: number;
}

export interface ResourceIssue {
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  suggestion: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  processes?: ProcessInfo[];
}

export interface ResourceData {
  system: SystemResources;
  processes: ProcessInfo[];
  issues: ResourceIssue[];
}

export interface DevInterfacePageProps {
  initialFiles?: CodeFile[];
  initialApps?: AppInfo[];
  initialResources?: ResourceData;
}

export function DevInterfacePage({ initialFiles, initialApps, initialResources }: DevInterfacePageProps) {
  const { 
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
    setSelectedFile,
    startApp,
    stopApp,
    restartApp,
    refreshAppStatus,
    refreshResources,
    killProcess
  } = useDevInterface(initialFiles, initialApps, initialResources);

  const [activeTab, setActiveTab] = useState<'chat' | 'browser' | 'apps' | 'resources'>('chat');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showChatInterface, setShowChatInterface] = useState(false); // Track if user wants to see chat interface

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim()) return;
    
    await sendMessage(messageInput);
    setMessageInput('');
  }, [messageInput, sendMessage]);

  const handleFileClick = useCallback(async (file: CodeFile) => {
    if (file.type === 'folder') {
      setExpandedFolders(prev => {
        const next = new Set(prev);
        if (next.has(file.id)) {
          next.delete(file.id);
        } else {
          next.add(file.id);
        }
        return next;
      });
    } else {
      const fileWithContent = await openFile(file);
      setSelectedFile(fileWithContent);
    }
  }, [openFile]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      await searchFiles(query);
    }
  }, [searchFiles]);

  const getStatusIcon = (status: AppStatus) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'stopped':
        return <XCircle className="h-5 w-5 text-gray-400" />;
      case 'starting':
      case 'stopping':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: AppStatus) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'stopped':
        return 'bg-gray-100 text-gray-800';
      case 'starting':
      case 'stopping':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatUptime = (uptime?: number) => {
    if (!uptime) return 'N/A';
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 75) return 'bg-yellow-500';
    if (percentage < 90) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getSeverityColor = (severity: ResourceIssue['severity']) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: ResourceIssue['severity']) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-blue-600" />;
    }
  };

  const renderFileTree = (files: CodeFile[], level = 0) => {
    return files.map(file => (
      <div key={file.id} className={`ml-${level * 4}`}>
        <div
          className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 cursor-pointer rounded"
          onClick={() => handleFileClick(file)}
        >
          {file.type === 'folder' ? (
            expandedFolders.has(file.id) ? 
              <FolderOpen className="h-4 w-4 text-blue-500" /> :
              <Folder className="h-4 w-4 text-blue-500" />
          ) : (
            <File className="h-4 w-4 text-gray-500" />
          )}
          <span className="text-sm truncate">{file.name}</span>
        </div>
        {file.type === 'folder' && expandedFolders.has(file.id) && file.children && (
          <div className="ml-4">
            {renderFileTree(file.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  if (loading && !files.length) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <Skeleton variant="text" width="300px" height={36} className="mb-2" />
              <Skeleton variant="text" width="500px" height={24} />
            </div>
            <div className="flex gap-6 h-96">
              <div className="w-1/3">
                <Skeleton variant="rounded" height="100%" />
              </div>
              <div className="flex-1">
                <Skeleton variant="rounded" height="100%" />
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Error loading development interface: {error.message}</p>
          <button 
            onClick={() => loadFiles()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Terminal className="h-8 w-8" />
              Development Interface
            </h1>
            <p className="mt-2 text-gray-600">
              Chat with Claude Code and browse your codebase
            </p>
          </div>

          <div className="flex gap-6 h-[calc(100vh-200px)]">
            {/* Left Panel - Navigation */}
            <div className="w-80 bg-white rounded-lg shadow flex flex-col">
              {/* Tab Navigation */}
              <div className="grid grid-cols-4 border-b">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium ${
                    activeTab === 'chat'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Chat</span>
                </button>
                <button
                  onClick={() => setActiveTab('browser')}
                  className={`flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium ${
                    activeTab === 'browser'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Code className="h-4 w-4" />
                  <span className="hidden sm:inline">Files</span>
                </button>
                <button
                  onClick={() => setActiveTab('apps')}
                  className={`flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium ${
                    activeTab === 'apps'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:inline">Apps</span>
                </button>
                <button
                  onClick={() => setActiveTab('resources')}
                  className={`flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium ${
                    activeTab === 'resources'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Monitor className="h-4 w-4" />
                  <span className="hidden sm:inline">Resources</span>
                </button>
              </div>

              {/* Chat Tab */}
              {activeTab === 'chat' && !showChatInterface && (
                <div className="flex-1 flex flex-col">
                  {/* Chat Messages */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={`flex items-start gap-3 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Bot className="h-4 w-4 text-blue-600" />
                          </div>
                        )}
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask Claude Code anything..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* File Browser Tab */}
              {activeTab === 'browser' && (
                <div className="flex-1 flex flex-col">
                  {/* Search */}
                  <div className="p-4 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search files..."
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* File Tree */}
                  <div className="flex-1 p-4 overflow-y-auto">
                    {files.length > 0 ? (
                      <div className="space-y-1">
                        {renderFileTree(files)}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No files loaded</p>
                        <button
                          onClick={loadFiles}
                          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Load Files
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Apps Tab */}
              {activeTab === 'apps' && (
                <div className="flex-1 flex flex-col">
                  {/* Header */}
                  <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">Application Status</h3>
                    <button
                      onClick={refreshAppStatus}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded transition-colors"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Apps List */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {apps.map(app => (
                      <div key={app.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(app.status)}
                            <div>
                              <h4 className="font-medium text-gray-900">{app.name}</h4>
                              <p className="text-sm text-gray-500">{app.description}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(app.status)}`}>
                            {app.status}
                          </span>
                        </div>

                        {/* App Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          {app.port && (
                            <div>
                              <span className="text-gray-500">Port:</span>
                              <span className="ml-2 font-mono">{app.port}</span>
                            </div>
                          )}
                          {app.pid && (
                            <div>
                              <span className="text-gray-500">PID:</span>
                              <span className="ml-2 font-mono">{app.pid}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500">Uptime:</span>
                            <span className="ml-2">{formatUptime(app.uptime)}</span>
                          </div>
                          {app.lastRestart && (
                            <div>
                              <span className="text-gray-500">Last Restart:</span>
                              <span className="ml-2">{app.lastRestart.toLocaleTimeString()}</span>
                            </div>
                          )}
                        </div>

                        {/* Control Buttons */}
                        <div className="flex gap-2">
                          {app.status === 'stopped' && (
                            <button
                              onClick={() => startApp(app.id)}
                              disabled={loading}
                              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                              <Play className="h-4 w-4" />
                              Start
                            </button>
                          )}
                          {app.status === 'running' && (
                            <button
                              onClick={() => stopApp(app.id)}
                              disabled={loading}
                              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                              <Square className="h-4 w-4" />
                              Stop
                            </button>
                          )}
                          {(app.status === 'running' || app.status === 'error') && (
                            <button
                              onClick={() => restartApp(app.id)}
                              disabled={loading}
                              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                              <RotateCcw className="h-4 w-4" />
                              Restart
                            </button>
                          )}
                          {app.port && app.status === 'running' && (
                            <a
                              href={`http://localhost:${app.port}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                            >
                              <Terminal className="h-4 w-4" />
                              Open
                            </a>
                          )}
                        </div>
                      </div>
                    ))}

                    {apps.length === 0 && (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No applications found</p>
                        <button
                          onClick={refreshAppStatus}
                          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Refresh
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Resources Tab */}
              {activeTab === 'resources' && (
                <div className="flex-1 flex flex-col">
                  {/* Header */}
                  <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">Resource Monitoring</h3>
                    <button
                      onClick={refreshResources}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded transition-colors"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Resources Content */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {resources ? (
                      <>
                        {/* System Metrics Cards */}
                        <div className="grid grid-cols-1 gap-3">
                          {/* CPU Card */}
                          <div className="border rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Cpu className="h-4 w-4 text-blue-500" />
                              <span className="text-sm font-medium">CPU</span>
                              <span className="text-sm text-gray-500 ml-auto">{resources.system.cpuPercent}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(resources.system.cpuPercent)}`}
                                style={{ width: `${resources.system.cpuPercent}%` }}
                              />
                            </div>
                          </div>

                          {/* Memory Card */}
                          <div className="border rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <MemoryStick className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-medium">Memory</span>
                              <span className="text-sm text-gray-500 ml-auto">
                                {formatBytes(resources.system.memoryUsedGB * 1024 * 1024 * 1024)} / {formatBytes(resources.system.memoryTotalGB * 1024 * 1024 * 1024)}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(resources.system.memoryPercent)}`}
                                style={{ width: `${resources.system.memoryPercent}%` }}
                              />
                            </div>
                          </div>

                          {/* Disk Card */}
                          <div className="border rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <HardDrive className="h-4 w-4 text-purple-500" />
                              <span className="text-sm font-medium">Disk</span>
                              <span className="text-sm text-gray-500 ml-auto">
                                {formatBytes(resources.system.diskUsedGB * 1024 * 1024 * 1024)} / {formatBytes(resources.system.diskTotalGB * 1024 * 1024 * 1024)}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(resources.system.diskPercent)}`}
                                style={{ width: `${resources.system.diskPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Resource Issues */}
                        {resources.issues && resources.issues.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              Resource Issues
                            </h4>
                            {resources.issues.map((issue, index) => (
                              <div key={index} className={`border rounded-lg p-3 ${getSeverityColor(issue.severity || 'low')}`}>
                                <div className="flex items-start gap-2">
                                  {getSeverityIcon(issue.severity || 'low')}
                                  <div className="flex-1">
                                    <h5 className="font-medium text-sm">{issue.title}</h5>
                                    <p className="text-sm opacity-90 mt-1">{issue.description}</p>
                                    <p className="text-sm opacity-75 mt-1">{issue.suggestion}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Top Processes */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                            Top Processes by CPU
                          </h4>
                          <div className="space-y-1">
                            {resources.processes?.slice(0, 8).map(process => (
                              <div key={process.pid} className="flex items-center gap-2 p-2 border rounded text-sm">
                                <div className="flex-1 min-w-0">
                                  <div className="font-mono text-xs truncate">{process.command}</div>
                                  <div className="text-gray-500 text-xs">PID: {process.pid}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">{process.cpuPercent}%</div>
                                  <div className="text-gray-500 text-xs">{formatBytes(process.memoryMB * 1024 * 1024)}</div>
                                </div>
                                {process.type === 'test' && (
                                  <button
                                    onClick={() => killProcess(process.pid)}
                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                    title="Kill process"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Test Worker Detection */}
                        {resources.processes && (
                          <div className="space-y-2">
                            {(() => {
                              const testWorkers = resources.processes.filter(p => p.type === 'test');
                              if (testWorkers.length > 0) {
                                return (
                                  <>
                                    <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                      <Users className="h-4 w-4 text-orange-500" />
                                      Test Workers ({testWorkers.length})
                                      {testWorkers.length > 5 && (
                                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                          Too many!
                                        </span>
                                      )}
                                    </h4>
                                    <div className="space-y-1">
                                      {testWorkers.map(worker => (
                                        <div key={worker.pid} className="flex items-center gap-2 p-2 border rounded text-sm bg-orange-50">
                                          <div className="flex-1 min-w-0">
                                            <div className="font-mono text-xs truncate">{worker.command}</div>
                                            <div className="text-gray-500 text-xs">PID: {worker.pid}</div>
                                          </div>
                                          <div className="text-right">
                                            <div className="font-medium">{worker.cpuPercent}%</div>
                                            <div className="text-gray-500 text-xs">{formatBytes(worker.memoryMB * 1024 * 1024)}</div>
                                          </div>
                                          <button
                                            onClick={() => killProcess(worker.pid)}
                                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                                            title="Kill test worker"
                                          >
                                            <XCircle className="h-4 w-4" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No resource data available</p>
                        <button
                          onClick={refreshResources}
                          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Load Resources
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel - Content */}
            <div className="flex-1 bg-white rounded-lg shadow flex flex-col">
              {selectedFile ? (
                <>
                  {/* File Header */}
                  <div className="px-6 py-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <File className="h-5 w-5 text-gray-500" />
                      <div>
                        <h2 className="font-medium text-gray-900">{selectedFile.name}</h2>
                        <p className="text-sm text-gray-500">{selectedFile.path}</p>
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded">
                      <Settings className="h-5 w-5" />
                    </button>
                  </div>

                  {/* File Content */}
                  <div className="flex-1 p-6 overflow-y-auto">
                    <pre className="text-sm text-gray-900 font-mono bg-gray-50 p-4 rounded-lg overflow-x-auto">
                      {selectedFile.content || 'Loading...'}
                    </pre>
                  </div>
                </>
              ) : showChatInterface ? (
                /* Chat Interface */
                <div className="flex-1 flex flex-col">
                  {/* Chat Messages */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={`flex items-start gap-3 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Bot className="h-4 w-4 text-blue-600" />
                          </div>
                        )}
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask Claude Code anything..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Welcome State */
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      Welcome to the Development Interface
                    </h2>
                    <p className="text-gray-600 mb-6 max-w-md">
                      Start a conversation with Claude Code or browse your files to get started.
                      Claude can help you understand your codebase, debug issues, and implement new features.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={() => {
                          setActiveTab('chat');
                          setShowChatInterface(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Start Chat
                      </button>
                      <button
                        onClick={() => setActiveTab('browser')}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Code className="h-4 w-4" />
                        Browse Files
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}