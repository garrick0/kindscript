'use client';

import { FileCode, Plus, Search, Filter, GitBranch, Clock } from 'lucide-react';
import Link from 'next/link';
import { usePages } from './usePages';

export interface PagesManagerPageProps {
  userId?: string;
}

export function PagesManagerPage({ userId }: PagesManagerPageProps) {
  const { 
    pages, 
    searchQuery, 
    setSearchQuery, 
    filterVersion, 
    setFilterVersion,
    filteredPages 
  } = usePages(userId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'in-review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pages</h1>
          <p className="text-gray-600 mt-2">
            Independently versioned application pages
          </p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Generate Page
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterVersion}
          onChange={(e) => setFilterVersion(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Versions</option>
          <option value="latest">Latest Only</option>
          <option value="v1">v1</option>
          <option value="v2">v2</option>
          <option value="v3">v3</option>
        </select>
        <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Filter className="h-4 w-4 mr-2" />
          More Filters
        </button>
      </div>

      {/* Pages Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Page
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Versions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Modified
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPages.map((page) => (
              <tr key={page.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {page.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {page.description}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <GitBranch className="h-4 w-4 text-gray-400" />
                    <div className="flex space-x-1">
                      {page.versions.map((version) => (
                        <span
                          key={version}
                          className={`px-2 py-1 text-xs rounded ${
                            version === page.latestVersion
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {version}
                        </span>
                      ))}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(page.status)}`}>
                    {page.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {page.lastModified}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <Link
                      href={`/studio?page=${page.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </Link>
                    <button className="text-gray-600 hover:text-gray-900">
                      Edit
                    </button>
                    <button className="text-gray-600 hover:text-gray-900">
                      Duplicate
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{pages.length}</div>
          <div className="text-sm text-gray-600">Total Pages</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">
            {pages.reduce((acc, page) => acc + page.versions.length, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Versions</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">
            {pages.filter(p => p.status === 'published').length}
          </div>
          <div className="text-sm text-gray-600">Published</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">
            {pages.filter(p => p.status === 'draft').length}
          </div>
          <div className="text-sm text-gray-600">Drafts</div>
        </div>
      </div>
    </div>
  );
}