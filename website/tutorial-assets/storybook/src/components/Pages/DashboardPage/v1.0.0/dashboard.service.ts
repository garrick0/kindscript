import type { DashboardData, DashboardStat, Activity, QuickAction, Notification } from './types/dashboard.types';

export interface DashboardFilters {
  timeRange?: string;
  statType?: string;
  activityType?: string;
}

export class DashboardService {
  constructor(private apiUrl: string = '/api/dashboard') {}

  async getDashboardData(filters?: DashboardFilters): Promise<DashboardData> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await fetch(`${this.apiUrl}?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
    }
    return response.json();
  }

  async getStats(timeRange?: string): Promise<DashboardStat[]> {
    const params = timeRange ? `?timeRange=${timeRange}` : '';
    const response = await fetch(`${this.apiUrl}/stats${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats');
    }
    return response.json();
  }

  async getRecentActivity(limit?: number): Promise<Activity[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await fetch(`${this.apiUrl}/activity${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch recent activity');
    }
    return response.json();
  }

  async getQuickActions(): Promise<QuickAction[]> {
    const response = await fetch(`${this.apiUrl}/quick-actions`);
    if (!response.ok) {
      throw new Error('Failed to fetch quick actions');
    }
    return response.json();
  }

  async getNotifications(unreadOnly?: boolean): Promise<Notification[]> {
    const params = unreadOnly ? '?unreadOnly=true' : '';
    const response = await fetch(`${this.apiUrl}/notifications${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }
    return response.json();
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/notifications/${notificationId}/read`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }
  }

  async markAllNotificationsAsRead(): Promise<void> {
    const response = await fetch(`${this.apiUrl}/notifications/read-all`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read');
    }
  }

  async refreshData(): Promise<DashboardData> {
    const response = await fetch(`${this.apiUrl}/refresh`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to refresh dashboard data');
    }
    return response.json();
  }
}