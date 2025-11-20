# 🔥 Firebase FCM Setup Documentation - JholaBazar

**Project:** JholaBazar Grocery Delivery Platform  
**Platform:** React Native Android  
**Purpose:** Complete step-by-step Firebase Cloud Messaging integration

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Package Installation](#package-installation)
3. [Firebase Configuration](#firebase-configuration)
4. [Android Setup](#android-setup)
5. [React Native Integration](#react-native-integration)
6. [Testing & Verification](#testing--verification)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Prerequisites

### Required Files
- ✅ Firebase project created (Project ID: `jholabazarcom`)
- ✅ `google-services.json` downloaded from Firebase Console
- ✅ Backend FCM service running

### Development Environment
- Node.js 20+
- React Native 0.82.1
- Android Studio
- Java 17

---

## 📦 Package Installation

### Step 1: Install Firebase Packages

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

**File:** `package.json`
```json
{
  "dependencies": {
    "@react-native-firebase/app": "^21.5.0",
    "@react-native-firebase/messaging": "^21.5.0"
  }
}
```

---

## 🔥 Firebase Configuration

### Step 1: Add google-services.json

**Location:** `android/app/google-services.json`

```json
{
  "project_info": {
    "project_number": "607097607746",
    "project_id": "jholabazarcom",
    "storage_bucket": "jholabazarcom.firebasestorage.app"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:607097607746:android:028b0cf87d4f5deebb7fdb",
        "android_client_info": {
          "package_name": "com.jholabazar"
        }
      },
      "api_key": [
        {
          "current_key": "AIzaSyDnrtKu7AD2nABR864O8T6AtjKxbZ_p2QY"
        }
      ]
    }
  ]
}
```

---

## 🤖 Android Setup

### Step 1: Update Project build.gradle

**File:** `android/build.gradle`
```gradle
buildscript {
    ext {
        buildToolsVersion = "36.0.0"
        minSdkVersion = 24
        compileSdkVersion = 36
        targetSdkVersion = 36
        ndkVersion = "27.1.12297006"
        kotlinVersion = "2.1.20"
    }
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle")
        classpath("com.facebook.react:react-native-gradle-plugin")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin")
        classpath("com.google.gms:google-services:4.4.2")  // ADD THIS
    }
}
```

### Step 2: Update App build.gradle

**File:** `android/app/build.gradle`
```gradle
apply plugin: "com.android.application"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "com.facebook.react"
apply plugin: "com.google.gms.google-services"  // ADD THIS
apply from: file("../../node_modules/react-native-vector-icons/fonts.gradle")

dependencies {
    // The version of react-native is set by the React Native Gradle Plugin
    implementation("com.facebook.react:react-android")

    // Firebase BoM (Bill of Materials) - ADD THESE
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    
    // Firebase Cloud Messaging
    implementation 'com.google.firebase:firebase-messaging'
    
    // Firebase Analytics (optional but recommended)
    implementation 'com.google.firebase:firebase-analytics'

    if (hermesEnabled.toBoolean()) {
        implementation("com.facebook.react:hermes-android")
    } else {
        implementation jscFlavor
    }
}
```

### Step 3: Update AndroidManifest.xml

**File:** `android/app/src/main/AndroidManifest.xml`
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />  <!-- ADD THIS -->

    <application
      android:name=".MainApplication"
      android:label="@string/app_name"
      android:icon="@mipmap/ic_launcher"
      android:roundIcon="@mipmap/ic_launcher_round"
      android:allowBackup="false"
      android:theme="@style/AppTheme"
      android:usesCleartextTraffic="${usesCleartextTraffic}"
      android:supportsRtl="true">
      
      <activity
        android:name=".MainActivity"
        android:label="@string/app_name"
        android:configChanges="keyboard|keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize|uiMode"
        android:launchMode="singleTask"
        android:windowSoftInputMode="adjustResize"
        android:exported="true">
        <intent-filter>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>
      </activity>
      
      <!-- Firebase Messaging Service - ADD THIS -->
      <service
        android:name=".MyFirebaseMessagingService"
        android:exported="false">
        <intent-filter>
          <action android:name="com.google.firebase.MESSAGING_EVENT" />
        </intent-filter>
      </service>

      <!-- Set custom default icon (optional) - ADD THESE -->
      <meta-data
        android:name="com.google.firebase.messaging.default_notification_icon"
        android:resource="@android:drawable/ic_dialog_info"
        tools:replace="android:resource" />
      
      <!-- Set notification color (optional) -->
      <meta-data
        android:name="com.google.firebase.messaging.default_notification_color"
        android:resource="@android:color/holo_blue_bright"
        tools:replace="android:resource" />
      
      <!-- Set default notification channel (Android 8.0+) -->
      <meta-data
        android:name="com.google.firebase.messaging.default_notification_channel_id"
        android:value="jholabazar_notifications"
        tools:replace="android:value" />
    </application>
</manifest>
```

### Step 4: Create Firebase Messaging Service

**File:** `android/app/src/main/java/com/jholabazar/MyFirebaseMessagingService.java`
```java
package com.jholabazar;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

public class MyFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "FCMService";
    private static final String CHANNEL_ID = "jholabazar_notifications";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Log.d(TAG, "Message received from: " + remoteMessage.getFrom());

        // Check if message contains notification payload
        if (remoteMessage.getNotification() != null) {
            String title = remoteMessage.getNotification().getTitle();
            String body = remoteMessage.getNotification().getBody();
            String imageUrl = remoteMessage.getNotification().getImageUrl() != null 
                ? remoteMessage.getNotification().getImageUrl().toString() 
                : null;
            
            Log.d(TAG, "Notification Title: " + title);
            Log.d(TAG, "Notification Body: " + body);
            
            showNotification(title, body, imageUrl, remoteMessage.getData());
        }

        // Check if message contains data payload
        if (remoteMessage.getData().size() > 0) {
            Log.d(TAG, "Message data payload: " + remoteMessage.getData());
            handleDataPayload(remoteMessage.getData());
        }
    }

    @Override
    public void onNewToken(String token) {
        Log.d(TAG, "New FCM token: " + token);
        // Token will be handled by React Native FCM service
    }

    private void showNotification(String title, String body, String imageUrl, 
                                   Map<String, String> data) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        
        // Add data to intent
        if (data != null) {
            for (Map.Entry<String, String> entry : data.entrySet()) {
                intent.putExtra(entry.getKey(), entry.getValue());
            }
        }
        
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, intent, 
            PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder notificationBuilder = 
            new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(body)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pendingIntent);

        NotificationManager notificationManager = 
            (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        
        notificationManager.notify(0, notificationBuilder.build());
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "JholaBazar Notifications",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Order updates, delivery alerts, and promotions");
            channel.enableLights(true);
            channel.enableVibration(true);
            
            NotificationManager notificationManager = 
                getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
        }
    }

    private void handleDataPayload(Map<String, String> data) {
        String type = data.get("type");
        
        switch (type != null ? type : "") {
            case "ORDER_UPDATE":
                String orderId = data.get("orderId");
                Log.d(TAG, "Order update for: " + orderId);
                break;
            case "NEW_MESSAGE":
                Log.d(TAG, "New message received");
                break;
            default:
                Log.d(TAG, "Unknown data type: " + type);
        }
    }
}
```

---

## ⚛️ React Native Integration

### Step 1: Create FCM Service

**File:** `src/services/fcmService.js`
```javascript
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
```

### Step 2: Create Notification Service

**File:** `src/services/notificationService.ts`
```typescript
import fcmService from './fcmService';
import { NavigationContainerRef } from '@react-navigation/native';

class NotificationService {
  private navigationRef: NavigationContainerRef<any> | null = null;

  setNavigationRef(ref: NavigationContainerRef<any>) {
    this.navigationRef = ref;
  }

  async initialize() {
    await fcmService.initialize();
  }

  navigateFromNotification(data: any) {
    if (!this.navigationRef || !data) return;

    const { type, orderId, productId } = data;

    switch (type) {
      case 'ORDER_CONFIRMED':
      case 'ORDER_DISPATCHED':
      case 'ORDER_DELIVERED':
        this.navigationRef.navigate('OrderDetails', { orderId });
        break;
      case 'PROMOTIONAL':
        this.navigationRef.navigate('Home');
        break;
      case 'PRODUCT':
        if (productId) {
          this.navigationRef.navigate('ProductDetails', { productId });
        }
        break;
      default:
        this.navigationRef.navigate('Home');
    }
  }
}

export default new NotificationService();
```

### Step 3: Update App.tsx

**File:** `App.tsx`
```typescript
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { store, persistor } from './src/store/store';
import { checkAuthStatus } from './src/utils/authCheck';
import { loadThemeMode, ThemeMode } from './src/store/slices/uiSlice';
import { useTheme } from './src/hooks/useTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationService from './src/services/notificationService';  // ADD THIS

// ... other imports

function AppContent() {
  const { colors, isDark } = useTheme();
  const dispatch = useDispatch();
  
  useEffect(() => {
    // Load saved theme preference after Redux is initialized
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themeMode');
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          dispatch(loadThemeMode(savedTheme as ThemeMode));
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    
    loadTheme();
    
    // Initialize Firebase notifications - ADD THIS
    notificationService.initialize();
    
    // Debug: Log FCM token - ADD THIS
    setTimeout(async () => {
      try {
        const messaging = require('@react-native-firebase/messaging').default;
        const token = await messaging().getToken();
        console.log('🔥 DEBUG FCM TOKEN:', token);
        console.log('🔥 TOKEN LENGTH:', token?.length);
      } catch (error) {
        console.log('🔥 DEBUG FCM ERROR:', error);
      }
    }, 3000);

  }, [dispatch]);

  return (
    <SafeAreaProvider>
      <NavigationContainer
        ref={(ref) => notificationService.setNavigationRef(ref)}  // ADD THIS
      >
        <StatusBar 
          barStyle={isDark ? "light-content" : "dark-content"} 
          backgroundColor={colors.background} 
        />
        <Stack.Navigator 
          initialRouteName="Splash"
          screenOptions={{ headerShown: false }}
        >
          {/* Your existing screens */}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
```

---

## 🧪 Testing & Verification

### Step 1: Build and Run

```bash
# Clean and build
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

### Step 2: Verify Setup

```bash
# Run test script
node test-fcm-android.js
```

### Step 3: Check FCM Token

Look for this in console logs:
```
🔥 DEBUG FCM TOKEN: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
FCM token saved to backend: { success: true }
```

### Step 4: Test Notification

1. **Firebase Console Method:**
   - Go to Firebase Console → Messaging
   - Send test message with your FCM token

2. **Backend API Method:**
   - Place an order in your app
   - Check notification appears in system tray

### Step 5: Expected Results

- ✅ **App in foreground**: System notification only (no popup)
- ✅ **App in background**: System notification
- ✅ **App closed**: System notification
- ✅ **Tap notification**: Opens relevant screen

---

## 🔧 Troubleshooting

### Common Issues

**1. Build Fails with Google Services Error**
```bash
# Solution
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

**2. No FCM Token Generated**
```
Check:
- google-services.json in correct location
- Internet permission in AndroidManifest.xml
- Firebase project configuration
```

**3. Notifications Not Received**
```
Check:
- FCM token saved to backend
- Backend sending notifications
- Notification permissions granted
```

**4. Manifest Merger Failed**
```
Solution: Add tools:replace attributes to meta-data elements
```

### Debug Commands

```bash
# Check Android logs
adb logcat | grep "FCM\|Firebase"

# Check Metro logs
npx react-native start --reset-cache

# Verify package installation
npm list @react-native-firebase/app @react-native-firebase/messaging
```

---

## ✅ Setup Checklist

### Package Installation
- [ ] Install @react-native-firebase/app
- [ ] Install @react-native-firebase/messaging
- [ ] Run npm install

### Firebase Configuration
- [ ] Add google-services.json to android/app/
- [ ] Verify project_id matches Firebase Console

### Android Configuration
- [ ] Update android/build.gradle with Google Services plugin
- [ ] Update android/app/build.gradle with Firebase dependencies
- [ ] Add POST_NOTIFICATIONS permission to AndroidManifest.xml
- [ ] Add Firebase messaging service to AndroidManifest.xml
- [ ] Add Firebase metadata to AndroidManifest.xml
- [ ] Create MyFirebaseMessagingService.java

### React Native Integration
- [ ] Create src/services/fcmService.js
- [ ] Create src/services/notificationService.ts
- [ ] Update App.tsx with notification service
- [ ] Add navigation reference

### Testing
- [ ] Build and run app successfully
- [ ] FCM token generated and logged
- [ ] FCM token saved to backend
- [ ] Test notification from Firebase Console
- [ ] Test notification from backend (place order)
- [ ] Verify notification tap navigation

---

## 📚 File Structure

```
JholaBazar/
├── android/
│   ├── app/
│   │   ├── google-services.json                    ← Firebase config
│   │   ├── build.gradle                           ← Firebase dependencies
│   │   └── src/main/
│   │       ├── AndroidManifest.xml                ← Permissions & service
│   │       └── java/com/jholabazar/
│   │           └── MyFirebaseMessagingService.java ← Native FCM service
│   └── build.gradle                               ← Google Services plugin
├── src/
│   ├── services/
│   │   ├── fcmService.js                          ← FCM logic
│   │   └── notificationService.ts                 ← Navigation handling
│   └── ...
├── App.tsx                                        ← FCM initialization
├── package.json                                   ← Firebase packages
└── test-fcm-android.js                           ← Test script
```

---

## 🎯 Backend Integration

Your backend should send notifications like this:

```javascript
// When order is placed
const message = {
  notification: {
    title: "🎉 Order Confirmed!",
    body: `Hi ${userName}! Your order #${orderNumber} for ₹${amount} has been confirmed.`
  },
  data: {
    type: "ORDER_CONFIRMED",
    orderId: orderId,
    screen: "OrderDetails"
  },
  token: userFCMToken
};

await admin.messaging().send(message);
```

---

**🎉 Setup Complete!** Your JholaBazar app now has professional Firebase push notifications!

**Last Updated:** November 18, 2024  
**Version:** 1.0.0  
**Tested On:** React Native 0.82.1, Android API 36