'use client';

import { Workflow, Plus, Play, Pause, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useWorkflows } from './useWorkflows';

export interface WorkflowsPageProps {
  userId?: string;
}

export function WorkflowsPage({ userId }: WorkflowsPageProps) {
  const { workflows, executeWorkflow, pauseWorkflow } = useWorkflows(userId);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'running':
        return <Play className="h-5 w-5 text-blue-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-gray-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'running':
        return 'bg-blue-500';
      case 'failed':
        return 'bg-red-500';
      case 'pending':
        return 'bg-gray-300';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
          <p className="text-gray-600 mt-2">
            Automate your development pipeline
          </p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New Workflow
        </button>
      </div>

      {/* Workflow List */}
      <div className="space-y-4">
        {workflows.map((workflow) => (
          <div key={workflow.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  {getStatusIcon(workflow.status)}
                  <h3 className="ml-3 text-lg font-semibold text-gray-900">
                    {workflow.name}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {workflow.description}
                </p>
                
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{workflow.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(workflow.status)}`}
                      style={{ width: `${workflow.progress}%` }}
                    />
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500">
                  <span>Last run: {workflow.lastRun}</span>
                  <span>Duration: {workflow.duration}</span>
                  <span>{workflow.steps} steps</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 ml-4">
                {workflow.status === 'pending' || workflow.status === 'failed' ? (
                  <button 
                    onClick={() => executeWorkflow(workflow.id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                ) : workflow.status === 'running' ? (
                  <button 
                    onClick={() => pauseWorkflow(workflow.id)}
                    className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    <Pause className="h-4 w-4" />
                  </button>
                ) : null}
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Workflow Templates */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Workflow Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="text-left p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50">
            <Workflow className="h-8 w-8 text-gray-400 mb-2" />
            <h3 className="font-medium">Document Consolidation</h3>
            <p className="text-sm text-gray-600 mt-1">
              Merge multiple sources into one authoritative document
            </p>
          </button>
          <button className="text-left p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50">
            <Workflow className="h-8 w-8 text-gray-400 mb-2" />
            <h3 className="font-medium">Page Generation</h3>
            <p className="text-sm text-gray-600 mt-1">
              Generate page specifications from PRD
            </p>
          </button>
          <button className="text-left p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50">
            <Workflow className="h-8 w-8 text-gray-400 mb-2" />
            <h3 className="font-medium">Complete Pipeline</h3>
            <p className="text-sm text-gray-600 mt-1">
              End-to-end from documents to wireframes
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}