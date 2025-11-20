import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid, Platform, Alert } from 'react-native';

const FCM_TOKEN_KEY = 'fcm_token';

class FCMService {
  async initialize() {
    try {
      await this.requestUserPermission();
      this.setupNotificationListeners();
    } catch (error) {
      console.error('FCM initialization error:', error);
    }
  }

  async requestUserPermission() {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      // Android 13+ requires explicit permission
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Android 13+ notification permission granted');
        await this.getFCMToken();
      } else {
        console.log('Android 13+ notification permission denied');
      }
    } else if (Platform.OS === 'ios') {
      // iOS permission request
      const authStatus = await messaging().requestPermission();
      const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED || 
                     authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('iOS notification permission granted:', authStatus);
        await this.getFCMToken();
      } else {
        console.log('iOS notification permission denied');
      }
    } else {
      // Android < 13 - no explicit permission needed
      console.log('Android < 13 - getting FCM token directly');
      await this.getFCMToken();
    }
  }

  async getFCMToken() {
    try {
      const token = await messaging().getToken();
      if (token) {
        console.log('FCM Token:', token);
        await this.saveFCMToken(token);
        return token;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
    }
  }

  setupNotificationListeners() {
    // Handle token refresh
    messaging().onTokenRefresh(async (token) => {
      console.log('FCM Token refreshed:', token);
      await this.saveFCMToken(token);
    });

    // Handle foreground notifications - only log, don't show alert
    messaging().onMessage(async remoteMessage => {
      console.log('Foreground notification received:', remoteMessage);
      // System notification will still show in notification tray
    });

    // Handle background/quit state notifications
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background notification:', remoteMessage);
    });

    // Handle notification tap (app opened from quit state)
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        console.log('App opened from notification:', remoteMessage);
        this.handleNotificationTap(remoteMessage.data);
      }
    });

    // Handle notification tap (app in background)
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened app:', remoteMessage);
      this.handleNotificationTap(remoteMessage.data);
    });
  }

  async saveFCMToken(token) {
    try {
      // Save locally
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
      
      // Send to backend
      await this.sendTokenToBackend(token);
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  async sendTokenToBackend(token) {
    try {
      // Lazy-import to avoid circular dependencies
      const { config } = require('../config/env');
      const { tokenManager } = require('../utils/tokenManager');
      
      const accessToken = await tokenManager.getValidToken();

      if (!accessToken) {
        console.warn('FCM: no auth token available; skipping sending fcm token to backend');
        return;
      }

      const response = await fetch(`${config.API_BASE_URL}/notifications/push-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fcmToken: token,
          platform: Platform.OS
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('FCM token saved to backend:', result);
      } else {
        console.error('Failed to save FCM token to backend:', response.status);
      }
    } catch (error) {
      console.error('Error saving FCM token to backend:', error);
    }
  }

  handleNotificationTap(data) {
    if (!data) return;

    // Import navigation service to handle routing
    const notificationService = require('./notificationService').default;
    notificationService.navigateFromNotification(data);
  }

  async removeFCMToken() {
    try {
      // Lazy-import to avoid circular dependencies
      const { config } = require('../config/env');
      const { tokenManager } = require('../utils/tokenManager');
      
      const token = await AsyncStorage.getItem(FCM_TOKEN_KEY);
      if (token) {
        const accessToken = await tokenManager.getValidToken();

        if (accessToken) {
          // Remove from backend
          await fetch(`${config.API_BASE_URL}/notifications/push-token`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fcmToken: token }),
          });
        } else {
          console.warn('FCM: no auth token available; skipping remote token deletion');
        }
        
        // Delete FCM token locally
        await messaging().deleteToken();
        await AsyncStorage.removeItem(FCM_TOKEN_KEY);
        
        console.log('FCM token removed');
      }
    } catch (error) {
      console.error('Error removing FCM token:', error);
    }
  }
}

export default new FCMService();