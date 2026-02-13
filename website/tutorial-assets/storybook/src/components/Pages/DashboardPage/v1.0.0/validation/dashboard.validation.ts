import { z } from 'zod';

// Dashboard metric validation schema
export const DashboardStatSchema = z.object({
  id: z.string().min(1, 'Stat ID is required'),
  label: z.string().min(1, 'Stat label is required'),
  value: z.number(),
  change: z.number().optional(),
  changeType: z.enum(['positive', 'negative', 'neutral']).optional(),
  icon: z.string().optional(),
  format: z.enum(['number', 'currency', 'percentage']).optional()
});

// Activity validation schema
export const ActivitySchema = z.object({
  id: z.string().min(1, 'Activity ID is required'),
  type: z.enum(['release', 'document', 'workflow', 'user', 'system']),
  action: z.string().min(1, 'Activity action is required'),
  description: z.string().min(1, 'Activity description is required'),
  timestamp: z.string().datetime(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    avatar: z.string().optional()
  }).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

// Notification validation schema
export const NotificationSchema = z.object({
  id: z.string().min(1, 'Notification ID is required'),
  type: z.enum(['info', 'warning', 'error', 'success']),
  title: z.string().min(1, 'Notification title is required'),
  message: z.string().min(1, 'Notification message is required'),
  timestamp: z.string().datetime(),
  read: z.boolean(),
  actions: z.array(z.object({
    id: z.string(),
    label: z.string(),
    action: z.string(),
    variant: z.enum(['primary', 'secondary', 'danger']).optional()
  })).optional()
});

// Quick action validation schema
export const QuickActionSchema = z.object({
  id: z.string().min(1, 'Quick action ID is required'),
  label: z.string().min(1, 'Quick action label is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
  href: z.string().optional(),
  onClick: z.function().optional(),
  disabled: z.boolean().optional(),
  badge: z.object({
    text: z.string(),
    variant: z.enum(['default', 'success', 'warning', 'error']).optional()
  }).optional()
});

// Dashboard data validation schema
export const DashboardDataSchema = z.object({
  stats: z.array(DashboardStatSchema),
  recentActivity: z.array(ActivitySchema),
  notifications: z.array(NotificationSchema),
  quickActions: z.array(QuickActionSchema)
});

// DashboardPage props validation schema
export const DashboardPagePropsSchema = z.object({
  userId: z.string().optional(),
  refreshInterval: z.number().int().min(1000).optional(), // in milliseconds
  showWelcome: z.boolean().optional()
});

// Dashboard filters validation schema
export const DashboardFiltersSchema = z.object({
  timeRange: z.enum(['today', 'week', 'month', 'quarter', 'year']).optional(),
  activityType: z.enum(['all', 'release', 'document', 'workflow', 'user', 'system']).optional(),
  showNotifications: z.boolean().optional()
});

// Dashboard action validation schema
export const DashboardActionSchema = z.object({
  type: z.enum(['refresh', 'markAsRead', 'dismissNotification', 'executeQuickAction']),
  target: z.string().optional(), // notification ID, action ID, etc.
  data: z.record(z.string(), z.unknown()).optional()
});

// Widget configuration validation schema
export const WidgetConfigSchema = z.object({
  id: z.string().min(1, 'Widget ID is required'),
  type: z.enum(['stats', 'activity', 'notifications', 'chart', 'quickActions']),
  title: z.string().min(1, 'Widget title is required'),
  position: z.object({
    x: z.number().int().min(0),
    y: z.number().int().min(0),
    w: z.number().int().min(1),
    h: z.number().int().min(1)
  }),
  visible: z.boolean(),
  config: z.record(z.string(), z.unknown()).optional()
});

// Dashboard layout validation schema
export const DashboardLayoutSchema = z.object({
  widgets: z.array(WidgetConfigSchema),
  columns: z.number().int().min(1).max(12),
  rowHeight: z.number().int().min(10),
  margin: z.array(z.number()).length(2).optional()
});

// Export type inferences for TypeScript
export type DashboardStatValidation = z.infer<typeof DashboardStatSchema>;
export type ActivityValidation = z.infer<typeof ActivitySchema>;
export type NotificationValidation = z.infer<typeof NotificationSchema>;
export type QuickActionValidation = z.infer<typeof QuickActionSchema>;
export type DashboardDataValidation = z.infer<typeof DashboardDataSchema>;
export type DashboardPagePropsValidation = z.infer<typeof DashboardPagePropsSchema>;
export type DashboardFiltersValidation = z.infer<typeof DashboardFiltersSchema>;
export type DashboardActionValidation = z.infer<typeof DashboardActionSchema>;
export type WidgetConfigValidation = z.infer<typeof WidgetConfigSchema>;
export type DashboardLayoutValidation = z.infer<typeof DashboardLayoutSchema>;