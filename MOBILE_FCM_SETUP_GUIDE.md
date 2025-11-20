# 📱 Mobile App FCM Setup Guide - Complete Integration

**Project:** JholaBazar Grocery Delivery Platform  
**Backend Status:** ✅ Ready  
**Purpose:** Complete guide for integrating Firebase Cloud Messaging in mobile apps

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Project Setup](#firebase-project-setup)
3. [Android Integration](#android-integration)
4. [iOS Integration](#ios-integration)
5. [React Native Integration](#react-native-integration)
6. [Flutter Integration](#flutter-integration)
7. [Testing Notifications](#testing-notifications)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Prerequisites

### What You Need
- ✅ Firebase project created (Project ID: `jholabazarcom`)
- ✅ Backend FCM service running
- ✅ Android Studio / Xcode installed
- ✅ Node.js (for React Native)
- ✅ CocoaPods (for iOS)

### Backend API Endpoints
```
POST /api/v1/notifications/push-token     - Save FCM token
DELETE /api/v1/notifications/push-token   - Remove FCM token
GET /api/v1/notifications                 - Get user notifications
```

---

## 🔥 Firebase Project Setup

### Step 1: Access Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **jholabazarcom**
3. Navigate to **Project Settings** (⚙️ icon)

### Step 2: Download Configuration Files

#### For Android:
1. Click **"Add app"** or select Android icon
2. Enter package name (e.g., `com.jholabazar.grocery`)
3. Enter app nickname: `JholaBazar Grocery`
4. (Optional) Add SHA-1 certificate fingerprint
5. Click **"Register app"**
6. Download **`google-services.json`**

#### For iOS:
1. Click **"Add app"** or select iOS icon
2. Enter bundle ID (e.g., `com.jholabazar.grocery`)
3. Enter app nickname: `JholaBazar Grocery`
4. (Optional) Add App Store ID
5. Click **"Register app"**
6. Download **`GoogleService-Info.plist`**

---

## 🤖 Android Integration (Native)

### Step 1: Add Firebase Configuration

**File:** `android/build.gradle` (Project level)
```gradle
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.1.0'
        classpath 'com.google.gms:google-services:4.4.0'  // Add this
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
```

**File:** `android/app/build.gradle` (App level)
```gradle
plugins {
    id 'com.android.application'
    id 'com.google.gms.google-services'  // Add this
}

android {
    compileSdk 34
    
    defaultConfig {
        applicationId "com.jholabazar.grocery"
        minSdk 21
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }
}

dependencies {
    // Firebase BoM (Bill of Materials)
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    
    // Firebase Cloud Messaging
    implementation 'com.google.firebase:firebase-messaging'
    
    // Firebase Analytics (optional but recommended)
    implementation 'com.google.firebase:firebase-analytics'
    
    // Other dependencies...
}
```

### Step 2: Add google-services.json

1. Copy downloaded `google-services.json`
2. Paste to: `android/app/google-services.json`

**Verify structure:**
```
android/
├── app/
│   ├── google-services.json  ← Here
│   ├── build.gradle
│   └── src/
└── build.gradle
```

### Step 3: Create Firebase Messaging Service

**File:** `android/app/src/main/java/com/jholabazar/grocery/FCMService.java`
```java
package com.jholabazar.grocery;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class FCMService extends FirebaseMessagingService {
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
        
        // Send token to backend server
        sendTokenToServer(token);
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
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(title)
                .setContentText(body)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pendingIntent);

        // Add image if available
        if (imageUrl != null && !imageUrl.isEmpty()) {
            // Load image using Glide/Picasso and set as big picture
            // notificationBuilder.setStyle(new NotificationCompat.BigPictureStyle()...);
        }

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
        // Handle silent notifications or data-only messages
        String type = data.get("type");
        
        switch (type) {
            case "ORDER_UPDATE":
                String orderId = data.get("orderId");
                // Update local database or trigger UI refresh
                break;
            case "NEW_MESSAGE":
                // Handle chat message
                break;
            default:
                Log.d(TAG, "Unknown data type: " + type);
        }
    }

    private void sendTokenToServer(String token) {
        // TODO: Implement API call to save token
        // POST /api/v1/notifications/push-token
        // Body: { "fcmToken": token }
        
        // Example using Retrofit/OkHttp:
        // ApiClient.getInstance().saveFCMToken(token);
    }
}
```

### Step 4: Register Service in AndroidManifest.xml

**File:** `android/app/src/main/AndroidManifest.xml`
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.jholabazar.grocery">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    
    <application
        android:name=".MainApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/AppTheme">

        <!-- Main Activity -->
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Firebase Messaging Service -->
        <service
            android:name=".FCMService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service>

        <!-- Set custom default icon (optional) -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_icon"
            android:resource="@drawable/ic_notification" />
        
        <!-- Set notification color (optional) -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_color"
            android:resource="@color/colorPrimary" />
        
        <!-- Set default notification channel (Android 8.0+) -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="jholabazar_notifications" />

    </application>
</manifest>
```

### Step 5: Get and Save FCM Token

**File:** `MainActivity.java` or your main activity
```java
package com.jholabazar.grocery;

import android.os.Bundle;
import android.util.Log;
import androidx.appcompat.app.AppCompatActivity;
import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends AppCompatActivity {
    private static final String TAG = "MainActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Get FCM token
        getFCMToken();
    }

    private void getFCMToken() {
        FirebaseMessaging.getInstance().getToken()
            .addOnCompleteListener(task -> {
                if (!task.isSuccessful()) {
                    Log.w(TAG, "Fetching FCM token failed", task.getException());
                    return;
                }

                // Get new FCM token
                String token = task.getResult();
                Log.d(TAG, "FCM Token: " + token);

                // Send token to backend
                saveFCMTokenToBackend(token);
            });
    }

    private void saveFCMTokenToBackend(String token) {
        // TODO: Call your API
        // POST /api/v1/notifications/push-token
        // Headers: Authorization: Bearer {accessToken}
        // Body: { "fcmToken": token }
    }
}
```

### Step 6: Request Notification Permission (Android 13+)

**File:** `MainActivity.java`
```java
import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.ContextCompat;

public class MainActivity extends AppCompatActivity {
    
    private final ActivityResultLauncher<String> requestPermissionLauncher =
        registerForActivityResult(new ActivityResultContracts.RequestPermission(), isGranted -> {
            if (isGranted) {
                Log.d(TAG, "Notification permission granted");
                getFCMToken();
            } else {
                Log.d(TAG, "Notification permission denied");
            }
        });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        requestNotificationPermission();
    }

    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    == PackageManager.PERMISSION_GRANTED) {
                getFCMToken();
            } else {
                requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS);
            }
        } else {
            getFCMToken();
        }
    }
}
```

---

## 🍎 iOS Integration (Native)

### Step 1: Add Firebase Configuration

**File:** `ios/Podfile`
```ruby
# Uncomment the next line to define a global platform for your project
platform :ios, '13.0'

