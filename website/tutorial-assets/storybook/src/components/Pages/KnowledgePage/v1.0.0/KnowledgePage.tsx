'use client';

import { Brain, Search, Filter, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { useKnowledge } from './useKnowledge';

export interface KnowledgePageProps {
  userId?: string;
}

export function KnowledgePage({ userId }: KnowledgePageProps) {
  const {
    nodes,
    edges,
    searchQuery,
    setSearchQuery,
    zoom,
    setZoom,
    getNodeColor
  } = useKnowledge(userId);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Knowledge Graph</h1>
            <p className="text-sm text-gray-600 mt-1">
              Visualize relationships between documents, releases, and pages
            </p>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Zoom Controls */}
            <div className="flex items-center space-x-2 border border-gray-300 rounded-lg px-2 py-1">
              <button
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium px-2">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(200, zoom + 10))}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={() => setZoom(100)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Maximize className="h-4 w-4" />
              </button>
            </div>
            
            <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Graph Visualization */}
      <div className="flex-1 bg-gray-50 p-8 overflow-auto">
        <div 
          className="relative bg-white rounded-lg shadow-lg min-h-[600px] min-w-[800px]"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
        >
          {/* SVG for edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {edges.map((edge, index) => {
              const fromNode = nodes.find(n => n.id === edge.from);
              const toNode = nodes.find(n => n.id === edge.to);
              if (!fromNode || !toNode) return null;
              
              return (
                <line
                  key={index}
                  x1={fromNode.x + 60}
                  y1={fromNode.y + 25}
                  x2={toNode.x + 60}
                  y2={toNode.y + 25}
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
          
          {/* Nodes */}
          {nodes.map((node) => (
            <div
              key={node.id}
              className={`absolute px-4 py-2 rounded-lg border-2 cursor-pointer hover:shadow-lg transition-shadow ${getNodeColor(node.type)}`}
              style={{ left: node.x, top: node.y, width: 120, height: 50 }}
            >
              <div className="text-sm font-medium text-center">
                {node.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-6">
          <span className="text-sm font-medium text-gray-700">Legend:</span>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-100 border border-purple-500 rounded"></div>
            <span className="text-sm text-gray-600">Category</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">Document</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border border-green-500 rounded"></div>
            <span className="text-sm text-gray-600">Release</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-500 rounded"></div>
            <span className="text-sm text-gray-600">Page</span>
          </div>
        </div>
      </div>
    </div>
  );
}