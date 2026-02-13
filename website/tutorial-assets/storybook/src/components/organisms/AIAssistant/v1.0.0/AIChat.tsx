'use client';

import { useState } from 'react';
import { Bot, MessageCircle, Settings } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { AIChatInterface, type Message } from './AIChatInterface';

interface AIChatProps {
  onSendMessage: (content: string, attachments?: File[]) => void;
  initialMessages?: Message[];
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
  showSettings?: boolean;
  onSettingsClick?: () => void;
}

export function AIChat({
  onSendMessage,
  initialMessages = [],
  isLoading = false,
  title = "AI Assistant",
  subtitle = "Ask questions about your documents",
  className,
  showSettings = false,
  onSettingsClick
}: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  const handleSendMessage = (content: string, attachments?: File[]) => {
    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date().toISOString(),
      attachments: attachments?.map(file => ({
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: file.type,
        size: file.size
      }))
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Call the parent handler
    onSendMessage(content, attachments);
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Custom Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Bot className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MessageCircle className="h-3 w-3" />
            {messages.length} messages
          </div>
          {showSettings && onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Chat Settings"
            >
              <Settings className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <AIChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
          onDeleteMessage={handleDeleteMessage}
          isLoading={isLoading}
          allowAttachments={true}
          className="h-full border-0 rounded-none"
        />
      </div>
    </div>
  );
}

export type { AIChatProps };