target 'JholaBazarGrocery' do
  # Comment the next line if you don't want to use dynamic frameworks
  use_frameworks!

  # Firebase pods
  pod 'Firebase/Core'
  pod 'Firebase/Messaging'
  pod 'Firebase/Analytics'

  # Other pods...
end

post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '13.0'
    end
  end
end
```

### Step 2: Install Dependencies

```bash
cd ios
pod install
cd ..
```

### Step 3: Add GoogleService-Info.plist

1. Open `ios/JholaBazarGrocery.xcworkspace` in Xcode
2. Drag `GoogleService-Info.plist` into project navigator
3. Ensure "Copy items if needed" is checked
4. Select your app target

**Verify structure:**
```
ios/
├── JholaBazarGrocery/
│   ├── GoogleService-Info.plist  ← Here
│   ├── Info.plist
│   └── AppDelegate.swift
└── Podfile
```

### Step 4: Initialize Firebase in AppDelegate

**File (Swift):** `ios/JholaBazarGrocery/AppDelegate.swift`
```swift
import UIKit
import Firebase
import UserNotifications

@main
class AppDelegate: UIResponder, UIApplicationDelegate, 
                   UNUserNotificationCenterDelegate, 
                   MessagingDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: 
                     [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        // Initialize Firebase
        FirebaseApp.configure()
        
        // Set up notifications
        setupNotifications(application)
        
        // Set FCM messaging delegate
        Messaging.messaging().delegate = self
        
        return true
    }

    func setupNotifications(_ application: UIApplication) {
        // Request notification permissions
        UNUserNotificationCenter.current().delegate = self
        
        let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
        UNUserNotificationCenter.current().requestAuthorization(
            options: authOptions,
            completionHandler: { granted, error in
                if granted {
                    print("Notification permission granted")
                    DispatchQueue.main.async {
                        application.registerForRemoteNotifications()
                    }
                } else {
                    print("Notification permission denied")
                }
            }
        )
    }

    // MARK: - FCM Token Handling
    
    func messaging(_ messaging: Messaging, 
                   didReceiveRegistrationToken fcmToken: String?) {
        guard let token = fcmToken else { return }
        
        print("FCM Token: \(token)")
        
        // Send token to backend
        saveFCMTokenToBackend(token)
    }

    func application(_ application: UIApplication,
                     didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        // Pass device token to FCM
        Messaging.messaging().apnsToken = deviceToken
    }

    func application(_ application: UIApplication,
                     didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("Failed to register for remote notifications: \(error)")
    }

    // MARK: - Notification Handling
    
    // Handle notifications when app is in foreground
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: 
                                @escaping (UNNotificationPresentationOptions) -> Void) {
        let userInfo = notification.request.content.userInfo
        
        print("Notification received in foreground: \(userInfo)")
        
        // Show notification even when app is in foreground
        if #available(iOS 14.0, *) {
            completionHandler([[.banner, .sound, .badge]])
        } else {
            completionHandler([[.alert, .sound, .badge]])
        }
    }

    // Handle notification tap
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: 
                                @escaping () -> Void) {
        let userInfo = response.notification.request.content.userInfo
        
        print("Notification tapped: \(userInfo)")
        
        // Handle notification tap
        handleNotificationTap(userInfo)
        
        completionHandler()
    }

    // MARK: - Helper Methods
    
    func saveFCMTokenToBackend(_ token: String) {
        // TODO: Call your API
        // POST /api/v1/notifications/push-token
        // Headers: Authorization: Bearer {accessToken}
        // Body: { "fcmToken": token }
        
        guard let url = URL(string: "https://api.jholabazar.com/api/v1/notifications/push-token") else {
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer YOUR_ACCESS_TOKEN", forHTTPHeaderField: "Authorization")
        
        let body: [String: Any] = ["fcmToken": token]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("Error saving FCM token: \(error)")
                return
            }
            print("FCM token saved successfully")
        }.resume()
    }

    func handleNotificationTap(_ userInfo: [AnyHashable: Any]) {
        // Navigate to appropriate screen based on notification data
        if let type = userInfo["type"] as? String {
            switch type {
            case "ORDER_UPDATE":
                if let orderId = userInfo["orderId"] as? String {
                    // Navigate to order details screen
                    print("Navigate to order: \(orderId)")
                }
            case "NEW_MESSAGE":
                // Navigate to messages screen
                print("Navigate to messages")
            default:
                break
            }
        }
    }
}
```

**File (Objective-C):** `ios/JholaBazarGrocery/AppDelegate.m`
```objectivec
#import "AppDelegate.h"
#import <Firebase.h>
#import <UserNotifications/UserNotifications.h>

