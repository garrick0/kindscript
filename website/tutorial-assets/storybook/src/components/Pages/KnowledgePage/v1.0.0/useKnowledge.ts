'use client';

import { useState } from 'react';

export interface KnowledgeNode {
  id: string;
  label: string;
  type: 'category' | 'document' | 'release' | 'page';
  x: number;
  y: number;
}

export interface KnowledgeEdge {
  from: string;
  to: string;
}

export function useKnowledge(userId?: string) {
  const [searchQuery, setSearchQuery] = useState('');
  const [zoom, setZoom] = useState(100);

  // Mock nodes for visualization
  const [nodes] = useState<KnowledgeNode[]>([
    { id: 'strategic', label: 'Strategic Docs', type: 'category', x: 200, y: 100 },
    { id: 'prd', label: 'PRD', type: 'document', x: 400, y: 100 },
    { id: 'release', label: 'MVP Release', type: 'release', x: 600, y: 100 },
    { id: 'dashboard', label: 'Dashboard Page', type: 'page', x: 500, y: 250 },
    { id: 'analytics', label: 'Analytics Page', type: 'page', x: 700, y: 250 },
    { id: 'technical', label: 'Technical Docs', type: 'category', x: 200, y: 400 },
    { id: 'operational', label: 'Operational', type: 'category', x: 400, y: 400 },
  ]);

  const [edges] = useState<KnowledgeEdge[]>([
    { from: 'strategic', to: 'prd' },
    { from: 'prd', to: 'release' },
    { from: 'release', to: 'dashboard' },
    { from: 'release', to: 'analytics' },
    { from: 'technical', to: 'operational' },
  ]);

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'category':
        return 'bg-purple-100 border-purple-500';
      case 'document':
        return 'bg-blue-100 border-blue-500';
      case 'release':
        return 'bg-green-100 border-green-500';
      case 'page':
        return 'bg-yellow-100 border-yellow-500';
      default:
        return 'bg-gray-100 border-gray-500';
    }
  };

  return {
    nodes,
    edges,
    searchQuery,
    setSearchQuery,
    zoom,
    setZoom,
    getNodeColor
  };
}