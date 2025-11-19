import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface UIState {
  isTabBarVisible: boolean;
  themeMode: ThemeMode;
}

const initialState: UIState = {
  isTabBarVisible: true,
  themeMode: 'system',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    hideTabBar: (state) => {
      state.isTabBarVisible = false;
    },
    showTabBar: (state) => {
      state.isTabBarVisible = true;
    },
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      console.log('uiSlice: setThemeMode called with:', action.payload);
      console.log('uiSlice: Previous themeMode:', state.themeMode);
      state.themeMode = action.payload;
      console.log('uiSlice: New themeMode:', state.themeMode);
      // Persist theme preference
      AsyncStorage.setItem('themeMode', action.payload)
        .then(() => console.log('uiSlice: Theme saved to AsyncStorage:', action.payload))
        .catch((error) => console.error('uiSlice: Error saving theme:', error));
    },
    loadThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.themeMode = action.payload;
    },
  },
});

export const { hideTabBar, showTabBar, setThemeMode, loadThemeMode } = uiSlice.actions;
export default uiSlice.reducer;