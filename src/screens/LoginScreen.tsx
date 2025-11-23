import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Image, ScrollView, KeyboardAvoidingView, Platform, Linking, PermissionsAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Toast } from '../components/Toast';
import { setUser } from '../store/slices/userSlice';
import fcmService from '../services/fcmService';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [autoVerifying, setAutoVerifying] = useState(false);
  const dispatch = useDispatch();
  
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  // Auto OTP verification effect
  useEffect(() => {
    if (showOtp && otp.length === 6) {
      setAutoVerifying(true);
      setTimeout(() => {
        handleVerifyOtp();
      }, 500);
    }
  }, [otp, showOtp]);

  // Request SMS permission for auto-read (Android)
  const requestSMSPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_SMS,
          {
            title: 'SMS Permission',
            message: 'Allow app to read SMS for auto OTP verification',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (error) {
        console.log('SMS permission error:', error);
        return false;
      }
    }
    return true;
  };

  const handleSendOtp = async () => {
    if (phoneNumber.length !== 10) {
      showToast('Please enter a valid 10-digit phone number', 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('https://api.jholabazar.com/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowOtp(true);
        showToast('OTP sent on WhatsApp', 'success');
        // Request SMS permission for auto-read
        requestSMSPermission();
      } else {
        showToast(data.message || 'Failed to send OTP', 'error');
      }
    } catch (error) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      if (!autoVerifying) {
        showToast('Please enter a valid 6-digit OTP', 'error');
      }
      setAutoVerifying(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('https://api.jholabazar.com/api/v1/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, otp }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await AsyncStorage.setItem('authToken', data.data.accessToken);
        await AsyncStorage.setItem('refreshToken', data.data.refreshToken);
        
        const userData = {
          id: data.data.customer.id,
          name: `${data.data.customer.firstName} ${data.data.customer.lastName}`,
          phone: data.data.customer.phone,
          email: data.data.customer.email,
          walletBalance: data.data.customer.walletBalance,
          isVerified: data.data.customer.isVerified,
        };
        
        // Save user profile for persistence
        await AsyncStorage.setItem('userProfile', JSON.stringify(userData));
        
        dispatch(setUser(userData));
        
        // Initialize FCM and send token to backend after successful login
        try {
          await fcmService.initialize();
          await fcmService.sendExistingTokenToBackend();
          console.log('FCM initialized and token sent after OTP verification');
        } catch (error) {
          console.error('FCM initialization error after login:', error);
        }
        
        showToast('Login successful', 'success');
        navigation.navigate('MainTabs');
      } else {
        if (!autoVerifying) {
          showToast(data.message || 'Invalid OTP', 'error');
        }
      }
    } catch (error) {
      if (!autoVerifying) {
        showToast('Network error. Please try again.', 'error');
      }
    } finally {
      setIsLoading(false);
      setAutoVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://api.jholabazar.com/api/v1/auth/otp/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('OTP resent successfully', 'success');
      } else {
        showToast(data.message || 'Failed to resend OTP', 'error');
      }
    } catch (error) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoSection}>
            <Image 
              source={require('../../assets/images/jhola-bazar.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>🛒 Ready to Shop?</Text>
            <Text style={styles.creativeTitle}>Login/Sign up to continue</Text>
            <Text style={styles.subtitle}>Your fresh groceries await!</Text>
          </View>

          {!showOtp ? (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={styles.phoneInput}>
                  <View style={styles.countryCodeBox}>
                    <Text style={styles.flagEmoji}>🇮🇳</Text>
                    <Text style={styles.countryCode}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter phone number"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
              </View>

              <View style={styles.legalSection}>
                <Text style={styles.legalText}>
                  By continuing, you agree to our{' '}
                  <Text 
                    style={styles.linkText}
                    onPress={() => Linking.openURL('https://jholabazar.com/terms')}
                  >
                    Terms & Conditions
                  </Text>
                  {' '}and{' '}
                  <Text 
                    style={styles.linkText}
                    onPress={() => Linking.openURL('https://jholabazar.com/privacy')}
                  >
                    Privacy Policy
                  </Text>
                </Text>
              </View>

              <TouchableOpacity 
                style={[styles.sendOtpButton, isLoading && styles.disabledButton]} 
                onPress={handleSendOtp}
                disabled={isLoading}
              >
                <Text style={[styles.sendOtpText, isLoading && styles.disabledButtonText]}>
                  {isLoading ? 'Sending...' : 'Send OTP'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.skipButton}
                onPress={() => navigation.navigate('MainTabs')}
              >
                <Text style={styles.skipText}>Skip for now</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.otpContainer}>
                <Text style={styles.otpLabel}>Enter OTP</Text>
                <Text style={styles.otpSubtext}>OTP sent to +91 {phoneNumber}</Text>
                <TextInput
                  style={styles.otpInput}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="numeric"
                  maxLength={6}
                  autoComplete="sms-otp"
                  textContentType="oneTimeCode"
                />
              </View>

              <TouchableOpacity 
                style={[styles.verifyButton, (isLoading || autoVerifying) && styles.disabledButton]} 
                onPress={handleVerifyOtp}
                disabled={isLoading || autoVerifying}
              >
                <Text style={[styles.verifyText, (isLoading || autoVerifying) && styles.disabledButtonText]}>
                  {autoVerifying ? 'Auto Verifying...' : isLoading ? 'Verifying...' : 'Verify OTP'}
                </Text>
              </TouchableOpacity>

              <View style={styles.resendSection}>
                <Text style={styles.resendText}>Didn't receive OTP? </Text>
                <TouchableOpacity onPress={handleResendOtp} disabled={isLoading}>
                  <Text style={[styles.resendLink, isLoading && styles.disabledText]}>
                    Resend OTP
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => setShowOtp(false)}>
                <Text style={styles.backText}>Back to login</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fffe' 
  },
  keyboardView: {
    flex: 1,
  },
  content: { 
    flexGrow: 1, 
    padding: 24, 
    justifyContent: 'center',
    minHeight: '100%',
  },
  logoSection: { 
    alignItems: 'center', 
    marginTop: 20, 
    marginBottom: 30 
  },
  logo: { 
    width: 120, 
    height: 120 
  },
  welcomeSection: { 
    alignItems: 'center', 
    marginBottom: 40 
  },
  welcomeText: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#00B761', 
    marginBottom: 8 
  },
  creativeTitle: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: '#333', 
    marginBottom: 8 
  },
  subtitle: { 
    fontSize: 16, 
    color: '#666', 
    textAlign: 'center' 
  },
  inputContainer: { 
    marginBottom: 16 
  },
  inputLabel: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#00B761', 
    marginBottom: 8 
  },
  phoneInput: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 12, 
    backgroundColor: '#fff' 
  },
  countryCodeBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f0f8f0', 
    paddingHorizontal: 12, 
    paddingVertical: 16, 
    borderTopLeftRadius: 12, 
    borderBottomLeftRadius: 12, 
    borderRightWidth: 1, 
    borderRightColor: '#e0e0e0' 
  },
  flagEmoji: { 
    fontSize: 18, 
    marginRight: 6 
  },
  countryCode: { 
    fontSize: 16, 
    color: '#00B761', 
    fontWeight: '600' 
  },
  textInput: { 
    flex: 1, 
    paddingVertical: 16, 
    paddingHorizontal: 12, 
    fontSize: 16, 
    color: '#333' 
  },
  legalSection: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  legalText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: '#00B761',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  sendOtpButton: { 
    backgroundColor: '#00B761', 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginBottom: 24 
  },
  sendOtpText: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  otpContainer: { 
    marginBottom: 24 
  },
  otpLabel: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#333', 
    marginBottom: 8 
  },
  otpSubtext: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 16 
  },
  otpInput: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 16, 
    fontSize: 18, 
    textAlign: 'center', 
    letterSpacing: 4, 
    color: '#333',
    backgroundColor: '#fff',
  },
  verifyButton: { 
    backgroundColor: '#00B761', 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginBottom: 16 
  },
  verifyText: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  resendSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  resendLink: {
    fontSize: 14,
    color: '#00B761',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  backText: { 
    textAlign: 'center', 
    color: '#00B761', 
    fontSize: 16, 
    fontWeight: '500' 
  },
  disabledButton: { 
    backgroundColor: '#cccccc' 
  },
  disabledButtonText: { 
    color: '#888888' 
  },
  disabledText: {
    color: '#cccccc',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});