@import Firebase;

@interface AppDelegate () <UNUserNotificationCenterDelegate, FIRMessagingDelegate>
@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application 
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    
    // Initialize Firebase
    [FIRApp configure];
    
    // Set up notifications
    [self setupNotifications:application];
    
    // Set FCM messaging delegate
    [FIRMessaging messaging].delegate = self;
    
    return YES;
}

- (void)setupNotifications:(UIApplication *)application {
    [UNUserNotificationCenter currentNotificationCenter].delegate = self;
    
    UNAuthorizationOptions authOptions = 
        UNAuthorizationOptionAlert | 
        UNAuthorizationOptionSound | 
        UNAuthorizationOptionBadge;
    
    [[UNUserNotificationCenter currentNotificationCenter]
        requestAuthorizationWithOptions:authOptions
        completionHandler:^(BOOL granted, NSError * _Nullable error) {
            if (granted) {
                NSLog(@"Notification permission granted");
                dispatch_async(dispatch_get_main_queue(), ^{
                    [application registerForRemoteNotifications];
                });
            } else {
                NSLog(@"Notification permission denied");
            }
        }];
}

- (void)messaging:(FIRMessaging *)messaging 
    didReceiveRegistrationToken:(NSString *)fcmToken {
    NSLog(@"FCM Token: %@", fcmToken);
    
    // Send token to backend
    [self saveFCMTokenToBackend:fcmToken];
}

