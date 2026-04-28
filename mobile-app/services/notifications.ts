import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { notificationsAPI } from './api';

// Expo Go does not support push notifications from SDK 53+.
// Using conditional require to avoid module-level crash.
const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export interface PushNotification {
  id?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  timestamp?: string;
  read?: boolean;
  type?: 'booking' | 'payment' | 'system' | 'promotional';
}

class NotificationService {
  private pushToken: string | null = null;
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    if (isExpoGo) {
      console.log('[Notifications] Expo Go detected - push notifications not supported in SDK 53+, skipping');
      return false;
    }

    try {
      if (this.isInitialized) {
        return true;
      }

      // Request permission
      const permissionResult = await this.requestPermissions();
      if (!permissionResult) {
        console.warn('[Notifications] Permission denied');
        return false;
      }

      // Get push token
      const token = await this.getPushToken();
      if (!token) {
        console.warn('[Notifications] Failed to get push token');
        return false;
      }

      this.pushToken = token;
      this.isInitialized = true;

      // Register token with backend
      await this.registerTokenWithBackend();

      // Set up notification listeners
      this.setupNotificationListeners();

      console.log('[Notifications] Service initialized successfully');
      return true;
    } catch (error) {
      console.error('[Notifications] Initialization failed:', error);
      return false;
    }
  }

  private async requestPermissions(): Promise<boolean> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Notifications = require('expo-notifications');
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('[Notifications] Permission request failed:', error);
      return false;
    }
  }

  private async getPushToken(): Promise<string | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Notifications = require('expo-notifications');
      const token = await Notifications.getDevicePushTokenAsync();
      return token.data;
    } catch (error) {
      console.error('[Notifications] Failed to get push token:', error);
      return null;
    }
  }

  private async registerTokenWithBackend(): Promise<void> {
    if (!this.pushToken) return;

    try {
      const deviceType = Platform.OS as 'ios' | 'android';
      const deviceName = `${Platform.OS} Device (${Platform.Version})`;

      await notificationsAPI.registerDevice({
        deviceToken: this.pushToken,
        deviceType,
        deviceName,
      });

      console.log('[Notifications] Token registered with backend');
    } catch (error) {
      console.error('[Notifications] Backend registration failed:', error);
    }
  }

  private setupNotificationListeners(): void {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Notifications = require('expo-notifications');
    Notifications.addNotificationResponseReceivedListener((response: any) => {
      console.log('[Notifications] Notification pressed:', response);
      this.handleNotificationPress(response.notification);
    });
    Notifications.addNotificationReceivedListener((notification: any) => {
      console.log('[Notifications] Received in foreground:', notification);
    });
  }

  private handleNotificationPress(notification: any): void {
    const data = notification.request.content.data;
    
    if (!data) return;

    // Handle different notification types
    switch (data.type) {
      case 'booking_confirmed':
        // Navigate to booking details
        console.log('[Notifications] Navigate to booking:', data.bookingId);
        break;
      case 'payment_success':
        // Navigate to payment confirmation
        console.log('[Notifications] Navigate to payment:', data.bookingId);
        break;
      case 'maintenance_alert':
        // Navigate to car details
        console.log('[Notifications] Navigate to car:', data.carId);
        break;
      default:
        console.log('[Notifications] Unknown notification type:', data.type);
    }
  }

  async sendLocalNotification(notification: PushNotification): Promise<void> {
    if (isExpoGo) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Notifications = require('expo-notifications');
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: 'default',
        },
        trigger: null,
      });
    } catch (error) {
      console.error('[Notifications] Failed to send local notification:', error);
    }
  }

  async scheduleNotification(
    notification: PushNotification,
    trigger: any
  ): Promise<string | null> {
    if (isExpoGo) return null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Notifications = require('expo-notifications');
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: 'default',
        },
        trigger,
      });
      return identifier;
    } catch (error) {
      console.error('[Notifications] Failed to schedule notification:', error);
      return null;
    }
  }

  async cancelNotification(identifier: string): Promise<void> {
    if (isExpoGo) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Notifications = require('expo-notifications');
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('[Notifications] Failed to cancel notification:', error);
    }
  }

  async getBadgeCount(): Promise<number> {
    if (isExpoGo) return 0;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Notifications = require('expo-notifications');
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('[Notifications] Failed to get badge count:', error);
      return 0;
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    if (isExpoGo) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Notifications = require('expo-notifications');
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('[Notifications] Failed to set badge count:', error);
    }
  }

  async clearAllNotifications(): Promise<void> {
    if (isExpoGo) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Notifications = require('expo-notifications');
      await Notifications.dismissAllNotificationsAsync();
      await this.setBadgeCount(0);
    } catch (error) {
      console.error('[Notifications] Failed to clear notifications:', error);
    }
  }

  getStoredToken(): string | null {
    return this.pushToken;
  }

  isReady(): boolean {
    return this.isInitialized && this.pushToken !== null;
  }

  async unregister(): Promise<void> {
    if (this.pushToken) {
      try {
        await notificationsAPI.unregisterDevice(this.pushToken);
        console.log('[Notifications] Token unregistered from backend');
      } catch (error) {
        console.error('[Notifications] Unregistration failed:', error);
      }
    }
    
    this.pushToken = null;
    this.isInitialized = false;
  }
}

export const notificationService = new NotificationService();
