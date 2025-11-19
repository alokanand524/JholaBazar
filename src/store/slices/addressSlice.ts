import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AddressState {
  selectedAddress: any;
  addresses: any[];
}

const initialState: AddressState = {
  selectedAddress: null,
  addresses: [],
};

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    setSelectedAddress: (state, action: PayloadAction<any>) => {
      state.selectedAddress = action.payload;
    },
    setAddresses: (state, action: PayloadAction<any[]>) => {
      state.addresses = action.payload;
    },
    clearAddresses: (state) => {
      return initialState;
    },
  },
});

export const { setSelectedAddress, setAddresses, clearAddresses } = addressSlice.actions;
export default addressSlice.reducer;