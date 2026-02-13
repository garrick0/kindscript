'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText, Tag, Hash } from 'lucide-react';
import { cn } from '../../../../utils/cn';

interface TaxonomyNode {
  id: string;
  name: string;
  type: 'category' | 'document' | 'tag';
  children?: TaxonomyNode[];
  documentCount?: number;
  path?: string;
}

interface DocumentTaxonomyProps {
  taxonomy: TaxonomyNode[];
  onNodeSelect?: (node: TaxonomyNode) => void;
  selectedNodeId?: string;
  className?: string;
}

export function DocumentTaxonomy({
  taxonomy,
  onNodeSelect,
  selectedNodeId,
  className
}: DocumentTaxonomyProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'category':
        return <Folder className="h-4 w-4 text-blue-500" />;
      case 'document':
        return <FileText className="h-4 w-4 text-gray-500" />;
      case 'tag':
        return <Tag className="h-4 w-4 text-purple-500" />;
      default:
        return <Hash className="h-4 w-4 text-gray-400" />;
    }
  };

  const renderNode = (node: TaxonomyNode, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNodeId === node.id;

    return (
      <div key={node.id}>
        <div
          className={cn(
            "flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors",
            isSelected 
              ? "bg-blue-100 text-blue-700" 
              : "hover:bg-gray-100",
            "group"
          )}
          style={{ paddingLeft: `${12 + depth * 20}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.id);
            }
            onNodeSelect?.(node);
          }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="p-0.5 rounded hover:bg-gray-200 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}

          {/* Icon */}
          {getNodeIcon(node.type)}

          {/* Name */}
          <span className="flex-1 text-sm font-medium truncate">
            {node.name}
          </span>

          {/* Document Count */}
          {node.documentCount !== undefined && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {node.documentCount}
            </span>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (taxonomy.length === 0) {
    return (
      <div className={cn("text-center py-8 text-gray-500", className)}>
        <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No taxonomy structure available</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
        <Hash className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Document Taxonomy</h3>
      </div>

      <div className="space-y-1">
        {taxonomy.map(node => renderNode(node))}
      </div>
    </div>
  );
}

export type { DocumentTaxonomyProps, TaxonomyNode };