import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenManager } from '../../utils/tokenManager';
import { logoutManager } from '../../utils/logoutManager';

interface Address {
  id: string;
  type: 'Home' | 'Work' | 'Other';
  address: string;
  landmark?: string;
  isDefault: boolean;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'wallet';
  name: string;
  details: string;
  isDefault: boolean;
}

interface UserState {
  name: string;
  phone: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  addresses: Address[];
  selectedAddress: Address | null;
  paymentMethods: PaymentMethod[];
  isLoggedIn: boolean;
  pushToken?: string;
}

const initialState: UserState = {
  name: '',
  phone: '',
  email: '',
  gender: '',
  dateOfBirth: '',
  addresses: [],
  selectedAddress: null,
  paymentMethods: [],
  isLoggedIn: false,
  pushToken: undefined,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ name: string; phone: string; email?: string; gender?: string; dateOfBirth?: string }>) => {
      state.name = action.payload.name;
      state.phone = action.payload.phone;
      if (action.payload.email !== undefined) state.email = action.payload.email;
      if (action.payload.gender !== undefined) state.gender = action.payload.gender;
      if (action.payload.dateOfBirth !== undefined) state.dateOfBirth = action.payload.dateOfBirth;
      state.isLoggedIn = true;
    },
    addAddress: (state, action: PayloadAction<Address>) => {
      state.addresses.push(action.payload);
      if (action.payload.isDefault) {
        state.selectedAddress = action.payload;
      }
    },
    setSelectedAddress: (state, action: PayloadAction<Address>) => {
      state.selectedAddress = action.payload;
    },
    addPaymentMethod: (state, action: PayloadAction<PaymentMethod>) => {
      state.paymentMethods.push(action.payload);
    },
    removePaymentMethod: (state, action: PayloadAction<string>) => {
      state.paymentMethods = state.paymentMethods.filter(pm => pm.id !== action.payload);
    },
    setPushToken: (state, action: PayloadAction<string>) => {
      state.pushToken = action.payload;
    },
    logout: (state) => {
      // Trigger complete logout process
      logoutManager.performCompleteLogout();
      // Reset to initial state completely
      return initialState;
    },
    checkAuthStatus: (state) => {
      // This will be handled by the async action
    },
  },
});

export const { setUser, addAddress, setSelectedAddress, addPaymentMethod, removePaymentMethod, logout, setPushToken, checkAuthStatus } = userSlice.actions;
export default userSlice.reducer;