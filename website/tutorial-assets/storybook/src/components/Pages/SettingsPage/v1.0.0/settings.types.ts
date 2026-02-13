// Settings types
export interface UserSettings {
  id: string;
  userId: string;
  profile: ProfileSettings;
  preferences: PreferenceSettings;
  notifications: NotificationSettings;
  integrations: IntegrationSettings;
  security: SecuritySettings;
}

export interface ProfileSettings {
  id?: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  timezone: string;
  language?: string;
}

export interface PreferenceSettings {
  theme: 'light' | 'dark' | 'system';
  language?: string;
  dateFormat?: string;
  timeFormat?: string;
  firstDayOfWeek?: number;
  defaultView?: 'grid' | 'list' | 'kanban';
  autoSave?: boolean;
  autoSaveInterval?: number;
  compactMode?: boolean;
  showLineNumbers?: boolean;
  showTips?: boolean;
  editorMode?: 'visual' | 'markdown' | 'code';
}

export interface NotificationSettings {
  email: {
    enabled: boolean;
    frequency?: string;
    types?: {
      mentions?: boolean;
      updates?: boolean;
      releases?: boolean;
      comments?: boolean;
      security?: boolean;
    };
    releases?: boolean;
    documents?: boolean;
    mentions?: boolean;
    weeklyDigest?: boolean;
  };
  push: {
    enabled: boolean;
    types?: {
      mentions?: boolean;
      updates?: boolean;
      releases?: boolean;
      comments?: boolean;
      security?: boolean;
    };
    releases?: boolean;
    documents?: boolean;
    mentions?: boolean;
  };
  inApp: {
    enabled: boolean;
    types?: {
      mentions?: boolean;
      updates?: boolean;
      releases?: boolean;
      comments?: boolean;
      security?: boolean;
    };
    releases?: boolean;
    documents?: boolean;
    mentions?: boolean;
  };
}

export interface IntegrationSettings {
  github?: {
    connected: boolean;
    username?: string;
    repositories?: string[];
    repos?: string[];
    lastSync?: string;
  };
  slack?: {
    connected: boolean;
    workspace?: string | null;
    channel?: string | null;
  };
  jira?: {
    connected: boolean;
    instance?: string | null;
    project?: string | null;
  };
  figma?: {
    connected: boolean;
    team?: string;
  };
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessions: SessionInfo[];
  apiKeys: APIKey[];
  lastPasswordChange?: string;
  loginHistory?: Array<{
    timestamp: string;
    location: string;
    device: string;
    success: boolean;
  }>;
}

export interface SessionInfo {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
}

export interface APIKey {
  id: string;
  name: string;
  key?: string;
  createdAt: string;
  lastUsed?: string | null;
  permissions: string[];
}