- (void)application:(UIApplication *)application
    didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
    [FIRMessaging messaging].APNSToken = deviceToken;
}

// ... Additional notification handling methods

@end
```

### Step 5: Enable Push Notifications Capability

1. Open Xcode workspace: `ios/JholaBazarGrocery.xcworkspace`
2. Select your project in navigator
3. Select your target
4. Go to **"Signing & Capabilities"** tab
5. Click **"+ Capability"**
6. Add **"Push Notifications"**
7. Add **"Background Modes"**
   - Check: "Remote notifications"

### Step 6: Configure APNs Authentication

#### Option 1: APNs Authentication Key (Recommended)

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Certificates, Identifiers & Profiles → Keys
3. Create new key with **"Apple Push Notifications service (APNs)"**
4. Download `.p8` file
5. In Firebase Console:
   - Go to Project Settings → Cloud Messaging
   - Upload APNs Authentication Key
   - Enter Key ID and Team ID

#### Option 2: APNs Certificate

1. Create CSR in Keychain Access
2. Create APNs certificate in Apple Developer Portal
3. Download and install certificate
4. Export as `.p12` file
5. Upload to Firebase Console

---

## ⚛️ React Native Integration

### Step 1: Install Dependencies

```bash
# Install React Native Firebase
npm install @react-native-firebase/app
npm install @react-native-firebase/messaging

# For iOS, install pods
cd ios
pod install
cd ..
```

### Step 2: Add Configuration Files

**Android:** Add `google-services.json` to `android/app/`

**iOS:** Add `GoogleService-Info.plist` to iOS project via Xcode

### Step 3: Configure Android

**File:** `android/build.gradle`
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

**File:** `android/app/build.gradle`
```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
}
```

### Step 4: Configure iOS

**File:** `ios/Podfile`
```ruby
platform :ios, '13.0'
use_frameworks!

target 'JholaBazarGrocery' do
  # Already includes Firebase via @react-native-firebase
  # No additional pods needed
end
```

**File:** `ios/JholaBazarGrocery/AppDelegate.mm`
```objectivec
#import <Firebase.h>

