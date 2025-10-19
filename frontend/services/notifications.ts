import { api, ApiResponse } from './api';

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  type: 'group_invite' | 'session_reminder' | 'session_started' | 'session_ended' | 'group_update' | 'achievement' | 'system';
  title: string;
  message: string;
  data?: any; // Additional data specific to notification type
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  session_reminders: boolean;
  group_updates: boolean;
  achievements: boolean;
  marketing: boolean;
}

export interface MarkNotificationReadRequest {
  notification_ids: string[];
}

export interface NotificationStats {
  total_notifications: number;
  unread_count: number;
  read_count: number;
}

// Notifications service
export const notificationsService = {
  // Get user notifications
  getNotifications: async (limit: number = 20, offset: number = 0): Promise<{
    notifications: Notification[];
    total: number;
    unread_count: number;
  }> => {
    const response = await api.get('/api/v1/notifications', { limit, offset });
    return response.data.data;
  },

  // Get unread notifications
  getUnreadNotifications: async (): Promise<Notification[]> => {
    const response = await api.get<Notification[]>('/api/v1/notifications/unread');
    return response.data.data;
  },

  // Mark notifications as read
  markAsRead: async (notificationIds: string[]): Promise<void> => {
    await api.post('/api/v1/notifications/read', { notification_ids: notificationIds });
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<void> => {
    await api.post('/api/v1/notifications/read-all');
  },

  // Delete notification
  deleteNotification: async (notificationId: string): Promise<void> => {
    await api.delete(`/api/v1/notifications/${notificationId}`);
  },

  // Delete all notifications
  deleteAllNotifications: async (): Promise<void> => {
    await api.delete('/api/v1/notifications/all');
  },

  // Get notification settings
  getNotificationSettings: async (): Promise<NotificationSettings> => {
    const response = await api.get<NotificationSettings>('/api/v1/notifications/settings');
    return response.data.data;
  },

  // Update notification settings
  updateNotificationSettings: async (settings: Partial<NotificationSettings>): Promise<NotificationSettings> => {
    const response = await api.put<NotificationSettings>('/api/v1/notifications/settings', settings);
    return response.data.data;
  },

  // Get notification statistics
  getNotificationStats: async (): Promise<NotificationStats> => {
    const response = await api.get<NotificationStats>('/api/v1/notifications/stats');
    return response.data.data;
  },

  // Subscribe to push notifications
  subscribeToPushNotifications: async (deviceToken: string): Promise<void> => {
    await api.post('/api/v1/notifications/subscribe', { device_token: deviceToken });
  },

  // Unsubscribe from push notifications
  unsubscribeFromPushNotifications: async (): Promise<void> => {
    await api.post('/api/v1/notifications/unsubscribe');
  },
};
