/**
 * Test FCM Android Setup
 * Run this after installing packages: node test-fcm-android.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔥 Testing Firebase FCM Android Setup...\n');

// Test 1: Check if Firebase packages are installed
console.log('1. Checking Firebase packages...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const hasFirebaseApp = packageJson.dependencies['@react-native-firebase/app'];
  const hasFirebaseMessaging = packageJson.dependencies['@react-native-firebase/messaging'];
  
  if (hasFirebaseApp && hasFirebaseMessaging) {
    console.log('   ✅ Firebase packages installed');
    console.log(`   - @react-native-firebase/app: ${hasFirebaseApp}`);
    console.log(`   - @react-native-firebase/messaging: ${hasFirebaseMessaging}`);
  } else {
    console.log('   ❌ Firebase packages missing');
    console.log('   Run: npm install @react-native-firebase/app @react-native-firebase/messaging');
  }
} catch (error) {
  console.log('   ❌ Error reading package.json');
}

// Test 2: Check google-services.json
console.log('\n2. Checking google-services.json...');
const googleServicesPath = 'android/app/google-services.json';
if (fs.existsSync(googleServicesPath)) {
  try {
    const googleServices = JSON.parse(fs.readFileSync(googleServicesPath, 'utf8'));
    console.log('   ✅ google-services.json found');
    console.log(`   - Project ID: ${googleServices.project_info.project_id}`);
    console.log(`   - Package Name: ${googleServices.client[0].client_info.android_client_info.package_name}`);
  } catch (error) {
    console.log('   ❌ Invalid google-services.json format');
  }
} else {
  console.log('   ❌ google-services.json not found');
  console.log('   Add it to: android/app/google-services.json');
}

// Test 3: Check Android build.gradle
console.log('\n3. Checking Android build configuration...');
try {
  const appBuildGradle = fs.readFileSync('android/app/build.gradle', 'utf8');
  const projectBuildGradle = fs.readFileSync('android/build.gradle', 'utf8');
  
  const hasGoogleServicesPlugin = appBuildGradle.includes('com.google.gms.google-services');
  const hasGoogleServicesClasspath = projectBuildGradle.includes('com.google.gms:google-services');
  const hasFirebaseBom = appBuildGradle.includes('firebase-bom');
  const hasFirebaseMessaging = appBuildGradle.includes('firebase-messaging');
  
  if (hasGoogleServicesPlugin && hasGoogleServicesClasspath) {
    console.log('   ✅ Google Services plugin configured');
  } else {
    console.log('   ❌ Google Services plugin missing');
  }
  
  if (hasFirebaseBom && hasFirebaseMessaging) {
    console.log('   ✅ Firebase dependencies added');
  } else {
    console.log('   ❌ Firebase dependencies missing');
  }
} catch (error) {
  console.log('   ❌ Error reading build.gradle files');
}

// Test 4: Check AndroidManifest.xml
console.log('\n4. Checking AndroidManifest.xml...');
try {
  const manifest = fs.readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
  
  const hasNotificationPermission = manifest.includes('POST_NOTIFICATIONS');
  const hasFirebaseService = manifest.includes('MyFirebaseMessagingService');
  const hasNotificationMetadata = manifest.includes('default_notification_channel_id');
  
  if (hasNotificationPermission) {
    console.log('   ✅ Notification permission added');
  } else {
    console.log('   ❌ POST_NOTIFICATIONS permission missing');
  }
  
  if (hasFirebaseService) {
    console.log('   ✅ Firebase messaging service registered');
  } else {
    console.log('   ❌ Firebase messaging service missing');
  }
  
  if (hasNotificationMetadata) {
    console.log('   ✅ Notification metadata configured');
  } else {
    console.log('   ❌ Notification metadata missing');
  }
} catch (error) {
  console.log('   ❌ Error reading AndroidManifest.xml');
}

// Test 5: Check FCM Service file
console.log('\n5. Checking FCM Service implementation...');
const fcmServicePath = 'android/app/src/main/java/com/jholabazar/MyFirebaseMessagingService.java';
if (fs.existsSync(fcmServicePath)) {
  const fcmService = fs.readFileSync(fcmServicePath, 'utf8');
  
  const hasNotificationChannel = fcmService.includes('createNotificationChannel');
  const hasMessageReceived = fcmService.includes('onMessageReceived');
  const hasTokenRefresh = fcmService.includes('onNewToken');
  
  if (hasNotificationChannel && hasMessageReceived && hasTokenRefresh) {
    console.log('   ✅ FCM Service properly implemented');
  } else {
    console.log('   ❌ FCM Service incomplete');
  }
} else {
  console.log('   ❌ MyFirebaseMessagingService.java not found');
}

// Test 6: Check React Native FCM Service
console.log('\n6. Checking React Native FCM Service...');
const rnFcmServicePath = 'src/services/fcmService.js';
if (fs.existsSync(rnFcmServicePath)) {
  const rnFcmService = fs.readFileSync(rnFcmServicePath, 'utf8');
  
  const hasPermissionRequest = rnFcmService.includes('requestUserPermission');
  const hasTokenHandling = rnFcmService.includes('getFCMToken');
  const hasBackendIntegration = rnFcmService.includes('sendTokenToBackend');
  
  if (hasPermissionRequest && hasTokenHandling && hasBackendIntegration) {
    console.log('   ✅ React Native FCM Service complete');
  } else {
    console.log('   ❌ React Native FCM Service incomplete');
  }
} else {
  console.log('   ❌ fcmService.js not found');
}

console.log('\n🎯 Next Steps:');
console.log('1. Run: npm install');
console.log('2. Run: npx react-native run-android');
console.log('3. Check logs for FCM token');
console.log('4. Test notification from Firebase Console');
console.log('\n✨ Android FCM setup analysis complete!');