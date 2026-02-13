'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Package, GitBranch, Workflow, X, Loader } from 'lucide-react';
import { cn } from '../../../../utils/cn';

export interface SearchResult {
  id: string;
  type: 'document' | 'page' | 'release' | 'workflow';
  title?: string;
  name?: string;
  description?: string;
  url: string;
}

export interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
  onSearch?: (query: string) => Promise<SearchResult[]>;
  onResultSelect?: (result: SearchResult) => void;
  shortcutKey?: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  className,
  placeholder = 'Search documents, pages, releases, workflows...',
  onSearch,
  onResultSelect,
  shortcutKey = 'k'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Open search with Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === shortcutKey) {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcutKey]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search when query changes
  useEffect(() => {
    if (!query || !onSearch) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const searchResults = await onSearch(query);
        setResults(searchResults || []);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(searchTimeout);
  }, [query, onSearch]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleResultSelect(results[selectedIndex]);
    }
  };

  const handleResultSelect = (result: SearchResult) => {
    if (onResultSelect) {
      onResultSelect(result);
    }
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'page':
        return <GitBranch className="h-4 w-4" />;
      case 'release':
        return <Package className="h-4 w-4" />;
      case 'workflow':
        return <Workflow className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors",
          className
        )}
      >
        <Search className="h-4 w-4 mr-2" />
        <span>Search...</span>
        <kbd className="ml-auto px-2 py-1 text-xs bg-white rounded border border-gray-300">
          ⌘{shortcutKey.toUpperCase()}
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={() => setIsOpen(false)}
      />
      
      <div className="flex items-start justify-center min-h-full pt-[10vh]">
        <div 
          ref={searchRef}
          className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4"
        >
          {/* Search Input */}
          <div className="flex items-center px-4 py-3 border-b border-gray-200">
            <Search className="h-5 w-5 text-gray-400 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="flex-1 outline-none text-gray-900"
            />
            {isLoading && (
              <Loader className="h-4 w-4 text-gray-400 animate-spin" />
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="ml-3 p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          {/* Search Results */}
          {results.length > 0 && (
            <div className="max-h-[60vh] overflow-y-auto py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "w-full px-4 py-3 flex items-center hover:bg-gray-50 transition-colors",
                    index === selectedIndex && "bg-gray-50"
                  )}
                >
                  <div className={cn(
                    "mr-3 p-2 rounded",
                    result.type === 'document' && "bg-blue-100 text-blue-600",
                    result.type === 'page' && "bg-green-100 text-green-600",
                    result.type === 'release' && "bg-purple-100 text-purple-600",
                    result.type === 'workflow' && "bg-orange-100 text-orange-600"
                  )}>
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {result.title || result.name}
                    </div>
                    {result.description && (
                      <div className="text-xs text-gray-500 mt-1">
                        {result.description}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 capitalize">
                    {result.type}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {query && !isLoading && results.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              No results found for "{query}"
            </div>
          )}

          {/* Help Text */}
          {!query && (
            <div className="px-4 py-8 text-center text-gray-500">
              <p className="text-sm">Start typing to search across all content</p>
              <div className="mt-4 flex justify-center space-x-4 text-xs">
                <span><kbd className="px-2 py-1 bg-gray-100 rounded">↑↓</kbd> Navigate</span>
                <span><kbd className="px-2 py-1 bg-gray-100 rounded">Enter</kbd> Select</span>
                <span><kbd className="px-2 py-1 bg-gray-100 rounded">Esc</kbd> Close</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};