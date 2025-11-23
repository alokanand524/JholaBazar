import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Animated,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../hooks/useTheme';
import { RootState, AppDispatch } from '../store/store';
import { logout, setUser } from '../store/slices/userSlice';
import { persistor } from '../store/store';
import { ThemeDropdown } from '../components/ThemeDropdown';
import { tokenManager } from '../utils/tokenManager';
import { logoutManager } from '../utils/logoutManager';

const menuItems = [
  { id: '1', title: 'My Orders', icon: 'shopping-bag', screen: 'Orders' },
  { id: '2', title: 'Addresses', icon: 'location-on', screen: 'Addresses' },
  { id: '3', title: 'Help & Support', icon: 'help', screen: 'Support' },
  { id: '4', title: 'About', icon: 'info', screen: 'About' },
];

export default function ProfileScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { isLoggedIn } = useSelector((state: RootState) => state.user);
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isLoggedIn) {
        fetchUserProfile();
      }
    });
    return unsubscribe;
  }, [navigation, isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchUserProfile();
    }
  }, [isLoggedIn]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await tokenManager.makeAuthenticatedRequest('https://api.jholabazar.com/api/v1/profile');
      const data = await response.json();
      
      if (data.success) {
        setUserProfile(data.data);
        // Update Redux store with fresh data
        dispatch(setUser({
          name: data.data.fullName,
          phone: data.data.phone,
          email: data.data.email,
          gender: data.data.gender,
          dateOfBirth: data.data.dateOfBirth,
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // If token is invalid, logout user
      if (error.message === 'No valid token available') {
        dispatch(logout());
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            try {
              // Use comprehensive logout manager
              await logoutManager.performCompleteLogout();
              dispatch(logout());
              
              // Navigate to login after logout
              navigation.navigate('Login');
              
              // Check if any data remains (for debugging)
              const hasRemainingData = await logoutManager.checkForRemainingUserData();
              if (hasRemainingData) {
                console.warn('Some user data still exists after logout');
              }
            } catch (error) {
              console.error('Logout failed:', error);
              // Fallback: still dispatch logout action
              dispatch(logout());
            }
          }
        },
      ]
    );
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const renderMenuItem = (item: any, index: number) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.menuItem, 
        { borderBottomColor: colors.border },
        index === menuItems.length - 1 && { borderBottomWidth: 0 }
      ]}
      onPress={() => navigation.navigate(item.screen)}
    >
      <View style={styles.menuItemLeft}>
        <Icon name={item.icon} size={24} color={colors.gray} />
        <Text style={[styles.menuItemText, { color: colors.text }]}>
          {item.title}
        </Text>
      </View>
      <Icon name="chevron-right" size={20} color={colors.gray} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Profile
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        {isLoggedIn ? (
          loading ? (
            <UserInfoSkeleton colors={colors} />
          ) : (
            <View style={[styles.userInfo, { backgroundColor: colors.lightGray }]}>
              <View style={styles.avatar}>
                <Icon name="person" size={40} color={colors.primary} />
              </View>
              <View style={styles.userDetails}>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {userProfile?.fullName || 'User'}
                </Text>
                <Text style={[styles.userPhone, { color: colors.gray }]}>
                  +91 {userProfile?.phone || 'XXXXXXXXXX'}
                </Text>
                {userProfile?.email && (
                  <Text style={[styles.userEmail, { color: colors.gray }]}>
                    {userProfile.email}
                  </Text>
                )}
              </View>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => navigation.navigate('EditProfile', { userProfile })}
              >
                <Icon name="edit" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )
        ) : (
          <TouchableOpacity 
            style={[styles.loginPrompt, { backgroundColor: colors.lightGray }]} 
            onPress={handleLogin}
          >
            <View style={styles.avatar}>
              <Icon name="person" size={40} color={colors.gray} />
            </View>
            <View style={styles.loginText}>
              <Text style={[styles.loginTitle, { color: colors.text }]}>
                Login to your account
              </Text>
              <Text style={[styles.loginSubtitle, { color: colors.gray }]}>
                Access your orders and preferences
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.gray} />
          </TouchableOpacity>
        )}

        {/* Theme Selection */}
        {loading ? (
          <ThemeSectionSkeleton colors={colors} />
        ) : (
          <View style={[styles.themeSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.themeSectionHeader, { borderBottomColor: colors.border }]}>
              <Icon name="palette" size={20} color={colors.primary} />
              <Text style={[styles.themeSectionTitle, { color: colors.text }]}>Appearance</Text>
            </View>
            <View style={styles.themeOptions}>
              <Text style={[styles.themeLabel, { color: colors.gray }]}>Theme</Text>
              <ThemeDropdown />
            </View>
          </View>
        )}

        {/* Menu Items */}
        {loading ? (
          <MenuSectionSkeleton colors={colors} />
        ) : (
          <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {menuItems.map(renderMenuItem)}
          </View>
        )}

        {/* Logout Button */}
        {isLoggedIn && (
          loading ? (
            <LogoutButtonSkeleton colors={colors} />
          ) : (
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Icon name="logout" size={24} color="#FF3B30" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          )
        )}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appVersion, { color: colors.gray }]}>
            Jhola Bazar v1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  editButton: {
    padding: 8,
  },
  loginText: {
    flex: 1,
  },
  loginTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  loginSubtitle: {
    fontSize: 14,
  },
  themeSection: {
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  themeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  themeSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  themeLabel: {
    fontSize: 16,
  },
  menuSection: {
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    minHeight: 56,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemText: {
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    padding: 16,
  },
  appVersion: {
    fontSize: 12,
  },
  // Skeleton Styles
  skeleton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  skeletonPulse: {
    opacity: 0.5,
  },
});

