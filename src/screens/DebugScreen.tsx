import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { useTheme } from '../hooks/useTheme';

export default function DebugScreen() {
  const { colors } = useTheme();
  const [fcmToken, setFcmToken] = useState('Loading...');

  useEffect(() => {
    getFCMToken();
  }, []);

  const getFCMToken = async () => {
    try {
      const token = await messaging().getToken();
      setFcmToken(token || 'No token found');
    } catch (error) {
      setFcmToken('Error getting token');
    }
  };

  const copyToken = () => {
    Alert.alert('FCM Token', fcmToken, [
      { text: 'OK' }
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>FCM Debug</Text>
      
      <TouchableOpacity 
        style={[styles.tokenContainer, { backgroundColor: colors.card }]}
        onPress={copyToken}
      >
        <Text style={[styles.label, { color: colors.text }]}>FCM Token:</Text>
        <Text style={[styles.token, { color: colors.primary }]} numberOfLines={3}>
          {fcmToken}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={getFCMToken}
      >
        <Text style={styles.buttonText}>Refresh Token</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  tokenContainer: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  token: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});