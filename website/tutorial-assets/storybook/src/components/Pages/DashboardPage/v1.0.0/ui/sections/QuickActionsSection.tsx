'use client';

import { FileText, GitBranch, Workflow } from 'lucide-react';
import React from 'react';

interface QuickActionsSectionProps {
  quickActions: Array<{
    id: string;
    title: string;
    description: string;
    color: string;
  }>;
  colorMap: Record<string, string>;
  onActionClick?: (actionId: string) => void;
}

/**
 * Quick actions section with preloading on hover
 */
const QuickActionsSection = React.memo(function QuickActionsSection({ 
  quickActions, 
  colorMap, 
  onActionClick 
}: QuickActionsSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {quickActions.map((action) => (
        <ActionButton
          key={action.id}
          action={action}
          colorClass={colorMap[action.color as keyof typeof colorMap] || colorMap.blue}
          onClick={onActionClick}
        />
      ))}
    </div>
  );
});

/**
 * Individual action button component
 */
const ActionButton = React.memo(function ActionButton({ 
  action, 
  colorClass,
  onClick 
}: {
  action: QuickActionsSectionProps['quickActions'][0];
  colorClass: string;
  onClick?: (actionId: string) => void;
}) {
  const getActionIcon = (actionId: string) => {
    switch (actionId) {
      case 'create-document': return FileText;
      case 'generate-page': return GitBranch;
      case 'start-workflow': return Workflow;
      default: return FileText;
    }
  };

  const Icon = getActionIcon(action.id);

  const handleClick = React.useCallback(() => {
    onClick?.(action.id);
  }, [onClick, action.id]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  return (
    <button 
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`${colorClass} text-white rounded-lg p-6 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full text-left`}
      aria-label={`${action.title}: ${action.description}`}
    >
      <Icon className="h-8 w-8 mb-4" />
      <h3 className="font-semibold mb-2">{action.title}</h3>
      <p className="text-sm opacity-90">{action.description}</p>
    </button>
  );
});

export default QuickActionsSection;