import { z } from 'zod';

// User settings validation schemas
export const userProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .email('Invalid email address'),
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
  timezone: z.string().optional(),
  language: z.enum(['en', 'es', 'fr', 'de', 'ja']).default('en'),
});

export const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  notificationTypes: z.object({
    releases: z.boolean(),
    documents: z.boolean(),
    comments: z.boolean(),
    mentions: z.boolean(),
    updates: z.boolean(),
  }),
  frequency: z.enum(['realtime', 'daily', 'weekly', 'never']),
});

export const securitySettingsSchema = z.object({
  twoFactorEnabled: z.boolean(),
  sessionTimeout: z.number().min(5).max(1440), // minutes
  allowedIPs: z.array(z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 'Invalid IP address')).optional(),
  apiKeys: z.array(z.object({
    id: z.string(),
    name: z.string(),
    permissions: z.array(z.enum(['read', 'write', 'delete', 'admin'])),
    createdAt: z.string(),
    lastUsed: z.string().optional(),
  })).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Type exports
export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>;
export type SecuritySettingsInput = z.infer<typeof securitySettingsSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;