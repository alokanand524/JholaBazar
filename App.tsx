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
import notificationService from './src/services/notificationService';

import { MainTabNavigator } from './src/navigation/MainTabNavigator';
import LoadingScreen from './src/screens/LoadingScreen';
import LoginScreen from './src/screens/LoginScreen';
import CartScreen from './src/screens/CartScreen';
import ProductScreen from './src/screens/ProductScreen';
import CategoryScreen from './src/screens/CategoryScreen';
import SearchResultsScreen from './src/screens/SearchResultsScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import AddressesScreen from './src/screens/AddressesScreen';
import AddAddressScreen from './src/screens/AddAddressScreen';
import EditAddressScreen from './src/screens/EditAddressScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import OrderDetailsScreen from './src/screens/OrderDetailsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import MapPickerScreen from './src/screens/MapPickerScreen';
import SelectAddressScreen from './src/screens/SelectAddressScreen';
import FeaturedProductsScreen from './src/screens/FeaturedProductsScreen';
import PopularProductsScreen from './src/screens/PopularProductsScreen';
import AboutScreen from './src/screens/AboutScreen';
import SupportScreen from './src/screens/SupportScreen';
import PaymentsScreen from './src/screens/PaymentsScreen';
import ReferralScreen from './src/screens/ReferralScreen';
import SearchScreen from './src/screens/SearchScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import ProductDetailsScreen from './src/screens/ProductDetailsScreen';
import MapLocationScreen from './src/screens/MapLocationScreen';
import AddressDetailsScreen from './src/screens/AddressDetailsScreen';
import ChatScreen from './src/screens/ChatScreen';
import SplashScreen from './src/screens/SplashScreen';
import AppLoadingScreen from './src/screens/AppLoadingScreen';

const Stack = createStackNavigator();

function App() {
  useEffect(() => {
    // Check auth status when app starts
    checkAuthStatus();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <AppContent />
      </PersistGate>
    </Provider>
  );
}

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
    
    // Initialize Firebase notifications
    notificationService.initialize();
    
    // Debug: Log FCM token
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
        ref={(ref) => notificationService.setNavigationRef(ref)}
      >
        <StatusBar 
          barStyle={isDark ? "light-content" : "dark-content"} 
          backgroundColor={colors.background} 
        />
        <Stack.Navigator 
          initialRouteName="Splash"
          screenOptions={{ headerShown: false }}
        >
              <Stack.Screen name="Splash" component={SplashScreen} />
              <Stack.Screen name="AppLoading" component={AppLoadingScreen} />
              <Stack.Screen name="MainTabs" component={MainTabNavigator} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Cart" component={CartScreen} />
              <Stack.Screen name="Product" component={ProductScreen} />
              <Stack.Screen name="Category" component={CategoryScreen} />
              <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
              <Stack.Screen name="Checkout" component={CheckoutScreen} />
              <Stack.Screen name="Addresses" component={AddressesScreen} />
              <Stack.Screen name="AddAddress" component={AddAddressScreen} />
              <Stack.Screen name="EditAddress" component={EditAddressScreen} />
              <Stack.Screen name="Orders" component={OrdersScreen} />
              <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="EditProfile" component={EditProfileScreen} />
              <Stack.Screen name="MapPicker" component={MapPickerScreen} />
              <Stack.Screen name="SelectAddress" component={SelectAddressScreen} />
              <Stack.Screen name="FeaturedProducts" component={FeaturedProductsScreen} />
              <Stack.Screen name="PopularProducts" component={PopularProductsScreen} />
              <Stack.Screen name="About" component={AboutScreen} />
              <Stack.Screen name="Support" component={SupportScreen} />
              <Stack.Screen name="Payments" component={PaymentsScreen} />
              <Stack.Screen name="Referral" component={ReferralScreen} />
              <Stack.Screen name="Search" component={SearchScreen} />
              <Stack.Screen name="Categories" component={CategoriesScreen} />
              <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
              <Stack.Screen name="MapLocation" component={MapLocationScreen} />
              <Stack.Screen name="AddressDetails" component={AddressDetailsScreen} />
              <Stack.Screen name="Chat" component={ChatScreen} />
              <Stack.Screen name="Debug" component={require('./src/screens/DebugScreen').default} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
