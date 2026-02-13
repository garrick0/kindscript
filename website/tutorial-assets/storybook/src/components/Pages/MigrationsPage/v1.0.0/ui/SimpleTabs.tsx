/**
 * Simple Tabs Component
 * 
 * A lightweight tabs implementation without external dependencies.
 * Used to avoid Radix UI dependency issues in the build.
 */

import React, { useState } from 'react';
import { cn } from '../../../../../utils/cn';

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

interface TabsTriggerProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

const TabsContext = React.createContext<{
  value: string;
  onChange: (value: string) => void;
}>({ value: '', onChange: () => {} });

export const Tabs: React.FC<TabsProps> = ({
  defaultValue = '',
  value: controlledValue,
  onValueChange,
  className,
  children
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  
  const onChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value, onChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<TabsListProps> = ({ className, children }) => {
  return (
    <div className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
      className
    )}>
      {children}
    </div>
  );
};

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, className, children }) => {
  const { value: activeValue, onChange } = React.useContext(TabsContext);
  const isActive = activeValue === value;

  return (
    <button
      onClick={() => onChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive && "bg-white text-gray-950 shadow-sm dark:bg-gray-950 dark:text-gray-50",
        className
      )}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<TabsContentProps> = ({ value, className, children }) => {
  const { value: activeValue } = React.useContext(TabsContext);
  
  if (activeValue !== value) {
    return null;
  }

  return (
    <div className={className}>
      {children}
    </div>
  );
};