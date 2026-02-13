'use client';

import { useState } from 'react';
import { 
  Bot, 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Play,
  Pause,
  RefreshCw,
  BarChart3,
  Zap
} from 'lucide-react';
import { cn } from '../../../../utils/cn';

interface AIOperation {
  id: string;
  type: 'document-generation' | 'analysis' | 'consolidation' | 'translation' | 'optimization';
  name: string;
  status: 'idle' | 'running' | 'completed' | 'error' | 'paused';
  progress?: number;
  startTime?: string;
  endTime?: string;
  duration?: number;
  inputTokens?: number;
  outputTokens?: number;
  cost?: number;
  result?: any;
  error?: string;
}

interface AIOperationsDashboardProps {
  operations: AIOperation[];
  onStartOperation?: (operationType: string, config?: any) => void;
  onStopOperation?: (operationId: string) => void;
  onPauseOperation?: (operationId: string) => void;
  onResumeOperation?: (operationId: string) => void;
  onRetryOperation?: (operationId: string) => void;
  onClearOperation?: (operationId: string) => void;
  className?: string;
}

const OPERATION_TYPES = [
  {
    type: 'document-generation',
    name: 'Document Generation',
    description: 'Generate new documents from templates or prompts',
    icon: '📝'
  },
  {
    type: 'analysis',
    name: 'Content Analysis',
    description: 'Analyze document content for insights and patterns',
    icon: '🔍'
  },
  {
    type: 'consolidation',
    name: 'Document Consolidation',
    description: 'Merge and organize multiple documents',
    icon: '📚'
  },
  {
    type: 'translation',
    name: 'Translation',
    description: 'Translate documents to different languages',
    icon: '🌐'
  },
  {
    type: 'optimization',
    name: 'Content Optimization',
    description: 'Improve document structure and readability',
    icon: '⚡'
  }
];

export function AIOperationsDashboard({
  operations,
  onStartOperation,
  onStopOperation,
  onPauseOperation,
  onResumeOperation,
  onRetryOperation,
  onClearOperation,
  className
}: AIOperationsDashboardProps) {
  const [showNewOperationModal, setShowNewOperationModal] = useState(false);

  const getStatusIcon = (status: AIOperation['status']) => {
    switch (status) {
      case 'idle':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: AIOperation['status']) => {
    switch (status) {
      case 'idle':
        return 'bg-gray-100 text-gray-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(cost);
  };

  const runningOperations = operations.filter(op => op.status === 'running');
  const completedOperations = operations.filter(op => op.status === 'completed');

  const totalTokens = operations.reduce((sum, op) => 
    sum + (op.inputTokens || 0) + (op.outputTokens || 0), 0
  );
  const totalCost = operations.reduce((sum, op) => sum + (op.cost || 0), 0);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header & Stats */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI Operations</h2>
              <p className="text-gray-600">Monitor and manage AI-powered tasks</p>
            </div>
          </div>
          {onStartOperation && (
            <button
              onClick={() => setShowNewOperationModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Play className="h-4 w-4" />
              New Operation
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Running</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{runningOperations.length}</div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">Completed</span>
            </div>
            <div className="text-2xl font-bold text-green-900">{completedOperations.length}</div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Total Tokens</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {totalTokens.toLocaleString()}
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Total Cost</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {formatCost(totalCost)}
            </div>
          </div>
        </div>
      </div>

      {/* Operations List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Operations</h3>
        </div>

        {operations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No AI operations yet</p>
            <p className="text-sm mt-1">Start your first operation to see it here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {operations.map((operation) => (
              <div key={operation.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">
                      {OPERATION_TYPES.find(t => t.type === operation.type)?.icon || '🤖'}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">{operation.name}</h4>
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs",
                          getStatusColor(operation.status)
                        )}>
                          {getStatusIcon(operation.status)}
                          {operation.status}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      {operation.status === 'running' && operation.progress !== undefined && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{Math.round(operation.progress)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${operation.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        {operation.duration && (
                          <div>
                            <span className="block font-medium">Duration</span>
                            <span>{formatDuration(operation.duration)}</span>
                          </div>
                        )}
                        {operation.inputTokens && (
                          <div>
                            <span className="block font-medium">Input Tokens</span>
                            <span>{operation.inputTokens.toLocaleString()}</span>
                          </div>
                        )}
                        {operation.outputTokens && (
                          <div>
                            <span className="block font-medium">Output Tokens</span>
                            <span>{operation.outputTokens.toLocaleString()}</span>
                          </div>
                        )}
                        {operation.cost && (
                          <div>
                            <span className="block font-medium">Cost</span>
                            <span>{formatCost(operation.cost)}</span>
                          </div>
                        )}
                      </div>

                      {/* Error Message */}
                      {operation.error && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 text-red-700">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-medium">Error</span>
                          </div>
                          <p className="text-red-600 text-sm mt-1">{operation.error}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {operation.status === 'running' && onPauseOperation && (
                      <button
                        onClick={() => onPauseOperation(operation.id)}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                        title="Pause"
                      >
                        <Pause className="h-4 w-4" />
                      </button>
                    )}
                    
                    {operation.status === 'paused' && onResumeOperation && (
                      <button
                        onClick={() => onResumeOperation(operation.id)}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                        title="Resume"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                    )}
                    
                    {operation.status === 'running' && onStopOperation && (
                      <button
                        onClick={() => onStopOperation(operation.id)}
                        className="p-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                        title="Stop"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                    
                    {operation.status === 'error' && onRetryOperation && (
                      <button
                        onClick={() => onRetryOperation(operation.id)}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                        title="Retry"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    )}

                    {onClearOperation && ['completed', 'error'].includes(operation.status) && (
                      <button
                        onClick={() => onClearOperation(operation.id)}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                        title="Clear"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Operation Modal */}
      {showNewOperationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Start New Operation</h3>
            </div>
            <div className="p-6 space-y-4">
              {OPERATION_TYPES.map((type) => (
                <button
                  key={type.type}
                  onClick={() => {
                    onStartOperation?.(type.type);
                    setShowNewOperationModal(false);
                  }}
                  className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{type.name}</div>
                      <div className="text-sm text-gray-600">{type.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowNewOperationModal(false)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export type { AIOperationsDashboardProps, AIOperation };