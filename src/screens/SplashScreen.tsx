import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  StatusBar,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import { useTheme } from '../hooks/useTheme';
import { RootState } from '../store/store';

export default function SplashScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { isLoggedIn } = useSelector((state: RootState) => state.user);
  
  const [logoOpacity] = useState(new Animated.Value(0));
  const [nameOpacity] = useState(new Animated.Value(0));
  const [messageOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
    // Logo animation (0-500ms)
    Animated.timing(logoOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Name animation (500-1000ms)
    setTimeout(() => {
      Animated.timing(nameOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 500);

    // Message animation (1000-1500ms)
    setTimeout(() => {
      Animated.timing(messageOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 1000);

    // Navigate after all animations (2500ms total)
    const timer = setTimeout(() => {
      if (isLoggedIn) {
        navigation.replace('MainTabs');
      } else {
        navigation.replace('Login');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation, isLoggedIn, logoOpacity, nameOpacity, messageOpacity]);

  return (
    <View style={[styles.container, { backgroundColor: '#ffffff' }]}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      
      <View style={styles.logoContainer}>
        <Animated.Image
          source={require('../../assets/images/jhola-bazar.png')}
          style={[styles.logo, { opacity: logoOpacity }]}
          resizeMode="contain"
        />
        <Animated.Text style={[styles.appName, { opacity: nameOpacity }]}>Jhola Bazar</Animated.Text>
        <Animated.Text style={[styles.tagline, { opacity: messageOpacity }]}>Khoshiyon Ka Jhola Aab Aapke Ghar</Animated.Text>
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
  logoContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 24,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00B761',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },

});