- (BOOL)application:(UIApplication *)application 
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    
    if ([FIRApp defaultApp] == nil) {
        [FIRApp configure];
    }
    
    return YES;
}
```

### Step 5: Request Permissions and Get Token

**File:** `App.js` or `src/App.tsx`
```javascript
import React, { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import axios from 'axios';

const API_BASE_URL = 'https://api.jholabazar.com/api/v1';

const App = () => {
    useEffect(() => {
        requestUserPermission();
        setupNotificationListeners();
    }, []);

    // Request notification permission
    const requestUserPermission = async () => {
        if (Platform.OS === 'android' && Platform.Version >= 33) {
            // Android 13+ requires explicit permission
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
            );
            
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                console.log('Notification permission granted');
                getFCMToken();
            } else {
                console.log('Notification permission denied');
            }
        } else if (Platform.OS === 'ios') {
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                console.log('iOS notification permission:', authStatus);
                getFCMToken();
            }
        } else {
            // Android < 13
            getFCMToken();
        }
    };

    // Get FCM token
    const getFCMToken = async () => {
        try {
            const fcmToken = await messaging().getToken();
            console.log('FCM Token:', fcmToken);
            
            // Save token to backend
            await saveFCMTokenToBackend(fcmToken);
        } catch (error) {
            console.error('Error getting FCM token:', error);
        }
    };

    // Save token to backend
    const saveFCMTokenToBackend = async (token) => {
        try {
            const accessToken = 'YOUR_USER_ACCESS_TOKEN'; // Get from auth state
            
            const response = await axios.post(
                `${API_BASE_URL}/notifications/push-token`,
                { fcmToken: token },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('FCM token saved:', response.data);
        } catch (error) {
            console.error('Error saving FCM token:', error);
        }
    };

    // Setup notification listeners
    const setupNotificationListeners = () => {
        // Handle token refresh
        messaging().onTokenRefresh(token => {
            console.log('Token refreshed:', token);
            saveFCMTokenToBackend(token);
        });

        // Handle foreground notifications
        messaging().onMessage(async remoteMessage => {
            console.log('Foreground notification:', remoteMessage);
            
            Alert.alert(
                remoteMessage.notification?.title || 'Notification',
                remoteMessage.notification?.body || '',
                [{ text: 'OK' }]
            );
        });

        // Handle background/quit state notifications
        messaging().setBackgroundMessageHandler(async remoteMessage => {
            console.log('Background notification:', remoteMessage);
        });

        // Handle notification tap (app opened from quit state)
        messaging().getInitialNotification().then(remoteMessage => {
            if (remoteMessage) {
                console.log('App opened from notification:', remoteMessage);
                handleNotificationTap(remoteMessage.data);
            }
        });

        // Handle notification tap (app in background)
        messaging().onNotificationOpenedApp(remoteMessage => {
            console.log('Notification opened app:', remoteMessage);
            handleNotificationTap(remoteMessage.data);
        });
    };

    // Handle notification tap
    const handleNotificationTap = (data) => {
        if (!data) return;

        const { type, orderId, screen } = data;

        switch (type) {
            case 'ORDER_CONFIRMED':
            case 'ORDER_DISPATCHED':
            case 'ORDER_DELIVERED':
                // Navigate to order details
                // navigation.navigate('OrderDetails', { orderId });
                console.log('Navigate to order:', orderId);
                break;
            case 'PROMOTIONAL':
                // Navigate to promotions
                // navigation.navigate('Promotions');
                console.log('Navigate to promotions');
                break;
            default:
                console.log('Unknown notification type:', type);
        }
    };

    return (
        // Your app UI
        <View>
            {/* ... */}
        </View>
    );
};

export default App;
```

### Step 6: Handle Logout (Remove Token)

```javascript
import messaging from '@react-native-firebase/messaging';
import axios from 'axios';

const handleLogout = async () => {
    try {
        const accessToken = 'YOUR_USER_ACCESS_TOKEN';
        
        // Delete token from backend
        await axios.delete(
            `${API_BASE_URL}/notifications/push-token`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );
        
        // Delete FCM token locally
        await messaging().deleteToken();
        
        console.log('FCM token removed');
        
        // Clear user session and navigate to login
    } catch (error) {
        console.error('Error removing FCM token:', error);
    }
};
```

### Step 7: Configure Notification Channels (Android)

```javascript
import notifee, { AndroidImportance } from '@notifee/react-native';

