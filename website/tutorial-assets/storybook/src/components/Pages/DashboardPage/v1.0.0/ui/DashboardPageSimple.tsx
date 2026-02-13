'use client';

import { Clock, FileText, GitBranch, Minus, Package, TrendingDown, TrendingUp, Workflow } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

export interface DashboardPageSimpleProps {
  userId?: string;
}

const iconMap = {
  'Documents': FileText,
  'Releases': Package,
  'Pages': GitBranch,
  'Workflows': Workflow,
};

const colorMap = {
  blue: 'bg-blue-600 hover:bg-blue-700',
  green: 'bg-green-600 hover:bg-green-700',
  purple: 'bg-purple-600 hover:bg-purple-700',
};

// Mock data for the simple dashboard
const mockStats = [
  { name: 'Documents', value: 42, change: '+12%', changeType: 'increase' as const },
  { name: 'Releases', value: 8, change: '+3%', changeType: 'increase' as const },
  { name: 'Pages', value: 156, change: '-2%', changeType: 'decrease' as const },
  { name: 'Workflows', value: 23, change: '0%', changeType: 'neutral' as const },
];

const mockActivity = [
  { id: '1', type: 'document', action: 'Created new document', time: '5 minutes ago', userName: 'John Doe' },
  { id: '2', type: 'release', action: 'Published release v1.2.0', time: '1 hour ago', userName: 'Jane Smith' },
  { id: '3', type: 'page', action: 'Updated homepage', time: '2 hours ago', userName: 'Bob Wilson' },
];

const mockQuickActions = [
  { id: 'create-document', title: 'Create Document', description: 'Start a new document', color: 'blue' },
  { id: 'generate-page', title: 'Generate Page', description: 'AI-powered page generation', color: 'purple' },
  { id: 'start-workflow', title: 'Start Workflow', description: 'Begin a new workflow', color: 'green' },
];

export function DashboardPageSimple({ userId }: DashboardPageSimpleProps) {
  const router = useRouter();
  
  // Map stat names to navigation paths
  const statPaths: Record<string, string> = {
    'Documents': '/documents',
    'Releases': '/releases',
    'Pages': '/pages',
    'Workflows': '/workflows'
  };

  const handleQuickAction = (actionId: string) => {
    console.log('Quick action clicked:', actionId);
    switch (actionId) {
      case 'create-document':
        router.push('/documents/new');
        break;
      case 'generate-page':
        router.push('/pages/generate');
        break;
      case 'start-workflow':
        router.push('/workflows/new');
        break;
    }
  };

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back!
        </h1>
        <p className="text-gray-600 mt-2">
          Build AI-powered applications with hierarchical context management
        </p>
      </div>

      {/* Stats Grid - Now Clickable! */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {mockStats.map((stat) => {
          const Icon = iconMap[stat.name as keyof typeof iconMap] || FileText;
          const TrendIcon = stat.changeType === 'increase' ? TrendingUp : 
                           stat.changeType === 'decrease' ? TrendingDown : Minus;
          const navigationPath = statPaths[stat.name];
          
          return (
            <div 
              key={stat.name} 
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigationPath && router.push(navigationPath)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-2">{stat.value}</p>
                  <div className="flex items-center mt-1">
                    <TrendIcon className={`h-4 w-4 mr-1 ${
                      stat.changeType === 'increase' ? 'text-green-600' : 
                      stat.changeType === 'decrease' ? 'text-red-600' : 
                      'text-gray-400'
                    }`} />
                    <p className={`text-sm ${
                      stat.changeType === 'increase' ? 'text-green-600' : 
                      stat.changeType === 'decrease' ? 'text-red-600' : 
                      'text-gray-500'
                    }`}>
                      {stat.change} this week
                    </p>
                  </div>
                </div>
                <Icon className="h-8 w-8 text-gray-400" />
              </div>
              {navigationPath && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View all →
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {mockActivity.map((activity) => (
            <div key={activity.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'document' ? 'bg-blue-600' :
                  activity.type === 'release' ? 'bg-green-600' :
                  activity.type === 'page' ? 'bg-purple-600' :
                  'bg-gray-600'
                }`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <div className="flex items-center space-x-3 mt-1">
                    <p className="text-xs text-gray-500">
                      Type: {activity.type}
                    </p>
                    <p className="text-xs text-gray-500">
                      By: {activity.userName}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                {activity.time}
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 border-t border-gray-200">
          <button 
            onClick={() => router.push('/activity')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all activity →
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockQuickActions.map((action) => {
            const bgColor = colorMap[action.color as keyof typeof colorMap] || colorMap.blue;
            const Icon = action.id === 'create-document' ? FileText :
                         action.id === 'generate-page' ? GitBranch :
                         action.id === 'start-workflow' ? Workflow : FileText;
            
            return (
              <button 
                key={action.id}
                onClick={() => handleQuickAction(action.id)}
                className={`${bgColor} text-white rounded-lg p-6 transition-colors`}
              >
                <Icon className="h-8 w-8 mb-4" />
                <h3 className="font-semibold mb-2">{action.title}</h3>
                <p className="text-sm opacity-90">{action.description}</p>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Quick Navigation */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Explore Platform</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => router.push('/knowledge')}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors text-left"
          >
            <Package className="h-6 w-6 text-purple-600 mb-2" />
            <h3 className="font-medium text-gray-900">Knowledge Base</h3>
            <p className="text-sm text-gray-500 mt-1">AI-ready documentation</p>
          </button>
          <button 
            onClick={() => router.push('/studio')}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors text-left"
          >
            <GitBranch className="h-6 w-6 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900">Studio</h3>
            <p className="text-sm text-gray-500 mt-1">Component explorer</p>
          </button>
          <button 
            onClick={() => router.push('/pages')}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors text-left"
          >
            <FileText className="h-6 w-6 text-green-600 mb-2" />
            <h3 className="font-medium text-gray-900">Pages</h3>
            <p className="text-sm text-gray-500 mt-1">Manage site pages</p>
          </button>
          <button 
            onClick={() => router.push('/settings')}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors text-left"
          >
            <Workflow className="h-6 w-6 text-orange-600 mb-2" />
            <h3 className="font-medium text-gray-900">Settings</h3>
            <p className="text-sm text-gray-500 mt-1">Configure platform</p>
          </button>
        </div>
      </div>
    </div>
  );
}