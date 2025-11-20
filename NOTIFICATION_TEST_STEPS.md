# 🔔 Test Your FCM Notifications

## Step 1: Get Your FCM Token
1. Open your app
2. Check console logs for: `FCM Token: ey...`
3. Copy the token

## Step 2: Test via Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **jholabazarcom**
3. Go to **Messaging** → **Send your first message**
4. Fill in:
   - **Notification title**: `🎉 Order Confirmed!`
   - **Notification text**: `Your order has been confirmed and is being prepared.`
5. Click **Send test message**
6. Paste your FCM token
7. Click **Test**

## Step 3: Test Order Notification
Send this payload via Firebase Console or your backend:

```json
{
  "notification": {
    "title": "🎉 Order Confirmed!",
    "body": "Your order #JB-2024-001 has been confirmed and is being prepared."
  },
  "data": {
    "type": "ORDER_CONFIRMED",
    "orderId": "order-123",
    "screen": "OrderDetails"
  }
}
```

## Step 4: Backend Integration
Your backend should call this when order is placed:

```javascript
// In your order service
async function sendOrderConfirmationNotification(userId, orderData) {
  const fcmToken = await getUserFCMToken(userId);
  
  const message = {
    notification: {
      title: "🎉 Order Confirmed!",
      body: `Your order #${orderData.orderNumber} has been confirmed.`
    },
    data: {
      type: "ORDER_CONFIRMED",
      orderId: orderData.id,
      screen: "OrderDetails"
    },
    token: fcmToken
  };
  
  await admin.messaging().send(message);
}
```

## Expected Results:
- **App in foreground**: Alert popup
- **App in background**: System notification
- **App closed**: System notification
- **Tap notification**: Opens OrderDetails screen

## Troubleshooting:
1. **No notification**: Check FCM token is saved to backend
2. **Token not found**: Check console logs for errors
3. **Permission denied**: Re-request notification permission
4. **Backend not sending**: Check your order placement API