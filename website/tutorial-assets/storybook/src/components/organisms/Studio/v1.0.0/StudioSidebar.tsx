'use client';

import { useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Package, 
  Search, 
  Folder,
  FolderOpen,
  Book,
  Layers,
  Palette
} from 'lucide-react';
import { cn } from '../../../../utils/cn';

interface StoryItem {
  id: string;
  title: string;
  type: 'story' | 'page' | 'release';
  path?: string;
  children?: StoryItem[];
  status?: 'draft' | 'published' | 'archived';
}

interface StudioSidebarProps {
  isOpen?: boolean; // Make optional with default
  onToggle?: () => void; // Make optional 
  stories?: StoryItem[];
  selectedStoryId?: string;
  selectedStory?: string | null; // Platform passes selectedStory
  controller?: any; // Platform passes controller
  onStorySelect?: (story: StoryItem) => void;
  onFilterChange?: (filter: string) => void;
  className?: string;
}

const DEMO_STORIES: StoryItem[] = [
  {
    id: 'components',
    title: 'Components',
    type: 'page',
    children: [
      {
        id: 'atoms',
        title: 'Atoms',
        type: 'page',
        children: [
          { id: 'button', title: 'Button', type: 'story', status: 'published' },
          { id: 'input', title: 'Input', type: 'story', status: 'published' },
          { id: 'badge', title: 'Badge', type: 'story', status: 'draft' }
        ]
      },
      {
        id: 'molecules',
        title: 'Molecules',
        type: 'page',
        children: [
          { id: 'login-button', title: 'Login Button', type: 'story', status: 'published' },
          { id: 'global-search', title: 'Global Search', type: 'story', status: 'published' },
          { id: 'sidebar', title: 'Sidebar', type: 'story', status: 'published' }
        ]
      },
      {
        id: 'organisms',
        title: 'Organisms',
        type: 'page',
        children: [
          { id: 'document-list', title: 'Document List', type: 'story', status: 'published' },
          { id: 'ai-chat', title: 'AI Chat Interface', type: 'story', status: 'published' },
          { id: 'header', title: 'Header', type: 'story', status: 'draft' }
        ]
      }
    ]
  },
  {
    id: 'pages',
    title: 'Pages',
    type: 'page',
    children: [
      { id: 'dashboard', title: 'Dashboard', type: 'story', status: 'published' },
      { id: 'documents', title: 'Documents', type: 'story', status: 'published' },
      { id: 'settings', title: 'Settings', type: 'story', status: 'draft' }
    ]
  },
  {
    id: 'releases',
    title: 'Releases',
    type: 'release',
    children: [
      { id: 'v1.0.0', title: 'v1.0.0 - Initial Release', type: 'release', status: 'published' },
      { id: 'v1.1.0', title: 'v1.1.0 - Feature Update', type: 'release', status: 'draft' }
    ]
  }
];

export function StudioSidebar({
  isOpen = true,
  onToggle,
  stories = DEMO_STORIES,
  selectedStoryId,
  onStorySelect,
  onFilterChange,
  className
}: StudioSidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['components', 'atoms', 'molecules']));
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'story' | 'page' | 'release'>('all');

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getItemIcon = (item: StoryItem) => {
    switch (item.type) {
      case 'story':
        return <Book className="h-4 w-4 text-blue-500" />;
      case 'page':
        return expandedItems.has(item.id) 
          ? <FolderOpen className="h-4 w-4 text-yellow-500" />
          : <Folder className="h-4 w-4 text-yellow-500" />;
      case 'release':
        return <Package className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const colors = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={cn(
        'text-xs px-1.5 py-0.5 rounded-full',
        colors[status as keyof typeof colors] || colors.draft
      )}>
        {status}
      </span>
    );
  };

  const filterItems = (items: StoryItem[]): StoryItem[] => {
    return items.filter(item => {
      const matchesSearch = !searchQuery || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === 'all' || item.type === filter;
      
      if (item.children) {
        const filteredChildren = filterItems(item.children);
        return (matchesSearch && matchesFilter) || filteredChildren.length > 0;
      }
      
      return matchesSearch && matchesFilter;
    }).map(item => ({
      ...item,
      children: item.children ? filterItems(item.children) : undefined
    }));
  };

  const renderStoryItem = (item: StoryItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isSelected = selectedStoryId === item.id;

    return (
      <div key={item.id}>
        <div
          className={cn(
            "flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors group",
            isSelected 
              ? "bg-blue-100 text-blue-700" 
              : "hover:bg-gray-100",
            "text-sm"
          )}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            }
            onStorySelect?.(item);
          }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(item.id);
              }}
              className="p-0.5 rounded hover:bg-gray-200 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}

          {!hasChildren && <div className="w-4" />}

          {/* Icon */}
          {getItemIcon(item)}

          {/* Title */}
          <span className="flex-1 truncate font-medium">
            {item.title}
          </span>

          {/* Status Badge */}
          {getStatusBadge(item.status)}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {item.children!.map(child => renderStoryItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredStories = filterItems(stories);

  if (!isOpen) {
    return (
      <div className={cn("w-12 bg-white border-r border-gray-200 flex flex-col items-center py-4", className)}>
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Open Sidebar"
        >
          <Layers className="h-5 w-5 text-gray-600" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("w-80 bg-white border-r border-gray-200 flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Storybook</h2>
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          title="Close Sidebar"
        >
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Search & Filter */}
      <div className="p-4 space-y-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search stories..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onFilterChange?.(e.target.value);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        <div className="flex gap-1">
          {(['all', 'story', 'page', 'release'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-lg border transition-colors",
                filter === filterType
                  ? "bg-blue-100 border-blue-300 text-blue-700"
                  : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
              )}
            >
              {filterType === 'all' ? 'All' : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Story Tree */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredStories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No stories found</p>
            {searchQuery && (
              <p className="text-xs mt-1">Try adjusting your search terms</p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredStories.map(story => renderStoryItem(story))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Total Stories:</span>
            <span className="font-medium">{stories.reduce((count, item) => {
              const countChildren = (items: StoryItem[]): number => {
                return items.reduce((acc, item) => {
                  return acc + (item.type === 'story' ? 1 : 0) + (item.children ? countChildren(item.children) : 0);
                }, 0);
              };
              return count + (item.type === 'story' ? 1 : 0) + (item.children ? countChildren(item.children) : 0);
            }, 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Components:</span>
            <span className="font-medium">{stories.find(s => s.id === 'components')?.children?.length || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export type { StudioSidebarProps, StoryItem };