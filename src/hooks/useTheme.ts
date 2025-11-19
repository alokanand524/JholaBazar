import { useSelector } from 'react-redux';
import { useColorScheme } from 'react-native';
import { RootState } from '../store/store';

const lightTheme = {
  background: '#ffffff',
  text: '#000000',
  primary: '#00B761',
  border: '#E5E5E5',
  gray: '#8E8E93',
  lightGray: '#F2F2F7',
  card: '#ffffff',
  surface: '#ffffff',
  error: '#FF3B30',
};

const darkTheme = {
  background: '#000000',
  text: '#ffffff',
  primary: '#00B761',
  border: '#2C2C2E',
  gray: '#8E8E93',
  lightGray: '#1C1C1E',
  card: '#1C1C1E',
  surface: '#2C2C2E',
  error: '#FF453A',
};

export const useTheme = () => {
  const uiState = useSelector((state: RootState) => state.ui);
  const { themeMode } = uiState;
  const systemColorScheme = useColorScheme();
  
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
  
  // Debug logging
  console.log('useTheme Debug:', { 
    uiState, 
    themeMode, 
    systemColorScheme, 
    isDark,
    selectedColors: isDark ? 'dark' : 'light'
  });
  
  return {
    colors: isDark ? darkTheme : lightTheme,
    isDark,
    themeMode,
  };
};