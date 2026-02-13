'use client'

import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from '../../../molecules/ErrorBoundary';
import { Skeleton, SkeletonCard, SkeletonList } from '../../../atoms/Skeleton';
import { useSettings } from './useSettings';
import { useAuth } from '../../../../core/auth/useAuth';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Link2, 
  Save,
  Check,
  X,
  ChevronRight,
  Github,
  Slack,
  Figma,
  Key,
  Smartphone,
  Monitor,
  LogOut
} from 'lucide-react';

export interface SettingsPageProps {
  userId?: string;
}

export function SettingsPage({ userId }: SettingsPageProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { settings, loading, error, saving, actions } = useSettings(userId || user?.id);
  
  const [activeTab, setActiveTab] = useState('profile');
  const [showSuccess, setShowSuccess] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    bio: '',
    timezone: '',
    language: ''
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user && !userId) {
      router.push('/auth/signin');
    }
  }, [authLoading, user, userId, router]);

  // Initialize profile form
  useEffect(() => {
    if (settings?.profile) {
      setProfileForm({
        name: settings.profile.name || '',
        bio: settings.profile.bio || '',
        timezone: settings.profile.timezone || '',
        language: settings.profile.language || ''
      });
    }
  }, [settings]);

  const handleSaveProfile = async () => {
    try {
      await actions.updateProfile(profileForm);
      setEditingProfile(false);
      showSuccessMessage();
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    try {
      await actions.updatePreferences({ ...settings?.preferences, theme });
      showSuccessMessage();
    } catch (err) {
      console.error('Failed to update theme:', err);
    }
  };

  const handleNotificationToggle = async (type: string, channel: string) => {
    if (!settings) return;
    
    try {
      const updated = { ...settings.notifications };
      (updated as any)[channel][type] = !(updated as any)[channel][type];
      await actions.updateNotifications(updated);
      showSuccessMessage();
    } catch (err) {
      console.error('Failed to update notifications:', err);
    }
  };

  const handleIntegrationToggle = async (integration: string) => {
    if (!settings) return;
    
    try {
      const isConnected = (settings.integrations as any)[integration]?.connected;
      if (isConnected) {
        await actions.disconnectIntegration(integration);
      } else {
        await actions.connectIntegration(integration);
      }
      showSuccessMessage();
    } catch (err) {
      console.error('Failed to toggle integration:', err);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (confirm('Are you sure you want to revoke this session?')) {
      try {
        await actions.revokeSession(sessionId);
        showSuccessMessage();
      } catch (err) {
        console.error('Failed to revoke session:', err);
      }
    }
  };

  const handleCreateAPIKey = async () => {
    const name = prompt('Enter a name for the API key:');
    if (name) {
      try {
        await actions.createAPIKey(name, ['read', 'write']);
        showSuccessMessage();
      } catch (err) {
        console.error('Failed to create API key:', err);
      }
    }
  };

  const handleRevokeAPIKey = async (keyId: string) => {
    if (confirm('Are you sure you want to revoke this API key?')) {
      try {
        await actions.revokeAPIKey(keyId);
        showSuccessMessage();
      } catch (err) {
        console.error('Failed to revoke API key:', err);
      }
    }
  };

  const showSuccessMessage = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Link2 },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  if (authLoading || loading) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header Skeleton */}
            <div className="mb-8">
              <Skeleton variant="text" width="200px" height={36} className="mb-2" />
              <Skeleton variant="text" width="350px" height={24} />
            </div>

            <div className="flex gap-8">
              {/* Tabs Skeleton */}
              <div className="w-64">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Skeleton key={i} variant="rounded" height={40} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Content Skeleton */}
              <div className="flex-1">
                <div className="bg-white rounded-lg shadow p-6">
                  <Skeleton variant="text" width="150px" height={28} className="mb-6" />
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i}>
                        <Skeleton variant="text" width="100px" height={16} className="mb-2" />
                        <Skeleton variant="rounded" height={40} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Error loading settings: {error.message}</p>
          <button 
            onClick={() => actions.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">Manage your account and preferences</p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            <span className="text-green-800">Settings saved successfully</span>
          </div>
        )}

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64">
            <nav className="space-y-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-start gap-6">
                      <img
                        src={settings.profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${settings.profile.email}`}
                        alt="Avatar"
                        className="h-20 w-20 rounded-full"
                      />
                      <div className="flex-1">
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                          Change Avatar
                        </button>
                      </div>
                    </div>

                    {editingProfile ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            value={profileForm.name}
                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                          <textarea
                            value={profileForm.bio}
                            onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            onClick={() => setEditingProfile(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <p className="text-gray-900">{settings.profile.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <p className="text-gray-900">{settings.profile.email}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                          <p className="text-gray-900">{settings.profile.bio || 'No bio added'}</p>
                        </div>
                        <button
                          onClick={() => setEditingProfile(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Edit Profile
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Preferences</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
                      <div className="flex gap-2">
                        {(['light', 'dark', 'system'] as const).map(theme => (
                          <button
                            key={theme}
                            onClick={() => handleThemeChange(theme)}
                            className={`px-4 py-2 rounded-lg capitalize ${
                              settings.preferences.theme === theme
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {theme}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Auto-save</label>
                      <button
                        onClick={() => actions.updatePreferences({ 
                          ...settings.preferences, 
                          autoSave: !settings.preferences.autoSave 
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                          settings.preferences.autoSave ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            settings.preferences.autoSave ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
                  
                  <div className="space-y-6">
                    {['email', 'push', 'inApp'].map(channel => (
                      <div key={channel}>
                        <h3 className="font-medium text-gray-900 mb-3 capitalize">
                          {channel === 'inApp' ? 'In-App' : channel} Notifications
                        </h3>
                        <div className="space-y-2">
                          {['releases', 'documents', 'mentions'].map(type => (
                            <label key={type} className="flex items-center justify-between py-2">
                              <span className="text-gray-700 capitalize">{type}</span>
                              <button
                                onClick={() => handleNotificationToggle(type, channel)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                                  (settings.notifications as any)[channel][type] 
                                    ? 'bg-blue-600' 
                                    : 'bg-gray-200'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                    (settings.notifications as any)[channel][type] 
                                      ? 'translate-x-6' 
                                      : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Integrations Tab */}
              {activeTab === 'integrations' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Connected Services</h2>
                  
                  <div className="space-y-4">
                    {[
                      { id: 'github', name: 'GitHub', icon: Github },
                      { id: 'slack', name: 'Slack', icon: Slack },
                      { id: 'figma', name: 'Figma', icon: Figma },
                    ].map(integration => {
                      const Icon = integration.icon;
                      const isConnected = (settings.integrations as any)[integration.id]?.connected;
                      
                      return (
                        <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Icon className="h-6 w-6" />
                            <div>
                              <p className="font-medium">{integration.name}</p>
                              {isConnected && (settings.integrations as any)[integration.id].username && (
                                <p className="text-sm text-gray-500">
                                  @{(settings.integrations as any)[integration.id].username}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleIntegrationToggle(integration.id)}
                            className={`px-4 py-2 rounded-lg ${
                              isConnected
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {isConnected ? 'Disconnect' : 'Connect'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="p-6 space-y-8">
                  <div>
                    <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
                    
                    <div className="space-y-6">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">Two-Factor Authentication</p>
                            <p className="text-sm text-gray-500">
                              {settings.security.twoFactorEnabled 
                                ? 'Enabled - Your account is secured with 2FA'
                                : 'Add an extra layer of security to your account'}
                            </p>
                          </div>
                          <button
                            onClick={async () => {
                              if (settings.security.twoFactorEnabled) {
                                await actions.disableTwoFactor();
                              } else {
                                const result = await actions.enableTwoFactor();
                                // In a real app, show QR code
                                alert(`Scan this QR code with your authenticator app: ${result.secret}`);
                              }
                            }}
                            className={`px-4 py-2 rounded-lg ${
                              settings.security.twoFactorEnabled
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {settings.security.twoFactorEnabled ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Active Sessions</h3>
                    <div className="space-y-2">
                      {settings.security.sessions.map(session => (
                        <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {session.device.includes('Mobile') ? 
                              <Smartphone className="h-5 w-5 text-gray-400" /> :
                              <Monitor className="h-5 w-5 text-gray-400" />
                            }
                            <div>
                              <p className="font-medium">
                                {session.device}
                                {session.current && (
                                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full">
                                    Current
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-500">
                                {session.location} · Last active {new Date(session.lastActive).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {!session.current && (
                            <button
                              onClick={() => handleRevokeSession(session.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                            >
                              <LogOut className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900">API Keys</h3>
                      <button
                        onClick={handleCreateAPIKey}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                      >
                        Create Key
                      </button>
                    </div>
                    <div className="space-y-2">
                      {settings.security.apiKeys.map(key => (
                        <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Key className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="font-medium">{key.name}</p>
                              <p className="text-sm text-gray-500 font-mono">{key.key}</p>
                              <p className="text-xs text-gray-400">
                                Created {new Date(key.createdAt).toLocaleDateString()}
                                {key.lastUsed && ` · Last used ${new Date(key.lastUsed).toLocaleDateString()}`}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRevokeAPIKey(key.id)}
                            className="px-3 py-1 bg-red-50 text-red-600 text-sm rounded hover:bg-red-100"
                          >
                            Revoke
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}