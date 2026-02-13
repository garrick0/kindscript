'use client';

import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import React from 'react';

interface StatsSectionProps {
  stats: Array<{
    name: string;
    value: string | number;
    change: string;
    changeType: 'increase' | 'decrease' | 'neutral';
  }>;
  iconMap: Record<string, React.ComponentType<{ className?: string }>>;
  onStatClick?: (statId: string) => void;
}

/**
 * Optimized stats section with memoization
 */
const StatsSection = React.memo(function StatsSection({ 
  stats, 
  iconMap, 
  onStatClick 
}: StatsSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <StatCard
          key={stat.name}
          stat={stat}
          icon={iconMap[stat.name as keyof typeof iconMap]}
          onClick={onStatClick}
        />
      ))}
    </div>
  );
});

/**
 * Individual stat card component with click tracking
 */
const StatCard = React.memo(function StatCard({ 
  stat, 
  icon: Icon, 
  onClick 
}: {
  stat: StatsSectionProps['stats'][0];
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: (statId: string) => void;
}) {
  const TrendIcon = stat.changeType === 'increase' ? TrendingUp : 
                   stat.changeType === 'decrease' ? TrendingDown : Minus;
  
  const DefaultIcon = Icon || (() => <div className="h-8 w-8 bg-gray-300 rounded" />);

  const handleClick = React.useCallback(() => {
    onClick?.(stat.name);
  }, [onClick, stat.name]);

  return (
    <div 
      className={`bg-white rounded-lg shadow p-6 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      } : undefined}
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
        <DefaultIcon className="h-8 w-8 text-gray-400" />
      </div>
    </div>
  );
});

export default StatsSection;