'use client';

import { Clock } from 'lucide-react';
import React from 'react';

interface RecentActivitySectionProps {
  recentActivity: Array<{
    id: string;
    action: string;
    type: 'document' | 'release' | 'page' | 'workflow' | string;
    time: string;
    userName?: string;
  }>;
  onViewAllClick?: () => void;
}

/**
 * Recent activity section with virtualization for large lists
 */
const RecentActivitySection = React.memo(function RecentActivitySection({ 
  recentActivity, 
  onViewAllClick 
}: RecentActivitySectionProps) {
  const handleViewAllClick = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onViewAllClick?.();
  }, [onViewAllClick]);

  if (recentActivity.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="px-6 py-8 text-center text-gray-500">
          No recent activity to display
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
      </div>
      
      {/* Activity list with optimized rendering */}
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {recentActivity.slice(0, 10).map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
      
      {/* View all button */}
      {recentActivity.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-200">
          <button 
            onClick={handleViewAllClick}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          >
            View all activity ({recentActivity.length} total) →
          </button>
        </div>
      )}
    </div>
  );
});

/**
 * Individual activity item component
 */
const ActivityItem = React.memo(function ActivityItem({ 
  activity 
}: {
  activity: RecentActivitySectionProps['recentActivity'][0];
}) {
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'document': return 'bg-blue-600';
      case 'release': return 'bg-green-600';
      case 'page': return 'bg-purple-600';
      case 'workflow': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
      <div className="flex items-center space-x-4">
        <div className={`w-2 h-2 rounded-full ${getActivityColor(activity.type)}`} />
        <div>
          <p className="text-sm font-medium text-gray-900">{activity.action}</p>
          <div className="flex items-center space-x-3 mt-1">
            <p className="text-xs text-gray-500">
              Type: {activity.type}
            </p>
            {activity.userName && (
              <p className="text-xs text-gray-500">
                By: {activity.userName}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center text-sm text-gray-500 flex-shrink-0">
        <Clock className="h-4 w-4 mr-1" />
        {activity.time}
      </div>
    </div>
  );
});

export default RecentActivitySection;