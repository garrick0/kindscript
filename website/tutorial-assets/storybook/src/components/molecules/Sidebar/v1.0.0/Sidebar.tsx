'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, LucideIcon } from 'lucide-react';
import { cn } from '../../../../utils/cn';

export interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  navigation: NavigationItem[];
  activeHref?: string;
  onNavigate?: (item: NavigationItem) => void;
  className?: string;
  logo?: React.ReactNode;
  title?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  open,
  onToggle,
  navigation,
  activeHref,
  onNavigate,
  className,
  logo,
  title = 'Induction Studio'
}) => {
  return (
    <div className={cn(
      "bg-gray-900 text-white transition-all duration-300 flex flex-col",
      open ? "w-64" : "w-16",
      className
    )}>
      {/* Logo/Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
        {open && (
          logo || <span className="text-xl font-bold">{title}</span>
        )}
        <button
          onClick={onToggle}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
        >
          {open ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = activeHref === item.href || activeHref?.startsWith(item.href);
          
          return (
            <button
              key={item.name}
              onClick={() => onNavigate?.(item)}
              className={cn(
                "w-full flex items-center px-2 py-2 rounded-lg transition-colors",
                isActive 
                  ? "bg-gray-800 text-white" 
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {open && (
                <span className="ml-3">{item.name}</span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

// Simple sidebar item component for custom items
export interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
  open?: boolean;
  className?: string;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  active = false,
  onClick,
  open = true,
  className
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center px-2 py-2 rounded-lg transition-colors",
        active 
          ? "bg-gray-800 text-white" 
          : "text-gray-300 hover:bg-gray-800 hover:text-white",
        className
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      {open && (
        <span className="ml-3">{label}</span>
      )}
    </button>
  );
};

// Collapsible sidebar section
export interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  open?: boolean;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

export const SidebarSection: React.FC<SidebarSectionProps> = ({
  title,
  children,
  open = true,
  collapsible = false,
  defaultExpanded = true,
  className
}) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  return (
    <div className={cn("px-2 py-2", className)}>
      {open && (
        <div 
          className={cn(
            "text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-1",
            collapsible && "cursor-pointer hover:text-gray-300"
          )}
          onClick={collapsible ? () => setExpanded(!expanded) : undefined}
        >
          {title}
          {collapsible && (
            <ChevronRight 
              className={cn(
                "inline-block ml-1 h-3 w-3 transition-transform",
                expanded && "rotate-90"
              )}
            />
          )}
        </div>
      )}
      {(!collapsible || expanded) && (
        <div className="space-y-1 mt-1">
          {children}
        </div>
      )}
    </div>
  );
};