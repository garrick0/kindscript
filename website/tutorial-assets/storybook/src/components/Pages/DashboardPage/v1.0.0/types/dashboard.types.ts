import { LucideIcon } from 'lucide-react';

export interface DashboardStat {
  name: string;
  label?: string;
  value: string | number;
  icon?: LucideIcon | string;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  unit?: string;
}

export interface Activity {
  id: string | number;
  type: 'document' | 'page' | 'release' | 'workflow' | 'system';
  action: string;
  target?: string;
  user?: string;
  description?: string;
  time?: string;
  timestamp?: Date | string;
  userId?: string;
  userName?: string;
  metadata?: Record<string, any>;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon?: LucideIcon | string;
  color?: string;
  href?: string;
  onClick?: () => void;
}

export interface DashboardData {
  stats: DashboardStat[];
  recentActivity: Activity[];
  quickActions?: QuickAction[];
  notifications?: Notification[];
  chartData?: any;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message?: string;
  time?: string;
  timestamp?: string;
  read?: boolean;
  actionLabel?: string;
  actionUrl?: string;
}

// Context state and actions
export interface DashboardState {
  selectedStats: string[];
  timeRange: string;
  view: 'grid' | 'list';
  refreshInterval: number | null;
}

export type DashboardAction =
  | { type: 'SELECT_STAT'; payload: string }
  | { type: 'SET_TIME_RANGE'; payload: string }
  | { type: 'SET_VIEW'; payload: 'grid' | 'list' }
  | { type: 'SET_REFRESH_INTERVAL'; payload: number | null }
  | { type: 'RESET' }