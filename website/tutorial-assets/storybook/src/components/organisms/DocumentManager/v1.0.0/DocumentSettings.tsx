'use client';

import { useState } from 'react';
import { X, Save, Trash2, Users, Lock, Globe } from 'lucide-react';
import { cn } from '../../../../utils/cn';

interface DocumentSettingsProps {
  document?: {
    id: string;
    title: string;
    type?: string;
    level?: string;
    status: string;
    visibility?: 'private' | 'team' | 'public'; // Make optional with default
    authoritative?: boolean;
    tags?: string[];
  };
  onClose: () => void;
  onSave?: (settings: any) => void;
  onDelete?: () => void;
  className?: string;
}

export function DocumentSettings({
  document,
  onClose,
  onSave,
  onDelete,
  className
}: DocumentSettingsProps) {
  const [settings, setSettings] = useState({
    type: document?.type || '',
    level: document?.level || '',
    status: document?.status || 'draft',
    visibility: document?.visibility || 'private',
    authoritative: document?.authoritative || false,
    tags: document?.tags || [],
    ...document
  });

  const [newTag, setNewTag] = useState('');

  const handleSave = () => {
    onSave?.(settings);
    onClose();
  };

  const addTag = () => {
    if (newTag.trim() && !settings.tags.includes(newTag.trim())) {
      setSettings(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setSettings(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={cn(
        "bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Document Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Type
            </label>
            <select
              value={settings.type}
              onChange={(e) => setSettings(prev => ({ ...prev, type: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select type...</option>
              <option value="prd">Product Requirements</option>
              <option value="spec">Technical Specification</option>
              <option value="guide">Guide/Tutorial</option>
              <option value="note">Note/Research</option>
              <option value="wireframe">Wireframe/Design</option>
              <option value="strategy">Strategy Document</option>
            </select>
          </div>

          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Level
            </label>
            <select
              value={settings.level}
              onChange={(e) => setSettings(prev => ({ ...prev, level: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select level...</option>
              <option value="strategic">Strategic</option>
              <option value="product">Product</option>
              <option value="release">Release</option>
              <option value="page">Page</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={settings.status}
              onChange={(e) => setSettings(prev => ({ ...prev, status: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="draft">Draft</option>
              <option value="review">In Review</option>
              <option value="approved">Approved</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visibility
            </label>
            <div className="space-y-2">
              {[
                { value: 'private', label: 'Private', desc: 'Only you can view', icon: Lock },
                { value: 'team', label: 'Team', desc: 'Team members can view', icon: Users },
                { value: 'public', label: 'Public', desc: 'Anyone can view', icon: Globe }
              ].map(({ value, label, desc, icon: Icon }) => (
                <label key={value} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="visibility"
                    value={value}
                    checked={settings.visibility === value}
                    onChange={(e) => setSettings(prev => ({ ...prev, visibility: e.target.value as any }))}
                    className="text-blue-600"
                  />
                  <Icon className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900">{label}</div>
                    <div className="text-sm text-gray-500">{desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Authoritative */}
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.authoritative}
                onChange={(e) => setSettings(prev => ({ ...prev, authoritative: e.target.checked }))}
                className="rounded text-blue-600"
              />
              <div>
                <div className="font-medium text-gray-900">Authoritative Source</div>
                <div className="text-sm text-gray-500">
                  Mark as the single source of truth for this topic
                </div>
              </div>
            </label>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                placeholder="Add a tag..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={addTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-gray-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          {onDelete && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this document?')) {
                  onDelete();
                  onClose();
                }
              }}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export type { DocumentSettingsProps };