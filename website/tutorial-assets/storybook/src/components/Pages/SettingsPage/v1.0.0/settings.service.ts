import type { 
  UserSettings, 
  ProfileSettings, 
  PreferenceSettings, 
  NotificationSettings,
  IntegrationSettings,
  SecuritySettings 
} from './settings.types';

export class SettingsService {
  constructor(private apiUrl: string = '/api/settings') {}

  async getSettings(): Promise<UserSettings> {
    const response = await fetch(this.apiUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch settings');
    }
    return response.json();
  }

  async updateProfile(profile: Partial<ProfileSettings>): Promise<ProfileSettings> {
    const response = await fetch(`${this.apiUrl}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!response.ok) {
      throw new Error('Failed to update profile');
    }
    return response.json();
  }

  async updatePreferences(preferences: Partial<PreferenceSettings>): Promise<PreferenceSettings> {
    const response = await fetch(`${this.apiUrl}/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences),
    });
    if (!response.ok) {
      throw new Error('Failed to update preferences');
    }
    return response.json();
  }

  async updateNotifications(notifications: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const response = await fetch(`${this.apiUrl}/notifications`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notifications),
    });
    if (!response.ok) {
      throw new Error('Failed to update notifications');
    }
    return response.json();
  }

  async updateIntegrations(integrations: Partial<IntegrationSettings>): Promise<IntegrationSettings> {
    const response = await fetch(`${this.apiUrl}/integrations`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(integrations),
    });
    if (!response.ok) {
      throw new Error('Failed to update integrations');
    }
    return response.json();
  }

  async updateSecurity(security: Partial<SecuritySettings>): Promise<SecuritySettings> {
    const response = await fetch(`${this.apiUrl}/security`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(security),
    });
    if (!response.ok) {
      throw new Error('Failed to update security settings');
    }
    return response.json();
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!response.ok) {
      throw new Error('Failed to change password');
    }
  }

  async generateApiKey(name: string, permissions: string[]): Promise<{ id: string; key: string }> {
    const response = await fetch(`${this.apiUrl}/api-keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, permissions }),
    });
    if (!response.ok) {
      throw new Error('Failed to generate API key');
    }
    return response.json();
  }

  async revokeApiKey(keyId: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/api-keys/${keyId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to revoke API key');
    }
  }

  async connectIntegration(integration: string, config: any): Promise<void> {
    const response = await fetch(`${this.apiUrl}/integrations/${integration}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!response.ok) {
      throw new Error(`Failed to connect ${integration}`);
    }
  }

  async disconnectIntegration(integration: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/integrations/${integration}/disconnect`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`Failed to disconnect ${integration}`);
    }
  }

  async enableTwoFactor(): Promise<{ qrCode: string; secret: string }> {
    const response = await fetch(`${this.apiUrl}/security/2fa/enable`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to enable two-factor authentication');
    }
    return response.json();
  }

  async disableTwoFactor(): Promise<void> {
    const response = await fetch(`${this.apiUrl}/security/2fa/disable`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to disable two-factor authentication');
    }
  }

  async revokeSession(sessionId: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/security/sessions/${sessionId}/revoke`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to revoke session');
    }
  }
}

export class MockSettingsService extends SettingsService {
  private settings: UserSettings = {
    id: 'user-123',
    userId: 'user-123',
    profile: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      avatar: '',
      bio: 'Software developer',
      location: 'San Francisco, CA',
      timezone: 'America/Los_Angeles'
    },
    preferences: {
      theme: 'light',
      language: 'en',
      dateFormat: 'MM/DD/YYYY'
    },
    notifications: {
      email: {
        enabled: true,
        releases: true,
        documents: true
      },
      push: {
        enabled: false
      },
      inApp: {
        enabled: true,
        releases: true,
        documents: true
      }
    },
    integrations: {
      github: { connected: true, username: 'johndoe' },
      slack: { connected: false },
      jira: { connected: false },
      figma: { connected: true }
    },
    security: {
      twoFactorEnabled: false,
      sessions: [
        {
          id: '1',
          device: 'Chrome on MacOS',
          location: 'San Francisco, CA',
          lastActive: new Date().toISOString(),
          current: true
        }
      ],
      apiKeys: []
    }
  };

  async getSettings(): Promise<UserSettings> {
    return Promise.resolve(this.settings);
  }

  async updateProfile(profile: Partial<ProfileSettings>): Promise<ProfileSettings> {
    this.settings.profile = { ...this.settings.profile, ...profile };
    return Promise.resolve(this.settings.profile);
  }

  async updatePreferences(preferences: Partial<PreferenceSettings>): Promise<PreferenceSettings> {
    this.settings.preferences = { ...this.settings.preferences, ...preferences };
    return Promise.resolve(this.settings.preferences);
  }

  async updateNotifications(notifications: Partial<NotificationSettings>): Promise<NotificationSettings> {
    this.settings.notifications = { ...this.settings.notifications, ...notifications };
    return Promise.resolve(this.settings.notifications);
  }

  async updateIntegrations(integrations: Partial<IntegrationSettings>): Promise<IntegrationSettings> {
    this.settings.integrations = { ...this.settings.integrations, ...integrations };
    return Promise.resolve(this.settings.integrations);
  }

  async updateSecurity(security: Partial<SecuritySettings>): Promise<SecuritySettings> {
    this.settings.security = { ...this.settings.security, ...security };
    return Promise.resolve(this.settings.security);
  }

  async changePassword(_currentPassword: string, _newPassword: string): Promise<void> {
    return Promise.resolve();
  }

  async generateApiKey(name: string, permissions: string[]): Promise<{ id: string; key: string }> {
    const key = {
      id: Math.random().toString(36).substring(7),
      key: `sk_test_${Math.random().toString(36).substring(2)}`,
      name,
      permissions,
      createdAt: new Date().toISOString(),
      lastUsed: null
    };
    this.settings.security.apiKeys.push(key);
    return Promise.resolve({ id: key.id, key: key.key });
  }

  async revokeApiKey(keyId: string): Promise<void> {
    this.settings.security.apiKeys = this.settings.security.apiKeys.filter(k => k.id !== keyId);
    return Promise.resolve();
  }

  async connectIntegration(integration: string, _config: any): Promise<void> {
    if (this.settings.integrations[integration as keyof IntegrationSettings]) {
      (this.settings.integrations[integration as keyof IntegrationSettings] as any).connected = true;
    }
    return Promise.resolve();
  }

  async disconnectIntegration(integration: string): Promise<void> {
    if (this.settings.integrations[integration as keyof IntegrationSettings]) {
      (this.settings.integrations[integration as keyof IntegrationSettings] as any).connected = false;
    }
    return Promise.resolve();
  }

  async enableTwoFactor(): Promise<{ qrCode: string; secret: string }> {
    this.settings.security.twoFactorEnabled = true;
    return Promise.resolve({
      qrCode: 'data:image/png;base64,mock-qr-code',
      secret: 'MOCK2FASECRET'
    });
  }

  async disableTwoFactor(): Promise<void> {
    this.settings.security.twoFactorEnabled = false;
    return Promise.resolve();
  }

  async revokeSession(sessionId: string): Promise<void> {
    this.settings.security.sessions = this.settings.security.sessions.filter(s => s.id !== sessionId);
    return Promise.resolve();
  }
}

