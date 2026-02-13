'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserSettings } from './settings.types';
import { useServices } from '../../../../core/providers/ServiceProvider';

interface UseSettingsReturn {
  settings: UserSettings | null;
  loading: boolean;
  error: Error | null;
  saving: boolean;
  actions: {
    updateProfile: (profile: any) => Promise<void>;
    updatePreferences: (preferences: any) => Promise<void>;
    updateNotifications: (notifications: any) => Promise<void>;
    connectIntegration: (integration: string, config?: any) => Promise<void>;
    disconnectIntegration: (integration: string) => Promise<void>;
    enableTwoFactor: () => Promise<{ qrCode: string; secret: string }>;
    disableTwoFactor: () => Promise<void>;
    revokeSession: (sessionId: string) => Promise<void>;
    createAPIKey: (name: string, permissions: string[]) => Promise<void>;
    revokeAPIKey: (keyId: string) => Promise<void>;
    reload: () => Promise<void>;
  };
}

export function useSettings(userId?: string): UseSettingsReturn {
  const { settings: settingsService } = useServices();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!settingsService || !userId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  }, [settingsService, userId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateProfile = useCallback(async (profile: any) => {
    if (!settingsService || !userId) throw new Error('Settings service not available');
    
    try {
      setSaving(true);
      const updated = await settingsService.updateProfile(profile);
      setSettings(prev => ({ ...prev!, profile: updated }));
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [settingsService, userId]);

  const updatePreferences = useCallback(async (preferences: any) => {
    if (!settingsService || !userId) throw new Error('Settings service not available');
    
    try {
      setSaving(true);
      const updated = await settingsService.updatePreferences(preferences);
      setSettings(prev => ({ ...prev!, preferences: updated }));
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [settingsService, userId]);

  const updateNotifications = useCallback(async (notifications: any) => {
    if (!settingsService || !userId) throw new Error('Settings service not available');
    
    try {
      setSaving(true);
      const updated = await settingsService.updateNotifications(notifications);
      setSettings(prev => ({ ...prev!, notifications: updated }));
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [settingsService, userId]);

  const connectIntegration = useCallback(async (integration: string, config?: any) => {
    if (!settingsService || !userId) throw new Error('Settings service not available');
    
    try {
      setSaving(true);
      await settingsService.connectIntegration(integration, config);
      await fetchSettings();
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [settingsService, userId, fetchSettings]);

  const disconnectIntegration = useCallback(async (integration: string) => {
    if (!settingsService || !userId) throw new Error('Settings service not available');
    
    try {
      setSaving(true);
      await settingsService.disconnectIntegration(integration);
      await fetchSettings();
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [settingsService, userId, fetchSettings]);

  const enableTwoFactor = useCallback(async () => {
    if (!settingsService || !userId) throw new Error('Settings service not available');
    
    const result = await settingsService.enableTwoFactor();
    await fetchSettings();
    return result;
  }, [settingsService, userId, fetchSettings]);

  const disableTwoFactor = useCallback(async () => {
    if (!settingsService || !userId) throw new Error('Settings service not available');
    
    await settingsService.disableTwoFactor();
    await fetchSettings();
  }, [settingsService, userId, fetchSettings]);

  const revokeSession = useCallback(async (sessionId: string) => {
    if (!settingsService || !userId) throw new Error('Settings service not available');
    
    await settingsService.revokeSession(sessionId);
    await fetchSettings();
  }, [settingsService, userId, fetchSettings]);

  const createAPIKey = useCallback(async (name: string, permissions: string[]) => {
    if (!settingsService || !userId) throw new Error('Settings service not available');
    
    await settingsService.generateApiKey(name, permissions);
    await fetchSettings();
  }, [settingsService, userId, fetchSettings]);

  const revokeAPIKey = useCallback(async (keyId: string) => {
    if (!settingsService || !userId) throw new Error('Settings service not available');
    
    await settingsService.revokeApiKey(keyId);
    await fetchSettings();
  }, [settingsService, userId, fetchSettings]);

  return {
    settings,
    loading,
    error,
    saving,
    actions: {
      updateProfile,
      updatePreferences,
      updateNotifications,
      connectIntegration,
      disconnectIntegration,
      enableTwoFactor,
      disableTwoFactor,
      revokeSession,
      createAPIKey,
      revokeAPIKey,
      reload: fetchSettings
    }
  };
}