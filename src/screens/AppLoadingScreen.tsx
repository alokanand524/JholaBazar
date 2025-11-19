import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import { useTheme } from '../hooks/useTheme';
import { RootState } from '../store/store';

const loadingMessages = [
  "Fresh groceries at your doorstep...",
  "Finding the best deals for you...",
  "Preparing your shopping experience...",
  "Loading fresh vegetables and fruits...",
  "Getting ready to serve you...",
  "Connecting to local stores...",
  "Organizing your favorite items...",
  "Setting up fast delivery...",
];

export default function AppLoadingScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { isLoggedIn } = useSelector((state: RootState) => state.user);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Set random message
    const randomMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
    setMessage(randomMessage);

    const timer = setTimeout(() => {
      if (isLoggedIn) {
        navigation.replace('MainTabs');
      } else {
        navigation.replace('Login');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation, isLoggedIn]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.message, { color: colors.text }]}>
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 40,
  },
});