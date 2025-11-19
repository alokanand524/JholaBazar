import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, PURGE } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';
import cartReducer from './slices/cartSlice';
import addressReducer from './slices/addressSlice';
import ordersReducer from './slices/ordersSlice';
import userReducer from './slices/userSlice';
import uiReducer from './slices/uiSlice';
import productsReducer from './slices/productsSlice';
import categoriesReducer from './slices/categoriesSlice';
import deliveryReducer from './slices/deliverySlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
};

const appReducer = combineReducers({
  user: userReducer,
  cart: cartReducer,
  products: productsReducer,
  ui: uiReducer,
  categories: categoriesReducer,
  delivery: deliveryReducer,
  address: addressReducer,
  orders: ordersReducer,
});

const rootReducer = (state: any, action: any) => {
  if (action.type === 'user/logout') {
    // Force complete state reset - return completely fresh state
    console.log('Redux: Performing complete state reset on logout');
    return appReducer(undefined, { type: '@@INIT' });
  }
  return appReducer(state, action);
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/PURGE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;