const createNotificationChannels = async () => {
    await notifee.createChannel({
        id: 'orders',
        name: 'Order Updates',
        importance: AndroidImportance.HIGH,
        sound: 'default',
    });

    await notifee.createChannel({
        id: 'delivery',
        name: 'Delivery Alerts',
        importance: AndroidImportance.HIGH,
        sound: 'default',
    });

    await notifee.createChannel({
        id: 'promotions',
        name: 'Promotions',
        importance: AndroidImportance.DEFAULT,
    });
};

// Call in App initialization
useEffect(() => {
    if (Platform.OS === 'android') {
        createNotificationChannels();
    }
}, []);
```

---

## 🦋 Flutter Integration

### Step 1: Add Dependencies

**File:** `pubspec.yaml`
```yaml
dependencies:
  flutter:
    sdk: flutter
  firebase_core: ^2.24.2
  firebase_messaging: ^14.7.9
  flutter_local_notifications: ^16.3.0
  http: ^1.1.0
```

```bash
flutter pub get
```

### Step 2: Configure Android

**File:** `android/build.gradle`
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

**File:** `android/app/build.gradle`
```gradle
apply plugin: 'com.google.gms.google-services'

android {
    compileSdk 34
    defaultConfig {
        minSdkVersion 21
        targetSdkVersion 34
    }
}
```

Add `google-services.json` to `android/app/`

### Step 3: Configure iOS

Add `GoogleService-Info.plist` to `ios/Runner/`

**File:** `ios/Runner/Info.plist`
```xml
<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
    <string>remote-notification</string>
</array>
```

### Step 4: Initialize Firebase and FCM

**File:** `lib/main.dart`
```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

// Background message handler
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('Background message: ${message.messageId}');
}

// Main function
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Firebase.initializeApp();
  
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  
  runApp(MyApp());
}

class MyApp extends StatefulWidget {
  @override
  _MyAppState createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = 
      FlutterLocalNotificationsPlugin();

  @override
  void initState() {
    super.initState();
    _initializeNotifications();
  }

  Future<void> _initializeNotifications() async {
    // Request permission
    NotificationSettings settings = await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('Notification permission granted');
      
      // Get FCM token
      String? token = await _firebaseMessaging.getToken();
      print('FCM Token: $token');
      
      if (token != null) {
        await _saveFCMTokenToBackend(token);
      }
    }

    // Initialize local notifications (Android)
    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    
    const DarwinInitializationSettings iosSettings =
        DarwinInitializationSettings();
    
