'use client';

import React from 'react';
import { LogIn, LogOut, User, Settings, Shield } from 'lucide-react';
import { Button } from '../../../atoms/Button';
import { cn } from '../../../../common/utils/cn';

export interface LoginButtonProps {
  className?: string;
  showUserInfo?: boolean;
  variant?: 'button' | 'menu';
  user?: {
    name?: string | null;
    email?: string | null;
    picture?: string | null;
  } | null;
  enhancedUser?: {
    role?: string;
  } | null;
  isLoading?: boolean;
  hasRole?: (role: string) => boolean;
  onLogin?: () => void;
  onLogout?: () => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
}

export const LoginButton: React.FC<LoginButtonProps> = ({ 
  className = '', 
  showUserInfo = false, 
  variant = 'button',
  user,
  enhancedUser,
  isLoading = false,
  hasRole = () => false,
  onLogin,
  onLogout,
  onProfileClick,
  onSettingsClick
}) => {
  if (isLoading) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="h-8 w-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Button
        onClick={onLogin}
        variant="default"
        className={className}
        // @ts-ignore - Icon component mismatch
        leftIcon="user"
      >
        Sign In
      </Button>
    );
  }

  if (variant === 'menu') {
    return (
      <div className={cn("relative group", className)}>
        <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
          {user.picture ? (
            <img 
              src={user.picture} 
              alt={user.name || 'User'} 
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              <User size={16} />
            </div>
          )}
          {showUserInfo && (
            <div className="text-left">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-xs text-gray-500">{enhancedUser?.role}</div>
            </div>
          )}
        </button>

        {/* Dropdown Menu */}
        <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {user.picture ? (
                <img 
                  src={user.picture} 
                  alt={user.name || 'User'} 
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <User size={20} />
                </div>
              )}
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
                <div className="flex items-center gap-1 mt-1">
                  {hasRole('admin') && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                      <Shield size={10} />
                      Admin
                    </span>
                  )}
                  <span className="inline-flex items-center px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded capitalize">
                    {enhancedUser?.role || 'User'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-1">
            <button
              onClick={onProfileClick}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
            >
              <User size={16} />
              Profile
            </button>
            <button
              onClick={onSettingsClick}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
            >
              <Settings size={16} />
              Settings
            </button>
          </div>

          <div className="p-1 border-t border-gray-100">
            <button
              onClick={onLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {showUserInfo && (
        <div className="flex items-center gap-2">
          {user.picture ? (
            <img 
              src={user.picture} 
              alt={user.name || 'User'} 
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              <User size={16} />
            </div>
          )}
          <div>
            <div className="text-sm font-medium">{user.name}</div>
            <div className="text-xs text-gray-500">{enhancedUser?.role}</div>
          </div>
        </div>
      )}
      
      <Button
        onClick={onLogout}
        variant="secondary"
        // @ts-ignore - Icon component mismatch
        leftIcon="x"
      >
        Sign Out
      </Button>
    </div>
  );
};

export const QuickLoginButton: React.FC<{ 
  className?: string;
  user?: { name?: string | null } | null;
  isLoading?: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
}> = ({ 
  className = '', 
  user, 
  isLoading = false,
  onLogin,
  onLogout
}) => {
  if (isLoading) {
    return <div className={cn("h-8 w-8 bg-gray-200 rounded-full animate-pulse", className)}></div>;
  }

  if (!user) {
    return (
      <button
        onClick={onLogin}
        className={cn(
          "flex items-center justify-center w-8 h-8",
          "bg-blue-600 hover:bg-blue-700",
          "text-white rounded-full",
          "transition-colors duration-200",
          className
        )}
        title="Sign In"
      >
        <LogIn size={16} />
      </button>
    );
  }

  return (
    <button
      onClick={onLogout}
      className={cn(
        "flex items-center justify-center w-8 h-8",
        "bg-gray-600 hover:bg-gray-700",
        "text-white rounded-full",
        "transition-colors duration-200",
        className
      )}
      title="Sign Out"
    >
      <LogOut size={16} />
    </button>
  );
};