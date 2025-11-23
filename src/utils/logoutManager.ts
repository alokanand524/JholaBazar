import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistor } from '../store/store';
import { tokenManager } from './tokenManager';

class LogoutManager {
  /**
   * Comprehensive logout function that clears all user data
   */
  async performCompleteLogout(): Promise<void> {
    try {
      console.log('Starting complete logout process...');

      // 1. Clear tokens via tokenManager
      await tokenManager.clearAllTokens();
      console.log('Tokens cleared via tokenManager');

      // 2. Clear all AsyncStorage keys related to user data
      const keysToRemove = [
        'authToken',
        'refreshToken', 
        'userProfile',
        'selectedAddress',
        'userAddresses',
        'cartItems',
        'deliveryInfo',
        'orderHistory',
        'paymentMethods',
        'userPreferences',
        'pushToken',
        'lastLoginTime',
        'userLocation',
        'searchHistory',
        'persist:address',
        'persist:user',
        'persist:cart'
      ];

      await AsyncStorage.multiRemove(keysToRemove);
      console.log('AsyncStorage keys cleared:', keysToRemove);

      // 3. Clear all AsyncStorage (nuclear option)
      await AsyncStorage.clear();
      console.log('Complete AsyncStorage cleared');

      // 4. Purge Redux Persist store
      await persistor.purge();
      console.log('Redux persist store purged');

      // 5. Flush any pending persist operations
      await persistor.flush();
      console.log('Redux persist flushed');

      console.log('Complete logout process finished successfully');
    } catch (error) {
      console.error('Error during logout process:', error);
      // Even if there's an error, try to clear what we can
      try {
        await AsyncStorage.clear();
        await persistor.purge();
      } catch (fallbackError) {
        console.error('Fallback logout also failed:', fallbackError);
      }
    }
  }

  /**
   * Quick logout - only clears essential auth data
   */
  async performQuickLogout(): Promise<void> {
    try {
      const essentialKeys = ['authToken', 'refreshToken', 'userProfile'];
      await AsyncStorage.multiRemove(essentialKeys);
      console.log('Quick logout completed');
    } catch (error) {
      console.error('Quick logout failed:', error);
    }
  }

  /**
   * Check if user data still exists in storage
   */
  async checkForRemainingUserData(): Promise<boolean> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const userDataKeys = keys.filter(key => 
        key.includes('user') || 
        key.includes('auth') || 
        key.includes('token') ||
        key.includes('address') ||
        key.includes('cart')
      );
      
      console.log('Remaining user data keys:', userDataKeys);
      return userDataKeys.length > 0;
    } catch (error) {
      console.error('Error checking remaining data:', error);
      return false;
    }
  }
}

export const logoutManager = new LogoutManager();