    const InitializationSettings initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );
    
    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTap,
    );

    // Listen for token refresh
    _firebaseMessaging.onTokenRefresh.listen((newToken) {
      print('Token refreshed: $newToken');
      _saveFCMTokenToBackend(newToken);
    });

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Foreground message: ${message.notification?.title}');
      _showLocalNotification(message);
    });

    // Handle notification tap (app in background)
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print('Notification opened app: ${message.data}');
      _handleNotificationTap(message.data);
    });

    // Handle notification tap (app from terminated)
    RemoteMessage? initialMessage = 
        await _firebaseMessaging.getInitialNotification();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage.data);
    }
  }

  Future<void> _saveFCMTokenToBackend(String token) async {
    const String apiUrl = 
        'https://api.jholabazar.com/api/v1/notifications/push-token';
    const String accessToken = 'YOUR_ACCESS_TOKEN'; // Get from auth state

    try {
      final response = await http.post(
        Uri.parse(apiUrl),
        headers: {
          'Authorization': 'Bearer $accessToken',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({'fcmToken': token}),
      );

      if (response.statusCode == 200) {
        print('FCM token saved successfully');
      } else {
        print('Failed to save FCM token: ${response.statusCode}');
      }
    } catch (e) {
      print('Error saving FCM token: $e');
    }
  }

  Future<void> _showLocalNotification(RemoteMessage message) async {
    const AndroidNotificationDetails androidDetails =
        AndroidNotificationDetails(
      'jholabazar_notifications',
      'JholaBazar Notifications',
      channelDescription: 'Order updates and delivery alerts',
      importance: Importance.high,
      priority: Priority.high,
    );

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails();

    const NotificationDetails notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      message.hashCode,
      message.notification?.title ?? 'Notification',
      message.notification?.body ?? '',
      notificationDetails,
      payload: jsonEncode(message.data),
    );
  }

  void _onNotificationTap(NotificationResponse response) {
    if (response.payload != null) {
      final Map<String, dynamic> data = jsonDecode(response.payload!);
      _handleNotificationTap(data);
    }
  }

  void _handleNotificationTap(Map<String, dynamic> data) {
    final String? type = data['type'];
    final String? orderId = data['orderId'];

    switch (type) {
      case 'ORDER_CONFIRMED':
      case 'ORDER_DISPATCHED':
      case 'ORDER_DELIVERED':
        // Navigate to order details
        // Navigator.pushNamed(context, '/order-details', arguments: orderId);
        print('Navigate to order: $orderId');
        break;
      case 'PROMOTIONAL':
        // Navigate to promotions
        print('Navigate to promotions');
        break;
      default:
        print('Unknown notification type: $type');
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'JholaBazar',
      home: HomeScreen(),
    );
  }
}
```

---

## 🧪 Testing Notifications

### Test 1: Send Test Notification from Firebase Console

1. Go to Firebase Console → Cloud Messaging
2. Click **"Send your first message"**
3. Enter notification title and text
4. Click **"Send test message"**
5. Add your FCM token
6. Click **"Test"**

### Test 2: Test via Backend API

```bash
# Get FCM token from device logs
# Then call your backend API

curl -X POST https://api.jholabazar.com/api/v1/notifications/push/send \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "user-id",
    "recipientType": "CUSTOMER",
    "title": "Test Notification",
    "body": "This is a test notification from backend",
    "data": {
      "type": "TEST",
      "screen": "Home"
    }
  }'
```

### Test 3: Test Order Notification

```bash
# Simulate order status change
curl -X POST https://api.jholabazar.com/api/v1/notifications/push/order \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "user-id",
    "recipientType": "CUSTOMER",
    "orderData": {
      "id": "order-123",
      "orderNumber": "JB-2024-001",
      "total": 599,
      "estimatedDelivery": "15 minutes"
    },
    "notificationType": "ORDER_CONFIRMED"
  }'
