'use client';

import { useState } from 'react';
import { X, FileText, Sparkles, Download } from 'lucide-react';
import { cn } from '../../../../utils/cn';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  icon: string;
  preview?: string;
}

interface DocumentTemplatesProps {
  onClose: () => void;
  onTemplateSelect: (template: Template) => void;
  className?: string;
}

const TEMPLATE_CATEGORIES = [
  'All',
  'Strategy',
  'Product',
  'Technical',
  'Process',
  'Research'
];

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Product Requirements Document',
    description: 'Comprehensive PRD template for new features',
    category: 'Product',
    icon: '📋',
    content: `# Product Requirements Document

## Overview
[Brief description of the feature/product]

## Objectives
- [ ] Primary goal
- [ ] Secondary goal
- [ ] Success metrics

## Requirements
### Functional Requirements
1. [Requirement 1]
2. [Requirement 2]

### Non-Functional Requirements
- Performance
- Security
- Scalability

## User Stories
As a [user type], I want to [action] so that [benefit].

## Success Metrics
- [Metric 1]: [Target]
- [Metric 2]: [Target]

## Timeline
- Phase 1: [Date]
- Phase 2: [Date]
- Launch: [Date]
`,
    preview: 'Comprehensive template for product requirements with objectives, user stories, and success metrics.'
  },
  {
    id: '2',
    name: 'Technical Specification',
    description: 'Detailed technical spec for development',
    category: 'Technical',
    icon: '⚙️',
    content: `# Technical Specification

## Architecture Overview
[High-level architecture diagram and description]

## Components
### Frontend
- [Component 1]
- [Component 2]

### Backend
- [Service 1]
- [Service 2]

### Database
- [Table/Collection 1]
- [Table/Collection 2]

## API Specification
### Endpoints
\`\`\`
GET /api/endpoint
POST /api/endpoint
PUT /api/endpoint/{id}
DELETE /api/endpoint/{id}
\`\`\`

## Security Considerations
- Authentication
- Authorization
- Data validation

## Performance Requirements
- Response time: [target]
- Throughput: [target]
- Availability: [target]

## Implementation Plan
1. [Phase 1]
2. [Phase 2]
3. [Phase 3]
`,
    preview: 'Technical architecture, API specs, and implementation details.'
  },
  {
    id: '3',
    name: 'Meeting Notes',
    description: 'Structured template for meeting documentation',
    category: 'Process',
    icon: '📝',
    content: `# Meeting Notes

## Meeting Details
- **Date:** [Date]
- **Time:** [Start - End]
- **Attendees:** [List of participants]
- **Meeting Type:** [Standup/Planning/Review/etc.]

## Agenda
1. [Agenda item 1]
2. [Agenda item 2]
3. [Agenda item 3]

## Discussion Points
### [Topic 1]
- Key points discussed
- Decisions made
- Open questions

### [Topic 2]
- Key points discussed
- Decisions made
- Open questions

## Action Items
- [ ] [Action item 1] - [Assignee] - [Due date]
- [ ] [Action item 2] - [Assignee] - [Due date]
- [ ] [Action item 3] - [Assignee] - [Due date]

## Next Steps
- [Next meeting date]
- [Follow-up items]
- [Dependencies to track]
`,
    preview: 'Structured format for capturing meeting discussions and action items.'
  },
  {
    id: '4',
    name: 'Research Summary',
    description: 'Template for research findings and insights',
    category: 'Research',
    icon: '🔍',
    content: `# Research Summary

## Research Question
[What are we trying to learn?]

## Methodology
- **Type:** [User interviews/Survey/Analytics/etc.]
- **Participants:** [Number and demographics]
- **Timeline:** [When conducted]

## Key Findings
### Finding 1
- [Description]
- [Supporting data/quotes]
- **Impact:** [High/Medium/Low]

### Finding 2
- [Description]
- [Supporting data/quotes]
- **Impact:** [High/Medium/Low]

## Insights
1. [Insight 1]
2. [Insight 2]
3. [Insight 3]

## Recommendations
- [ ] **Priority 1:** [Recommendation with rationale]
- [ ] **Priority 2:** [Recommendation with rationale]
- [ ] **Priority 3:** [Recommendation with rationale]

## Next Steps
- [Follow-up research needed]
- [Actions to validate findings]
- [Implementation considerations]
`,
    preview: 'Structured approach to documenting research findings and recommendations.'
  }
];

export function DocumentTemplates({ 
  onClose, 
  onTemplateSelect, 
  className 
}: DocumentTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const filteredTemplates = selectedCategory === 'All' 
    ? DEFAULT_TEMPLATES 
    : DEFAULT_TEMPLATES.filter(template => template.category === selectedCategory);

  const handleTemplateSelect = (template: Template) => {
    onTemplateSelect(template);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={cn(
        "bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Document Templates</h2>
            <p className="text-gray-600 mt-1">Choose a template to get started quickly</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-200 p-4">
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 mb-3">Categories</h3>
              {TEMPLATE_CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg transition-colors",
                    selectedCategory === category
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {!previewTemplate ? (
              // Template Grid
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map(template => (
                    <div
                      key={template.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{template.icon}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 mb-1 truncate">
                            {template.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {template.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {template.category}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTemplateSelect(template);
                              }}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              Use Template
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredTemplates.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No templates found
                    </h3>
                    <p className="text-gray-600">
                      Try selecting a different category
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Template Preview
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <button
                    onClick={() => setPreviewTemplate(null)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    ← Back to Templates
                  </button>
                  <div className="text-2xl">{previewTemplate.icon}</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {previewTemplate.name}
                    </h3>
                    <p className="text-gray-600">{previewTemplate.description}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Preview</h4>
                  <p className="text-gray-600 text-sm">
                    {previewTemplate.preview || 'Template preview not available'}
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono overflow-x-auto">
                    {previewTemplate.content}
                  </pre>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleTemplateSelect(previewTemplate)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Sparkles className="h-4 w-4" />
                    Use This Template
                  </button>
                  <button
                    onClick={() => {
                      // Copy template content to clipboard
                      navigator.clipboard.writeText(previewTemplate.content);
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Copy Content
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export type { DocumentTemplatesProps, Template };