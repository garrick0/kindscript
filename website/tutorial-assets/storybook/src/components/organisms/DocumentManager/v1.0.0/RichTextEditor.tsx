'use client';

import { useState, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote,
  Code,
  Link,
  Image,
  Save,
  Eye,
  Edit
} from 'lucide-react';
import { cn } from '../../../../utils/cn';

interface RichTextEditorProps {
  value?: string;
  content?: string; // Platform uses 'content' prop
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  readonly?: boolean;
  editable?: boolean; // Platform uses 'editable' instead of 'readonly'
  className?: string;
  onSave?: () => Promise<void>; // Platform expects async
  isSaving?: boolean;
}

export function RichTextEditor({
  value,
  content,
  onChange,
  placeholder = "Start writing...",
  autoFocus = false,
  readonly = false,
  editable = true,
  className,
  onSave,
  isSaving = false
}: RichTextEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const actualValue = content ?? value ?? '';
  const isReadonly = readonly || !editable;
  const [localValue, setLocalValue] = useState(actualValue);

  useEffect(() => {
    setLocalValue(actualValue);
  }, [actualValue]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const insertMarkdown = (syntax: string, placeholder: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = localValue.substring(start, end);
    const replacement = selectedText || placeholder;
    
    let newText = '';
    switch (syntax) {
      case 'bold':
        newText = `**${replacement}**`;
        break;
      case 'italic':
        newText = `*${replacement}*`;
        break;
      case 'code':
        newText = `\`${replacement}\``;
        break;
      case 'link':
        newText = `[${replacement || 'Link text'}](url)`;
        break;
      case 'image':
        newText = `![${replacement || 'Alt text'}](image-url)`;
        break;
      case 'h1':
        newText = `# ${replacement || 'Heading 1'}`;
        break;
      case 'h2':
        newText = `## ${replacement || 'Heading 2'}`;
        break;
      case 'h3':
        newText = `### ${replacement || 'Heading 3'}`;
        break;
      case 'ul':
        newText = `- ${replacement || 'List item'}`;
        break;
      case 'ol':
        newText = `1. ${replacement || 'List item'}`;
        break;
      case 'quote':
        newText = `> ${replacement || 'Quote'}`;
        break;
      default:
        newText = replacement;
    }

    const newValue = localValue.substring(0, start) + newText + localValue.substring(end);
    handleChange(newValue);

    // Set cursor position after the inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + newText.length, start + newText.length);
    }, 0);
  };

  const renderMarkdown = (text: string) => {
    // Simple markdown to HTML conversion for preview
    return text
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />')
      .replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^- (.*)$/gm, '<ul><li>$1</li></ul>')
      .replace(/^\d+\. (.*)$/gm, '<ol><li>$1</li></ol>')
      .replace(/\n/g, '<br>');
  };

  if (isReadonly && !isPreview) {
    return (
      <div className={cn("border border-gray-200 rounded-lg p-4 min-h-[200px]", className)}>
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(actualValue) }}
        />
      </div>
    );
  }

  return (
    <div className={cn("border border-gray-200 rounded-lg overflow-hidden", className)}>
      {/* Toolbar */}
      {!isReadonly && (
        <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-1">
            <button
              onClick={() => insertMarkdown('bold', 'Bold text')}
              className="p-1.5 rounded hover:bg-gray-200 transition-colors"
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              onClick={() => insertMarkdown('italic', 'Italic text')}
              className="p-1.5 rounded hover:bg-gray-200 transition-colors"
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              onClick={() => insertMarkdown('code', 'code')}
              className="p-1.5 rounded hover:bg-gray-200 transition-colors"
              title="Code"
            >
              <Code className="h-4 w-4" />
            </button>
          </div>

          <div className="h-4 w-px bg-gray-300 mx-1" />

          <div className="flex items-center gap-1">
            <button
              onClick={() => insertMarkdown('h1')}
              className="px-2 py-1.5 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
              title="Heading 1"
            >
              H1
            </button>
            <button
              onClick={() => insertMarkdown('h2')}
              className="px-2 py-1.5 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
              title="Heading 2"
            >
              H2
            </button>
            <button
              onClick={() => insertMarkdown('h3')}
              className="px-2 py-1.5 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
              title="Heading 3"
            >
              H3
            </button>
          </div>

          <div className="h-4 w-px bg-gray-300 mx-1" />

          <div className="flex items-center gap-1">
            <button
              onClick={() => insertMarkdown('ul')}
              className="p-1.5 rounded hover:bg-gray-200 transition-colors"
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => insertMarkdown('ol')}
              className="p-1.5 rounded hover:bg-gray-200 transition-colors"
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <button
              onClick={() => insertMarkdown('quote')}
              className="p-1.5 rounded hover:bg-gray-200 transition-colors"
              title="Quote"
            >
              <Quote className="h-4 w-4" />
            </button>
          </div>

          <div className="h-4 w-px bg-gray-300 mx-1" />

          <div className="flex items-center gap-1">
            <button
              onClick={() => insertMarkdown('link')}
              className="p-1.5 rounded hover:bg-gray-200 transition-colors"
              title="Link"
            >
              <Link className="h-4 w-4" />
            </button>
            <button
              onClick={() => insertMarkdown('image')}
              className="p-1.5 rounded hover:bg-gray-200 transition-colors"
              title="Image"
            >
              <Image className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsPreview(!isPreview)}
              className={cn(
                "p-1.5 rounded transition-colors",
                isPreview 
                  ? "bg-blue-100 text-blue-600"
                  : "hover:bg-gray-200"
              )}
              title={isPreview ? "Edit" : "Preview"}
            >
              {isPreview ? <Edit className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            {onSave && (
              <button
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Editor/Preview */}
      <div className="relative">
        {isPreview ? (
          <div className="p-4 min-h-[300px] prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(localValue) }} />
          </div>
        ) : (
          <textarea
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            readOnly={isReadonly}
            className="w-full p-4 border-0 resize-none focus:outline-none min-h-[300px] font-mono text-sm"
            style={{ 
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
            }}
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        {isPreview ? (
          <span>Preview mode - click Edit to make changes</span>
        ) : (
          <span>
            Supports Markdown: **bold**, *italic*, `code`, [links](url), # headings, {'>'}quotes, - lists
          </span>
        )}
      </div>
    </div>
  );
}

export type { RichTextEditorProps };