// Skeleton Components
const SkeletonBox = ({ width, height, style, colors }: any) => {
  const [pulseAnim] = useState(new Animated.Value(0));
  
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);
  
  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: colors.border,
          borderRadius: 4,
          opacity: pulseAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.7],
          }),
        },
        style,
      ]}
    />
  );
};

const UserInfoSkeleton = ({ colors }: any) => (
  <View style={[styles.userInfo, { backgroundColor: colors.lightGray }]}>
    <SkeletonBox width={60} height={60} style={{ borderRadius: 30 }} colors={colors} />
    <View style={styles.userDetails}>
      <SkeletonBox width={120} height={20} style={{ marginBottom: 8 }} colors={colors} />
      <SkeletonBox width={100} height={16} style={{ marginBottom: 4 }} colors={colors} />
      <SkeletonBox width={140} height={14} colors={colors} />
    </View>
    <SkeletonBox width={24} height={24} colors={colors} />
  </View>
);

const ThemeSectionSkeleton = ({ colors }: any) => (
  <View style={[styles.themeSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={[styles.themeSectionHeader, { borderBottomColor: colors.border }]}>
      <SkeletonBox width={20} height={20} colors={colors} />
      <SkeletonBox width={100} height={18} colors={colors} />
    </View>
    <View style={styles.themeOptions}>
      <SkeletonBox width={60} height={16} colors={colors} />
      <SkeletonBox width={80} height={32} colors={colors} />
    </View>
  </View>
);

const MenuSectionSkeleton = ({ colors }: any) => (
  <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
    {[1, 2, 3, 4].map((item) => (
      <View key={item} style={[styles.menuItem, { borderBottomColor: colors.border }]}>
        <View style={styles.menuItemLeft}>
          <SkeletonBox width={24} height={24} colors={colors} />
          <SkeletonBox width={100} height={16} colors={colors} />
        </View>
        <SkeletonBox width={20} height={20} colors={colors} />
      </View>
    ))}
  </View>
);

const LogoutButtonSkeleton = ({ colors }: any) => (
  <View style={[styles.logoutButton, { borderColor: colors.border }]}>
    <SkeletonBox width={24} height={24} colors={colors} />
    <SkeletonBox width={60} height={16} colors={colors} />
  </View>
);