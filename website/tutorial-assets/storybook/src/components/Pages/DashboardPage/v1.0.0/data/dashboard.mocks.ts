import type { Activity, DashboardStat, Notification, QuickAction } from '../types/dashboard.types';

export const mockStats: DashboardStat[] = [
  { 
    name: 'Documents', 
    label: 'Total Documents', 
    value: '42', 
    change: '+12', 
    changeType: 'increase' 
  },
  { 
    name: 'Releases', 
    label: 'Active Releases', 
    value: '3', 
    change: '-2', 
    changeType: 'decrease' 
  },
  { 
    name: 'Pages', 
    label: 'Pages', 
    value: '8', 
    change: '0', 
    changeType: 'neutral' 
  },
  { 
    name: 'Workflows', 
    label: 'Active Workflows', 
    value: '5', 
    change: '+1', 
    changeType: 'increase' 
  }
];

export const mockActivity: Activity[] = [
  {
    id: '1',
    type: 'document',
    action: 'Created Q4 Product Roadmap',
    time: '5 minutes ago',
    userName: 'John Doe'
  },
  {
    id: '2',
    type: 'release',
    action: 'Published Version 2.1.0',
    time: '30 minutes ago',
    userName: 'Jane Smith'
  },
  {
    id: '3',
    type: 'workflow',
    action: 'Completed Content Review',
    time: '1 hour ago',
    userName: 'Bob Wilson'
  },
  {
    id: '4',
    type: 'page',
    action: 'Updated Dashboard Page',
    time: '2 hours ago',
    userName: 'Alice Johnson'
  },
  {
    id: '5',
    type: 'document',
    action: 'Shared API Documentation',
    time: '3 hours ago',
    userName: 'Charlie Brown'
  }
];

export const mockQuickActions: QuickAction[] = [
  {
    id: 'create-document',
    title: 'Create Document',
    description: 'Start a new document with AI assistance',
    icon: 'FileText',
    color: 'blue'
  },
  {
    id: 'generate-page',
    title: 'Generate Page',
    description: 'Create a new page from wireframes',
    icon: 'GitBranch',
    color: 'purple'
  },
  {
    id: 'start-workflow',
    title: 'Start Workflow',
    description: 'Begin a new automated workflow',
    icon: 'Workflow',
    color: 'green'
  }
];

export const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'info',
    title: 'System Update',
    message: 'Platform will be updated tonight at 2 AM UTC',
    timestamp: new Date().toISOString(),
    read: false
  },
  {
    id: '2',
    type: 'warning',
    title: 'API Rate Limit',
    message: 'You are approaching your API rate limit',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    read: false
  },
  {
    id: '3',
    type: 'success',
    title: 'Backup Complete',
    message: 'Your weekly backup has been completed successfully',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: true
  }
];