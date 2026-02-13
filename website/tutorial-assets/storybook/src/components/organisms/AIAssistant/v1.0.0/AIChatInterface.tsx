'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Paperclip, MoreVertical, Copy, Trash2 } from 'lucide-react';
import { cn } from '../../../../utils/cn';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: Attachment[];
  metadata?: {
    tokens?: number;
    model?: string;
    confidence?: number;
  };
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
}

interface AIChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string, attachments?: File[]) => void;
  onClearChat?: () => void;
  onDeleteMessage?: (messageId: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  allowAttachments?: boolean;
  maxAttachmentSize?: number; // in MB
  className?: string;
}

export function AIChatInterface({
  messages,
  onSendMessage,
  onClearChat,
  onDeleteMessage,
  isLoading = false,
  placeholder = "Ask me anything about your documents...",
  allowAttachments = false,
  maxAttachmentSize = 10,
  className
}: AIChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showMessageMenu, setShowMessageMenu] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() || attachments.length > 0) {
      onSendMessage(inputValue.trim(), attachments);
      setInputValue('');
      setAttachments([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const sizeInMB = file.size / (1024 * 1024);
      return sizeInMB <= maxAttachmentSize;
    });
    setAttachments(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    setShowMessageMenu(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("flex flex-col h-full bg-white border border-gray-200 rounded-lg", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Bot className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-900">AI Assistant</h3>
            <p className="text-sm text-gray-500">Ready to help with your documents</p>
          </div>
        </div>
        {onClearChat && messages.length > 0 && (
          <button
            onClick={onClearChat}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Clear Chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Start a conversation with your AI assistant</p>
            <p className="text-sm mt-1">Ask about documents, workflows, or get help with tasks</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.type === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {message.type === 'assistant' && (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-4 py-3 relative group",
                  message.type === 'user'
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900"
                )}
              >
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>

                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-2 p-2 bg-white bg-opacity-20 rounded text-sm"
                      >
                        <Paperclip className="h-3 w-3" />
                        <span className="truncate">{attachment.name}</span>
                        <span className="text-xs opacity-75">
                          ({formatFileSize(attachment.size)})
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-2 text-xs opacity-75">
                  <span>{formatTime(message.timestamp)}</span>
                  {message.metadata && (
                    <span>
                      {message.metadata.model} • {message.metadata.tokens} tokens
                    </span>
                  )}
                </div>

                {/* Message Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setShowMessageMenu(showMessageMenu === message.id ? null : message.id)}
                    className="p-1 rounded hover:bg-black hover:bg-opacity-10"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </button>
                  {showMessageMenu === message.id && (
                    <div className="absolute right-0 top-8 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <button
                        onClick={() => copyMessage(message.content)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </button>
                      {onDeleteMessage && (
                        <button
                          onClick={() => {
                            onDeleteMessage(message.id);
                            setShowMessageMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {message.type === 'user' && (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-blue-600" />
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mb-3 space-y-1">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-gray-100 rounded text-sm"
              >
                <Paperclip className="h-3 w-3 text-gray-500" />
                <span className="flex-1 truncate">{file.name}</span>
                <span className="text-xs text-gray-500">
                  ({formatFileSize(file.size)})
                </span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="p-1 rounded hover:bg-gray-200"
                >
                  <Trash2 className="h-3 w-3 text-gray-500" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          {allowAttachments && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                title="Attach files"
              >
                <Paperclip className="h-4 w-4 text-gray-500" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                accept=".txt,.md,.pdf,.doc,.docx,.json"
              />
            </>
          )}

          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={isLoading}
              className="w-full p-3 pr-12 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <button
              onClick={handleSend}
              disabled={(!inputValue.trim() && attachments.length === 0) || isLoading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showMessageMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMessageMenu(null)}
        />
      )}
    </div>
  );
}

export type { AIChatInterfaceProps, Message, Attachment };