/**
 * Test FCM Notification
 * This will send a test notification to your device
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need the service account key)
const serviceAccount = {
  "type": "service_account",
  "project_id": "jholabazarcom",
  "private_key_id": "YOUR_PRIVATE_KEY_ID",
  "private_key": "YOUR_PRIVATE_KEY",
  "client_email": "firebase-adminsdk-xxxxx@jholabazarcom.iam.gserviceaccount.com",
  "client_id": "YOUR_CLIENT_ID",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs"
};

// Replace with your FCM token from console logs
const FCM_TOKEN = "YOUR_FCM_TOKEN_FROM_CONSOLE";

async function sendTestNotification() {
  try {
    // Initialize Firebase Admin
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    const message = {
      notification: {
        title: '🎉 Order Confirmed!',
        body: 'Your order #JB-2024-001 has been confirmed and is being prepared.',
      },
      data: {
        type: 'ORDER_CONFIRMED',
        orderId: 'order-123',
        screen: 'OrderDetails'
      },
      token: FCM_TOKEN
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Test notification sent successfully:', response);
  } catch (error) {
    console.error('❌ Error sending test notification:', error);
  }
}

// For testing without Firebase Admin SDK
async function sendViaFirebaseAPI() {
  const SERVER_KEY = "YOUR_SERVER_KEY"; // Get from Firebase Console > Project Settings > Cloud Messaging
  
  const message = {
    to: FCM_TOKEN,
    notification: {
      title: "🎉 Order Confirmed!",
      body: "Your order #JB-2024-001 has been confirmed and is being prepared.",
      icon: "ic_notification",
      sound: "default"
    },
    data: {
      type: "ORDER_CONFIRMED",
      orderId: "order-123",
      screen: "OrderDetails"
    }
  };

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${SERVER_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    const result = await response.json();
    console.log('✅ Notification sent via API:', result);
  } catch (error) {
    console.error('❌ Error sending notification via API:', error);
  }
}

console.log('🔥 FCM Test Notification Script');
console.log('1. Check your console logs for FCM Token');
console.log('2. Replace FCM_TOKEN in this script');
console.log('3. Get Server Key from Firebase Console');
console.log('4. Run: node test-notification.js');

// Uncomment to test
// sendViaFirebaseAPI();