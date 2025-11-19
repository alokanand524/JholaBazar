import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store/store';
import { setUser } from '../store/slices/userSlice';

export const checkAuthStatus = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const userProfile = await AsyncStorage.getItem('userProfile');
    
    if (token && userProfile) {
      const userData = JSON.parse(userProfile);
      store.dispatch(setUser(userData));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
};