```

### Test Scenarios

1. **App in Foreground** ✅
   - Should display notification immediately
   - Should trigger onMessage listener

2. **App in Background** ✅
   - Should show notification in system tray
   - Tap should open app and trigger onMessageOpenedApp

3. **App Terminated** ✅
   - Should show notification in system tray
   - Tap should open app and trigger getInitialNotification

4. **Token Refresh** ✅
   - Should update backend with new token

5. **Permission Denied** ✅
   - Should handle gracefully

---

## 🔧 Troubleshooting

### Android Issues

**Problem:** Notifications not received
```
Solutions:
1. Check google-services.json is in android/app/
2. Verify package name matches Firebase console
3. Check internet permission in AndroidManifest.xml
4. Ensure notification channel is created (Android 8.0+)
5. Check battery optimization settings
6. Verify FCM token is saved to backend
```

**Problem:** Build fails with Google Services error
```
Solutions:
1. Update google-services plugin version
2. Clean and rebuild: ./gradlew clean && ./gradlew build
3. Check gradle version compatibility
```

### iOS Issues

**Problem:** Notifications not received
```
Solutions:
1. Check GoogleService-Info.plist is added to Xcode project
2. Verify bundle ID matches Firebase console
3. Enable Push Notifications capability
4. Configure APNs in Firebase Console
5. Check notification permission is granted
6. Test on physical device (not simulator)
```

**Problem:** Token not generated
```
Solutions:
1. Ensure APNs certificate/key is uploaded to Firebase
2. Check device has internet connection
3. Verify app is signed with correct provisioning profile
4. Request permission before getting token
```

### React Native Issues

**Problem:** @react-native-firebase not linking
```
Solutions:
1. Rebuild app: npx react-native run-android/ios
2. iOS: cd ios && pod install && cd ..
3. Clear cache: npx react-native start --reset-cache
4. Clean build folders
```

**Problem:** onMessage not triggering
```
Solutions:
1. Check Firebase is initialized before listeners
2. Verify messaging().requestPermission() is called
3. Check notification is sent with correct priority
```

### General Issues

**Problem:** Token saved but notifications not received
```
Solutions:
1. Verify token is valid (not expired/deleted)
2. Check backend is sending to correct token
3. Verify notification payload format
4. Check Firebase project ID matches
5. Review Firebase Console logs
```

**Problem:** Notifications work in dev but not production
```
Solutions:
1. Use production APNs certificate (iOS)
2. Verify production google-services.json (Android)
3. Check environment-specific configuration
4. Test with production Firebase project
```

---

## 📚 Additional Resources

### Documentation
- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase](https://rnfirebase.io/)
- [Flutter Firebase Messaging](https://firebase.flutter.dev/docs/messaging/overview)

### Backend API Reference
- Endpoint: `/api/v1/notifications/push-token`
- Swagger: `https://api.jholabazar.com/api-docs`
- Guide: `FIREBASE_FCM_MIGRATION_GUIDE.md`

### Testing Tools
- Firebase Console: https://console.firebase.google.com/
- Postman Collection: Available in `/docs/api/`
- Test Script: `test-fcm-notifications.js`

---

## ✅ Integration Checklist

### Android
- [ ] Add google-services.json
- [ ] Update build.gradle files
- [ ] Create FCMService class
- [ ] Register service in AndroidManifest.xml
- [ ] Request notification permission (Android 13+)
- [ ] Create notification channels
- [ ] Get and save FCM token
- [ ] Test foreground notifications
- [ ] Test background notifications
- [ ] Test notification tap handling

### iOS
- [ ] Add GoogleService-Info.plist
- [ ] Update Podfile
- [ ] Initialize Firebase in AppDelegate
- [ ] Request notification permission
- [ ] Enable Push Notifications capability
- [ ] Configure APNs in Firebase Console
- [ ] Get and save FCM token
- [ ] Test foreground notifications
- [ ] Test background notifications
- [ ] Test notification tap handling

### React Native
- [ ] Install @react-native-firebase packages
- [ ] Add configuration files
- [ ] Configure Android/iOS projects
- [ ] Request permissions
- [ ] Setup notification listeners
- [ ] Save token to backend
- [ ] Handle token refresh
- [ ] Implement notification tap navigation
- [ ] Test all notification scenarios
- [ ] Handle logout (remove token)

### Flutter
- [ ] Add firebase_core & firebase_messaging
- [ ] Add configuration files
- [ ] Initialize Firebase
- [ ] Setup local notifications
- [ ] Request permissions
- [ ] Setup message listeners
- [ ] Save token to backend
- [ ] Handle notification taps
- [ ] Test all scenarios

---

**Last Updated:** November 18, 2025  
**Backend Version:** v1.0.0  
**Compatible With:** Android 5.0+, iOS 13.0+  
**Support:** See `FIREBASE_FCM_MIGRATION_GUIDE.md` for backend integration

🎉 **Ready to go!** Your backend FCM service is fully configured and waiting for mobile apps to connect!
